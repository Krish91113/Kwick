export interface UploadOptions {
  storageKey: string;
  contentType: string;
  originalName: string;
}

export interface UploadResult {
  storageKey: string;
  bytes: number;
  resourceType: string;
  publicUrl?: string;
  downloadUrl?: string;
}

export interface StorageProvider {
  /**
   * Upload a file buffer to storage.
   */
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a stored object.
   */
  delete(storageKey: string, resourceType?: string): Promise<void>;

  /**
   * Obtain a readable stream for authorized download, if supported by the provider.
   */
  getDownloadStream?(storageKey: string, resourceType?: string): Promise<NodeJS.ReadableStream | null>;

  /**
   * Get an authorized or direct download URL for the file.
   */
  getDownloadUrl?(storageKey: string, resourceType?: string): Promise<string>;
}
