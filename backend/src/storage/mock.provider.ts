import { Readable } from 'stream';
import { StorageProvider, UploadOptions, UploadResult } from './storage.interface';

interface StoredMockObject {
  buffer: Buffer;
  contentType: string;
  originalName: string;
  bytes: number;
}

export class MockStorageProvider implements StorageProvider {
  private store = new Map<string, StoredMockObject>();

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const isImage = options.contentType.startsWith('image/');
    const resourceType = isImage ? 'image' : 'raw';

    this.store.set(options.storageKey, {
      buffer: Buffer.from(file),
      contentType: options.contentType,
      originalName: options.originalName,
      bytes: file.length
    });

    return {
      storageKey: options.storageKey,
      bytes: file.length,
      resourceType,
      publicUrl: `https://mock-storage.local/${options.storageKey}`,
      downloadUrl: `https://mock-storage.local/download/${options.storageKey}`
    };
  }

  async delete(storageKey: string): Promise<void> {
    this.store.delete(storageKey);
  }

  async getDownloadStream(storageKey: string): Promise<NodeJS.ReadableStream | null> {
    const item = this.store.get(storageKey);
    if (!item) {
      return null;
    }
    return Readable.from(item.buffer);
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return `https://mock-storage.local/download/${storageKey}`;
  }

  has(storageKey: string): boolean {
    return this.store.has(storageKey);
  }

  clear(): void {
    this.store.clear();
  }
}
