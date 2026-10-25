import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../../utils/errors';
import {
  createFileShareSchema,
  createTextShareSchema,
  deleteShareSchema,
  shareIdParamSchema,
  shortCodeParamSchema
} from './share.validation';
import { shareService } from './share.service';

export class ShareController {
  /**
   * POST /api/v1/shares - Create a text share
   */
  async createTextShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validatedBody = createTextShareSchema.parse(req.body);
      const result = await shareService.createTextShare(validatedBody);

      res.status(201).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/shares/file - Upload and create a file share
   */
  async createFileShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new BadRequestError('No file was uploaded. Please provide a file under the "file" field.', 'MISSING_FILE');
      }

      const validatedBody = createFileShareSchema.parse(req.body);
      const result = await shareService.createFileShare(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        validatedBody
      );

      res.status(201).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/shares/:shareId - Retrieve share metadata
   */
  async getShareById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shareId } = shareIdParamSchema.parse(req.params);
      const result = await shareService.getShareById(shareId);

      res.status(200).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/s/:shortCode & GET /s/:shortCode - Resolve short code
   */
  async resolveShortCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shortCode } = shortCodeParamSchema.parse(req.params);
      const result = await shareService.getShareByShortCode(shortCode);

      res.status(200).json({
        success: true,
        data: result,
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/shares/:shareId/content - Retrieve raw content
   */
  async getShareContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shareId } = shareIdParamSchema.parse(req.params);
      const result = await shareService.getShareContent(shareId);

      if (result.type === 'text') {
        res.setHeader('Content-Type', result.mimeType);
        res.send(result.content);
        return;
      }

      // If file share, redirect to download route
      res.redirect(`/api/v1/shares/${shareId}/download`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/shares/:shareId/download - Authorize and stream file download
   */
  async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shareId } = shareIdParamSchema.parse(req.params);
      const download = await shareService.authorizeDownload(shareId);

      // Security headers to prevent execution of downloaded files
      res.setHeader('Content-Type', download.mimeType || 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${download.filename}"; filename*=UTF-8''${encodeURIComponent(download.filename)}`
      );
      res.setHeader('Content-Length', download.sizeBytes);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Security-Policy', "default-src 'none'");

      if (download.stream) {
        download.stream.pipe(res);
      } else if (download.downloadUrl) {
        res.redirect(download.downloadUrl);
      } else {
        throw new BadRequestError('File download source is unavailable.', 'DOWNLOAD_UNAVAILABLE');
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/shares/:shareId - Delete share with capability token
   */
  async deleteShare(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { shareId } = shareIdParamSchema.parse(req.params);

      // Support capability token passed via header, query, or body
      const rawToken =
        req.headers['x-delete-token'] ||
        req.query.token ||
        (req.body && req.body.deleteToken);

      const { deleteToken } = deleteShareSchema.parse({
        deleteToken: typeof rawToken === 'string' ? rawToken : ''
      });

      await shareService.deleteShare(shareId, deleteToken);

      res.status(200).json({
        success: true,
        data: {
          shareId,
          message: 'Share deleted successfully.'
        },
        requestId: req.id
      });
    } catch (error) {
      next(error);
    }
  }
}

export const shareController = new ShareController();
