import { env } from '../config/env';
import { StorageProvider } from './storage.interface';
import { CloudinaryStorageProvider } from './cloudinary.provider';
import { MockStorageProvider } from './mock.provider';

let storageInstance: StorageProvider;

export function getStorageProvider(): StorageProvider {
  if (!storageInstance) {
    if (env.STORAGE_PROVIDER === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      storageInstance = new CloudinaryStorageProvider();
    } else {
      if (env.STORAGE_PROVIDER === 'cloudinary') {
        console.warn('Cloudinary credentials missing or incomplete; falling back to MockStorageProvider.');
      }
      storageInstance = new MockStorageProvider();
    }
  }
  return storageInstance;
}

export function setStorageProvider(customProvider: StorageProvider): void {
  storageInstance = customProvider;
}

export * from './storage.interface';
export * from './mock.provider';
export * from './cloudinary.provider';
