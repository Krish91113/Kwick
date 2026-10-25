import { Request, Response } from 'express';
import { isDatabaseConnected } from '../../config/database';

export class HealthController {
  /**
   * GET /health - Basic process liveness check
   */
  getHealth(req: Request, res: Response): void {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      },
      requestId: req.id
    });
  }

  /**
   * GET /ready - Database and dependency readiness check
   */
  getReadiness(req: Request, res: Response): void {
    const dbConnected = isDatabaseConnected();

    if (!dbConnected) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database service is not ready.'
        },
        requestId: req.id
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString()
      },
      requestId: req.id
    });
  }
}

export const healthController = new HealthController();
