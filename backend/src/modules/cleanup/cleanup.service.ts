import { getStorageProvider } from '../../storage';
import { shareRepository, ShareRepository } from '../shares/share.repository';

export interface CleanupResult {
  jobId: string;
  processedCount: number;
  filesDeletedCount: number;
  recordsCleanedCount: number;
  failureCount: number;
  durationMs: number;
}

export class CleanupService {
  constructor(private repo: ShareRepository = shareRepository) {}

  /**
   * Run cleanup on expired or deleted shares in batches.
   * Cleans up Cloudinary assets and removes or updates expired share records.
   */
  async runCleanup(batchSize = 50): Promise<CleanupResult> {
    const startTime = Date.now();
    const jobId = `cleanup_${Date.now()}`;
    const storageProvider = getStorageProvider();

    let processedCount = 0;
    let filesDeletedCount = 0;
    let recordsCleanedCount = 0;
    let failureCount = 0;

    console.log(`[${jobId}] Starting scheduled share cleanup job (batch size: ${batchSize})...`);

    try {
      const expiredShares = await this.repo.findExpiredPendingCleanup(batchSize);
      processedCount = expiredShares.length;

      for (const share of expiredShares) {
        try {
          // If file share, remove Cloudinary/storage object
          if (share.file?.storageKey) {
            try {
              await storageProvider.delete(share.file.storageKey, share.file.resourceType);
              filesDeletedCount++;
            } catch (storageError) {
              console.error(
                `[${jobId}] Failed to delete file asset for share ${share.shareId} (${share.file.storageKey}):`,
                storageError instanceof Error ? storageError.message : storageError
              );
              // Do not abort entire batch; increment failure count and continue
              failureCount++;
            }
          }

          // Permanently remove expired record from DB or update to 'deleted'
          await this.repo.deletePermanently(share.shareId);
          recordsCleanedCount++;
        } catch (itemError) {
          failureCount++;
          console.error(
            `[${jobId}] Failed to cleanup share record ${share.shareId}:`,
            itemError instanceof Error ? itemError.message : itemError
          );
        }
      }
    } catch (batchError) {
      console.error(`[${jobId}] Batch cleanup query failed:`, batchError);
    }

    const durationMs = Date.now() - startTime;
    console.log(
      `[${jobId}] Cleanup completed: ${processedCount} processed, ${filesDeletedCount} files removed, ${recordsCleanedCount} records purged, ${failureCount} failures (${durationMs}ms)`
    );

    return {
      jobId,
      processedCount,
      filesDeletedCount,
      recordsCleanedCount,
      failureCount,
      durationMs
    };
  }
}

export const cleanupService = new CleanupService();
