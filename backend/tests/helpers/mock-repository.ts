import { IShareDocument } from '../../src/modules/shares/share.model';
import { IShare, ShareStatus } from '../../src/modules/shares/share.types';

export class InMemoryShareRepository {
  private items = new Map<string, IShare>();

  async create(data: Partial<IShare>): Promise<IShareDocument> {
    const doc: IShare = {
      shareId: data.shareId!,
      shortCode: data.shortCode,
      type: data.type!,
      title: data.title,
      textContent: data.textContent,
      language: data.language || 'plaintext',
      file: data.file,
      createdAt: data.createdAt || new Date(),
      expiresAt: data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: (data.status || 'active') as ShareStatus,
      viewCount: data.viewCount || 0,
      downloadCount: data.downloadCount || 0,
      deleteTokenHash: data.deleteTokenHash
    };

    this.items.set(doc.shareId, doc);
    return doc as unknown as IShareDocument;
  }

  async findByShareId(shareId: string, includeSecret = false): Promise<IShareDocument | null> {
    const item = this.items.get(shareId);
    if (!item) return null;

    const copy = { ...item };
    if (!includeSecret) {
      delete copy.deleteTokenHash;
    }
    return copy as unknown as IShareDocument;
  }

  setShareExpiry(shareId: string, expiresAt: Date): void {
    const item = this.items.get(shareId);
    if (item) {
      item.expiresAt = expiresAt;
    }
  }

  async findByShortCode(shortCode: string): Promise<IShareDocument | null> {
    for (const item of this.items.values()) {
      if (item.shortCode === shortCode) {
        const copy = { ...item };
        delete copy.deleteTokenHash;
        return copy as unknown as IShareDocument;
      }
    }
    return null;
  }

  async shortCodeExists(shortCode: string): Promise<boolean> {
    for (const item of this.items.values()) {
      if (item.shortCode === shortCode) return true;
    }
    return false;
  }

  async incrementViewCount(shareId: string): Promise<void> {
    const item = this.items.get(shareId);
    if (item) {
      item.viewCount += 1;
    }
  }

  async incrementDownloadCount(shareId: string): Promise<void> {
    const item = this.items.get(shareId);
    if (item) {
      item.downloadCount += 1;
    }
  }

  async updateStatus(shareId: string, status: ShareStatus): Promise<void> {
    const item = this.items.get(shareId);
    if (item) {
      item.status = status;
    }
  }

  async deletePermanently(shareId: string): Promise<void> {
    this.items.delete(shareId);
  }

  async findExpiredPendingCleanup(batchSize = 50): Promise<IShareDocument[]> {
    const now = new Date();
    const results: IShareDocument[] = [];
    for (const item of this.items.values()) {
      if (
        (item.expiresAt.getTime() <= now.getTime() && item.status !== 'deleted') ||
        (item.status === 'deleted' && item.file?.storageKey)
      ) {
        results.push({ ...item } as unknown as IShareDocument);
        if (results.length >= batchSize) break;
      }
    }
    return results;
  }

  clear(): void {
    this.items.clear();
  }
}
