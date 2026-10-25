import multer from 'multer';
import { env } from '../../config/env';

// Store in memory buffer so we can validate magic bytes and stream to Cloudinary
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_BYTES,
    files: 1 // Single file per upload
  }
});
