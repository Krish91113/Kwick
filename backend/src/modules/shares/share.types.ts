export type ShareType = 'text' | 'file';
export type ShareStatus = 'active' | 'expired' | 'deleted';
export type ExpiryDuration = '1h' | '24h' | '7d';

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  resourceType?: string;
  publicUrl?: string;
}

export interface IShare {
  shareId: string;
  shortCode?: string;
  type: ShareType;
  title?: string;
  textContent?: string;
  language?: string;
  file?: FileMetadata;
  createdAt: Date;
  expiresAt: Date;
  status: ShareStatus;
  viewCount: number;
  downloadCount: number;
  deleteTokenHash?: string;
}

export interface CreateTextShareDto {
  title?: string;
  textContent: string;
  language?: string;
  expiresIn?: ExpiryDuration;
}

export interface CreateFileShareDto {
  title?: string;
  expiresIn?: ExpiryDuration;
}

export interface ShareResponseData {
  shareId: string;
  shortCode?: string;
  type: ShareType;
  title?: string;
  textContent?: string;
  language?: string;
  file?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    publicUrl?: string;
  };
  shareUrl: string;
  qrUrl: string;
  contentUrl: string;
  downloadUrl?: string;
  createdAt: string;
  expiresAt: string;
  status: ShareStatus;
  viewCount: number;
  downloadCount: number;
  deleteToken?: string; // Only returned on creation
}
