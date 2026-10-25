export type ActiveTab = 'share' | 'tools' | 'enter-code' | 'how-it-works' | 'recipient-view';

export type TtlOption = '1h' | '24h' | '7d';

export interface ShareItem {
  shareId: string;
  shortCode: string;
  type: 'text' | 'file';
  title: string;
  textContent?: string;
  language?: string;
  file?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    downloadUrl?: string;
    publicUrl?: string;
  };
  shareUrl: string;
  createdAt: string;
  expiresAt: string;
  deleteToken?: string;
}

export interface RecentDrop {
  shortCode: string;
  title: string;
  type: 'text' | 'file';
  sizeFormatted: string;
  expiresInText: string;
  isExpired: boolean;
  timestamp: number;
}
