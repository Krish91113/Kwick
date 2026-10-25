import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

const noopMiddleware = (_req: Request, _res: Response, next: NextFunction) => next();

const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.'
    },
    requestId: req.id
  });
};

/**
 * General API rate limit: 100 requests per 15 minutes per IP
 */
export const generalLimiter = env.NODE_ENV === 'test'
  ? noopMiddleware
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler
    });

/**
 * File upload rate limit: 5 uploads per hour per IP (as per FR-02)
 */
export const uploadLimiter = env.NODE_ENV === 'test'
  ? noopMiddleware
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req: Request, res: Response) => {
        res.status(429).json({
          success: false,
          error: {
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            message: 'Upload limit reached. Maximum 5 uploads per hour allowed.'
          },
          requestId: req.id
        });
      }
    });

/**
 * Text share creation rate limit: 20 per hour per IP
 */
export const createShareLimiter = env.NODE_ENV === 'test'
  ? noopMiddleware
  : rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 20,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler
    });

/**
 * Short code resolution rate limit: 60 per minute per IP
 */
export const shortCodeLimiter = env.NODE_ENV === 'test'
  ? noopMiddleware
  : rateLimit({
      windowMs: 1 * 60 * 1000,
      max: 60,
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitHandler
    });
