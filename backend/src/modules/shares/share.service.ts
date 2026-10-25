import { env } from '../../config/env';
import { getStorageProvider } from '../../storage';
import {
  BadRequestError,
  ExpiredError,
  NotFoundError,
  PayloadTooLargeError,
  UnauthorizedError
} from '../../utils/errors';
import { validateUploadedFile } from '../../utils/file-validator';
import {
  calculateExpiryDate,
  generateDeleteToken,
  generateShareId,
  generateShortCode,
  hashToken
} from '../../utils/ids';
import { IShareDocument } from './share.model';
import { ShareRepository, shareRepository } from './share.repository';
import {
  CreateFileShareDto,
  CreateTextShareDto,
  IShare,
  ShareResponseData
} from './share.types';

export class ShareService {
  constructor(private repo: ShareRepository = shareRepository) {}

  /**
   * Helper to generate a collision-free short code
   */
  private async generateUniqueShortCode(attempts = 5): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      const code = generateShortCode(6);
      const exists = await this.repo.shortCodeExists(code);
      if (!exists) {
        return code;
      }
    }
    // Fallback to slightly longer code if collisions occur
    return generateShortCode(8);
  }

  /**
   * Format a database document into the public API response structure
   */
  public formatShareResponse(
    doc: IShareDocument,
    deleteToken?: string
  ): ShareResponseData {
    const baseUrl = env.PUBLIC_APP_URL.replace(/\/$/, '');
    const frontendUrl = env.FRONTEND_ORIGIN.replace(/\/$/, '');

    const shareUrl = `${frontendUrl}/#d=${doc.shortCode}`;
    const qrUrl = `${frontendUrl}/#d=${doc.shortCode}`;
    const contentUrl = `${baseUrl}/api/v1/shares/${doc.shareId}/content`;
    const downloadUrl =
      doc.type === 'file'
        ? `${baseUrl}/api/v1/shares/${doc.shareId}/download`
        : undefined;

    return {
      shareId: doc.shareId,
      shortCode: doc.shortCode,
      type: doc.type,
      title: doc.title,
      textContent: doc.textContent,
      language: doc.language,
      file: doc.file
        ? {
            originalName: doc.file.originalName,
            mimeType: doc.file.mimeType,
            sizeBytes: doc.file.sizeBytes,
            publicUrl: doc.file.publicUrl
          }
        : undefined,
      shareUrl,
      qrUrl,
      contentUrl,
      downloadUrl,
      createdAt: doc.createdAt.toISOString(),
      expiresAt: doc.expiresAt.toISOString(),
      status: doc.status,
      viewCount: doc.viewCount,
      downloadCount: doc.downloadCount,
      deleteToken
    };
  }

  /**
   * Create a new temporary text share
   */
  async createTextShare(dto: CreateTextShareDto): Promise<ShareResponseData> {
    const textBytes = Buffer.byteLength(dto.textContent, 'utf8');
    if (textBytes > env.MAX_TEXT_SIZE_BYTES) {
      throw new PayloadTooLargeError(
        `Text content exceeds maximum limit of ${env.MAX_TEXT_SIZE_BYTES} bytes.`
      );
    }

    const shareId = generateShareId();
    const shortCode = await this.generateUniqueShortCode();
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashToken(deleteToken);
    const expiresAt = calculateExpiryDate(dto.expiresIn);

    const share = await this.repo.create({
      shareId,
      shortCode,
      type: 'text',
      title: dto.title,
      textContent: dto.textContent,
      language: dto.language || 'plaintext',
      createdAt: new Date(),
      expiresAt,
      status: 'active',
      viewCount: 0,
      downloadCount: 0,
      deleteTokenHash
    });

    return this.formatShareResponse(share, deleteToken);
  }

  /**
   * Create a new temporary file share
   */
  async createFileShare(
    fileBuffer: Buffer,
    originalFilename: string,
    clientMimeType?: string,
    dto?: CreateFileShareDto
  ): Promise<ShareResponseData> {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new BadRequestError('File content is empty or missing.', 'EMPTY_FILE');
    }

    if (fileBuffer.length > env.MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeError(
        `File size (${fileBuffer.length} bytes) exceeds limit of ${env.MAX_FILE_SIZE_BYTES} bytes.`
      );
    }

    // Inspect magic bytes and extension
    const validated = await validateUploadedFile(
      fileBuffer,
      originalFilename,
      clientMimeType
    );

    const shareId = generateShareId();
    const shortCode = await this.generateUniqueShortCode();
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashToken(deleteToken);
    const expiresAt = calculateExpiryDate(dto?.expiresIn);

    const storageKey = `kwickdrop_${shareId}_${Date.now()}`;
    const storageProvider = getStorageProvider();

    // 1. Upload to storage provider
    let uploadResult;
    try {
      uploadResult = await storageProvider.upload(fileBuffer, {
        storageKey,
        contentType: validated.detectedMimeType,
        originalName: validated.sanitizedName
      });
    } catch (uploadError) {
      console.error('Storage upload failed:', uploadError);
      throw new BadRequestError(
        'Failed to store uploaded file. Please try again.',
        'STORAGE_UPLOAD_ERROR'
      );
    }

    // 2. Persist in database; roll back storage if DB save fails
    try {
      const share = await this.repo.create({
        shareId,
        shortCode,
        type: 'file',
        title: dto?.title || validated.sanitizedName,
        file: {
          originalName: validated.sanitizedName,
          mimeType: validated.detectedMimeType,
          sizeBytes: fileBuffer.length,
          storageKey: uploadResult.storageKey,
          resourceType: uploadResult.resourceType,
          publicUrl: uploadResult.publicUrl
        },
        createdAt: new Date(),
        expiresAt,
        status: 'active',
        viewCount: 0,
        downloadCount: 0,
        deleteTokenHash
      });

      return this.formatShareResponse(share, deleteToken);
    } catch (dbError) {
      console.error('Database write failed, rolling back uploaded file:', dbError);
      try {
        await storageProvider.delete(uploadResult.storageKey, uploadResult.resourceType);
      } catch (rollbackError) {
        console.error('Rollback deletion failed:', rollbackError);
      }
      throw dbError;
    }
  }

  /**
   * Internal validator to enforce real-time expiration and active status
   */
  private async validateAndCheckExpiration(share: IShareDocument): Promise<void> {
    if (share.status === 'deleted') {
      throw new NotFoundError('Share not found or has been deleted.', 'SHARE_NOT_FOUND');
    }

    const now = new Date();
    if (share.expiresAt.getTime() <= now.getTime()) {
      // Mark as expired in DB
      if (share.status !== 'expired') {
        await this.repo.updateStatus(share.shareId, 'expired');
      }
      throw new ExpiredError('This share has expired.', 'SHARE_EXPIRED');
    }

    if (share.status === 'expired') {
      throw new ExpiredError('This share has expired.', 'SHARE_EXPIRED');
    }
  }

  /**
   * Retrieve share metadata and content by shareId
   */
  async getShareById(shareId: string): Promise<ShareResponseData> {
    const share = await this.repo.findByShareId(shareId);
    if (!share) {
      throw new NotFoundError('Share not found.', 'SHARE_NOT_FOUND');
    }

    await this.validateAndCheckExpiration(share);
    await this.repo.incrementViewCount(shareId);
    share.viewCount += 1;

    return this.formatShareResponse(share);
  }

  /**
   * Resolve short code to share
   */
  async getShareByShortCode(shortCode: string): Promise<ShareResponseData> {
    const share = await this.repo.findByShortCode(shortCode);
    if (!share) {
      throw new NotFoundError('Share with this code was not found.', 'SHORT_CODE_NOT_FOUND');
    }

    await this.validateAndCheckExpiration(share);
    await this.repo.incrementViewCount(share.shareId);
    share.viewCount += 1;

    return this.formatShareResponse(share);
  }

  /**
   * Retrieve raw share content
   */
  async getShareContent(shareId: string): Promise<{
    type: 'text' | 'file';
    content?: string;
    mimeType: string;
    filename?: string;
  }> {
    const share = await this.repo.findByShareId(shareId);
    if (!share) {
      throw new NotFoundError('Share not found.', 'SHARE_NOT_FOUND');
    }

    await this.validateAndCheckExpiration(share);
    await this.repo.incrementViewCount(shareId);

    if (share.type === 'text') {
      return {
        type: 'text',
        content: share.textContent || '',
        mimeType: 'text/plain; charset=utf-8'
      };
    }

    return {
      type: 'file',
      mimeType: share.file?.mimeType || 'application/octet-stream',
      filename: share.file?.originalName
    };
  }

  /**
   * Authorize file download and return stream or download URL
   */
  async authorizeDownload(shareId: string): Promise<{
    filename: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl?: string;
    stream?: NodeJS.ReadableStream | null;
  }> {
    const share = await this.repo.findByShareId(shareId);
    if (!share || !share.file) {
      throw new NotFoundError('File share not found.', 'SHARE_NOT_FOUND');
    }

    await this.validateAndCheckExpiration(share);
    await this.repo.incrementDownloadCount(shareId);

    const storageProvider = getStorageProvider();
    let stream: NodeJS.ReadableStream | null = null;
    let downloadUrl: string | undefined = undefined;

    if (storageProvider.getDownloadStream) {
      try {
        stream = await storageProvider.getDownloadStream(
          share.file.publicUrl || share.file.storageKey,
          share.file.resourceType
        );
      } catch (streamErr) {
        console.warn('Direct stream fetch failed, falling back to downloadUrl:', streamErr);
      }
    }

    if (!stream && storageProvider.getDownloadUrl) {
      downloadUrl = await storageProvider.getDownloadUrl(
        share.file.storageKey,
        share.file.resourceType
      );
    } else if (!stream && share.file.publicUrl) {
      downloadUrl = share.file.publicUrl;
    }

    return {
      filename: share.file.originalName,
      mimeType: share.file.mimeType,
      sizeBytes: share.file.sizeBytes,
      downloadUrl,
      stream
    };
  }

  /**
   * Delete a share using its capability token
   */
  async deleteShare(shareId: string, deleteToken: string): Promise<void> {
    const share = await this.repo.findByShareId(shareId, true);
    if (!share) {
      throw new NotFoundError('Share not found.', 'SHARE_NOT_FOUND');
    }

    if (!share.deleteTokenHash) {
      throw new UnauthorizedError('This share does not have a deletion token.');
    }

    const providedHash = hashToken(deleteToken);
    if (providedHash !== share.deleteTokenHash) {
      throw new UnauthorizedError('Invalid deletion capability token.');
    }

    // If file share, remove object from storage provider
    if (share.file?.storageKey) {
      try {
        const storageProvider = getStorageProvider();
        await storageProvider.delete(share.file.storageKey, share.file.resourceType);
      } catch (storageError) {
        console.error(`Failed to delete storage asset for share ${shareId}:`, storageError);
      }
    }

    await this.repo.updateStatus(shareId, 'deleted');
  }
}

export const shareService = new ShareService();
