import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { env } from './config/env';
import { startCleanupJob, stopCleanupJob } from './jobs/cleanup-expired-shares';

async function bootstrap() {
  console.log(`Starting Kwick Backend [${env.NODE_ENV}]...`);
  console.log('Brand: Built by Krish | Tagline: Drop it. Scan it. Share it.');

  // Connect to MongoDB Atlas / Local
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    console.log(`Server is running at ${env.PUBLIC_APP_URL || `http://localhost:${env.PORT}`}`);
    console.log(`Health check: ${env.PUBLIC_APP_URL}/health`);
    console.log(`Readiness: ${env.PUBLIC_APP_URL}/ready`);
    console.log(`API base: ${env.PUBLIC_APP_URL}/api/v1`);
  });

  // Start scheduled cleanup worker
  startCleanupJob();

  // Graceful shutdown handling
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    stopCleanupJob();

    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDatabase();
      console.log('Graceful shutdown completed.');
      process.exit(0);
    });

    // Force exit after 10s if hanging
    setTimeout(() => {
      console.error('Could not close connections in time, forcefully shutting down.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
