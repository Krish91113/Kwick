import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { generalLimiter } from './middleware/rate-limit';
import { requestIdMiddleware } from './middleware/request-id';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { healthRoutes } from './modules/health/health.routes';
import { shareRoutes } from './modules/shares/share.routes';
import { shareController } from './modules/shares/share.controller';

export function createApp(): Application {
  const app = express();

  // 1. Security Headers & CORS
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN === '*' ? true : [env.FRONTEND_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Delete-Token', 'X-Request-Id']
    })
  );

  // 2. Request Identification & Logging
  app.use(requestIdMiddleware);
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms [req-id: :res[x-request-id]]'));
  }

  // 3. Body Parsers with limits
  app.use(express.json({ limit: '200kb' }));
  app.use(express.urlencoded({ extended: true, limit: '200kb' }));

  // 4. Global Rate Limiter
  if (env.NODE_ENV !== 'test') {
    app.use(generalLimiter);
  }

  // 5. Health Probes
  app.use('/', healthRoutes);

  // Direct short-link resolution shortcut: GET /s/:shortCode
  app.get('/s/:shortCode', (req: Request, res: Response, next) =>
    shareController.resolveShortCode(req, res, next)
  );

  // 6. API v1 Routes
  app.use('/api/v1', shareRoutes);

  // 7. Not Found and Error Handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
