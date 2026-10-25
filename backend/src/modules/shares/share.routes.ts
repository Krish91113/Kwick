import { Router } from 'express';
import {
  createShareLimiter,
  shortCodeLimiter,
  uploadLimiter
} from '../../middleware/rate-limit';
import { uploadMiddleware } from '../uploads/upload.middleware';
import { shareController } from './share.controller';

const router = Router();

// Text shares
router.post(
  '/shares',
  createShareLimiter,
  (req, res, next) => shareController.createTextShare(req, res, next)
);

// File uploads
router.post(
  '/shares/file',
  uploadLimiter,
  uploadMiddleware.single('file'),
  (req, res, next) => shareController.createFileShare(req, res, next)
);

// Short code resolution
router.get(
  '/s/:shortCode',
  shortCodeLimiter,
  (req, res, next) => shareController.resolveShortCode(req, res, next)
);

// Retrieve share metadata
router.get(
  '/shares/:shareId',
  (req, res, next) => shareController.getShareById(req, res, next)
);

// Retrieve raw content (text content or file redirect)
router.get(
  '/shares/:shareId/content',
  (req, res, next) => shareController.getShareContent(req, res, next)
);

// Authorize and stream file download
router.get(
  '/shares/:shareId/download',
  (req, res, next) => shareController.downloadFile(req, res, next)
);

// Delete share (and any stored file) with capability token
router.delete(
  '/shares/:shareId',
  (req, res, next) => shareController.deleteShare(req, res, next)
);

// Delete stored object as part of authorized deletion
router.delete(
  '/shares/:shareId/file',
  (req, res, next) => shareController.deleteShare(req, res, next)
);

export const shareRoutes = router;
