import { env } from '../config/env';
import { cleanupService } from '../modules/cleanup/cleanup.service';

let intervalTimer: NodeJS.Timeout | null = null;
let isJobRunning = false;

export function startCleanupJob(): void {
  if (intervalTimer) {
    return;
  }

  const intervalMs = env.CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  console.log(`Starting cleanup worker with interval: every ${env.CLEANUP_INTERVAL_MINUTES} minutes.`);

  // Run initial pass after 1 minute startup delay to let DB connect
  setTimeout(async () => {
    try {
      await runCleanupSafely();
    } catch (e) {
      console.error('Initial cleanup run error:', e);
    }
  }, 60 * 1000);

  intervalTimer = setInterval(async () => {
    await runCleanupSafely();
  }, intervalMs);
}

export function stopCleanupJob(): void {
  if (intervalTimer) {
    clearInterval(intervalTimer);
    intervalTimer = null;
    console.log('Cleanup worker stopped.');
  }
}

async function runCleanupSafely(): Promise<void> {
  if (isJobRunning) {
    console.log('Cleanup job is already in progress, skipping interval run.');
    return;
  }

  isJobRunning = true;
  try {
    await cleanupService.runCleanup();
  } catch (err) {
    console.error('Scheduled cleanup worker encountered an unhandled error:', err);
  } finally {
    isJobRunning = false;
  }
}
