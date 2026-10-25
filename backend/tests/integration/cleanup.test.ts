import { CleanupService } from '../../src/modules/cleanup/cleanup.service';
import { setStorageProvider } from '../../src/storage';
import { MockStorageProvider } from '../../src/storage/mock.provider';
import { InMemoryShareRepository } from '../helpers/mock-repository';

describe('Integration: Cleanup Service', () => {
  let mockRepo: InMemoryShareRepository;
  let mockStorage: MockStorageProvider;
  let cleanupService: CleanupService;

  beforeEach(() => {
    mockRepo = new InMemoryShareRepository();
    mockStorage = new MockStorageProvider();
    setStorageProvider(mockStorage);
    cleanupService = new CleanupService(mockRepo as unknown as any);
  });

  it('should purge expired shares and delete their storage assets while preserving active shares', async () => {
    // 1. Upload assets to mock storage
    await mockStorage.upload(Buffer.from('expired file'), {
      storageKey: 'expired_key',
      contentType: 'text/plain',
      originalName: 'expired.txt'
    });

    await mockStorage.upload(Buffer.from('active file'), {
      storageKey: 'active_key',
      contentType: 'text/plain',
      originalName: 'active.txt'
    });

    // 2. Insert records into repository: one expired, one active
    await mockRepo.create({
      shareId: 'kd_expired_share',
      type: 'file',
      expiresAt: new Date(Date.now() - 60000), // Expired 1 minute ago
      status: 'active',
      file: {
        originalName: 'expired.txt',
        mimeType: 'text/plain',
        sizeBytes: 12,
        storageKey: 'expired_key'
      }
    });

    await mockRepo.create({
      shareId: 'kd_active_share',
      type: 'file',
      expiresAt: new Date(Date.now() + 60000 * 60), // Expires in 1 hour
      status: 'active',
      file: {
        originalName: 'active.txt',
        mimeType: 'text/plain',
        sizeBytes: 11,
        storageKey: 'active_key'
      }
    });

    // 3. Run cleanup
    const result = await cleanupService.runCleanup();

    expect(result.processedCount).toBe(1);
    expect(result.filesDeletedCount).toBe(1);
    expect(result.recordsCleanedCount).toBe(1);
    expect(result.failureCount).toBe(0);

    // 4. Verify expired file was deleted from storage and active file remains
    expect(mockStorage.has('expired_key')).toBe(false);
    expect(mockStorage.has('active_key')).toBe(true);

    // 5. Verify expired share record was purged from repository and active share remains
    const expiredRecord = await mockRepo.findByShareId('kd_expired_share');
    const activeRecord = await mockRepo.findByShareId('kd_active_share');

    expect(expiredRecord).toBeNull();
    expect(activeRecord).not.toBeNull();
  });
});
