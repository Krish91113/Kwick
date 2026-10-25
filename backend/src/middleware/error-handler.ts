import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.id || 'unknown';

  // 1. Handled AppError instances
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {})
      },
      requestId
    });
    return;
  }

  // 2. Zod Validation Errors (Zod v3/v4 compatibility)
  if (err instanceof ZodError) {
    const rawIssues = (err as unknown as { issues?: Array<{ path: Array<string | number>; message: string }> }).issues || [];
    const formattedErrors = rawIssues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join('.') : '',
      message: e.message
    }));

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: rawIssues[0]?.message || 'Request validation failed',
        details: formattedErrors
      },
      requestId
    });
    return;
  }

  // 3. Multer Upload Errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `Uploaded file exceeds the maximum allowed limit of ${Math.round(
            env.MAX_FILE_SIZE_BYTES / (1024 * 1024)
          )} MB.`
        },
        requestId
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message
      },
      requestId
    });
    return;
  }

  // 4. Mongoose Duplicate Key Error
  if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000) {
    res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RESOURCE',
        message: 'A resource with this identifier already exists.'
      },
      requestId
    });
    return;
  }

  // 5. Unhandled / Internal Errors
  console.error(`[Unhandled Error] Request ID: ${requestId}:`, err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred.'
    },
    requestId
  });
}
