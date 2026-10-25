import { ShareItem, TtlOption } from '../types';
import { saveFullShare, getLocalShare } from '../utils/storage';

const API_BASE = import.meta.env.VITE_API_URL || '';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  requestId: string;
}

export interface HealthData {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface BackendSharePayload {
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
  };
  shareUrl: string;
  qrUrl?: string;
  contentUrl?: string;
  downloadUrl?: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  viewCount?: number;
  downloadCount?: number;
  deleteToken?: string;
}

/**
 * Check backend process health
 */
export async function checkBackendHealth(): Promise<HealthData | null> {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const body: ApiResponse<HealthData> = await res.json();
    return body.data;
  } catch {
    return null;
  }
}

/**
 * Create a new text/code share
 */
export async function createTextShare(params: {
  title: string;
  textContent: string;
  language?: string;
  expiresIn: TtlOption;
}): Promise<ShareItem> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: params.title.trim() || 'Untitled Drop',
        textContent: params.textContent,
        language: params.language || 'plaintext',
        expiresIn: params.expiresIn,
      }),
    });

    if (res.ok) {
      const json: ApiResponse<BackendSharePayload> = await res.json();
      const share = mapBackendToShareItem(json.data);
      saveFullShare(share);
      return share;
    }

    const errJson = await res.json().catch(() => null);
    throw new Error(errJson?.error?.message || `Request failed with HTTP ${res.status}`);
  } catch (err: any) {
    if (err.message && (err.message.includes('exceeds') || err.message.includes('failed with HTTP') || err.message.includes('Request failed'))) {
      throw err;
    }
    console.warn('Backend unavailable, using client-side fallback:', err.message);
    const fallback = createClientFallbackShare({
      title: params.title.trim() || 'Untitled Drop',
      textContent: params.textContent,
      language: params.language || 'plaintext',
      type: 'text',
      expiresIn: params.expiresIn,
    });
    saveFullShare(fallback);
    return fallback;
  }
}

/**
 * Upload and create a new file share
 */
export async function createFileShare(
  file: File,
  params: {
    title?: string;
    expiresIn: TtlOption;
  }
): Promise<ShareItem> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (params.title) {
      formData.append('title', params.title);
    }
    formData.append('expiresIn', params.expiresIn);

    const res = await fetch(`${API_BASE}/api/v1/shares/file`, {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const json: ApiResponse<BackendSharePayload> = await res.json();
      const share = mapBackendToShareItem(json.data);
      saveFullShare(share);
      return share;
    }

    const errJson = await res.json().catch(() => null);
    const errorMsg = errJson?.error?.message || `Upload failed with status ${res.status}`;
    throw new Error(errorMsg);
  } catch (err: any) {
    console.error('File share creation failed:', err);
    throw err;
  }
}

/**
 * Resolve share by 5-character short-code
 */
export async function getShareByShortCode(shortCode: string): Promise<ShareItem> {
  const cleanCode = shortCode.trim().toUpperCase();

  // 1. Try querying backend API
  try {
    const res = await fetch(`${API_BASE}/api/v1/s/${cleanCode}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (res.ok) {
      const json: ApiResponse<BackendSharePayload> = await res.json();
      const share = mapBackendToShareItem(json.data);
      saveFullShare(share);
      return share;
    }
  } catch (e) {
    console.warn('Failed to reach backend for shortCode resolution:', e);
  }

  // 2. Check local browser cache for this drop
  const local = getLocalShare(cleanCode);
  if (local) {
    return local;
  }

  // 3. Built-in Stitch demo payload
  if (cleanCode === 'K992A') {
    return {
      shareId: 'resolved-k992a',
      shortCode: 'K992A',
      type: 'text',
      title: 'k8s-ingress-prod.yaml',
      textContent: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: production-edge-router
  namespace: kwickdrop-core
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.kwickdrop.internal
    secretName: kwickdrop-tls-production
  rules:
  - host: api.kwickdrop.internal
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gateway-service
            port:
              number: 443`,
      language: 'yaml',
      shareUrl: `${window.location.origin}/#d=K992A`,
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() + 23 * 3600 * 1000).toISOString(),
    };
  }

  // 4. Not found
  throw new Error(`Drop #${cleanCode} was not found or has expired.`);
}

/**
 * Fetch raw payload content directly
 */
export async function getRawShareContent(shareId: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares/${shareId}/content`, {
      method: 'GET',
    });
    if (res.ok) {
      return await res.text();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Delete share with capability token
 */
export async function deleteShare(shareId: string, deleteToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/shares/${shareId}`, {
      method: 'DELETE',
      headers: {
        'X-Delete-Token': deleteToken,
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Construct direct download URL
 */
export function getFileDownloadUrl(shareId: string): string {
  return `${API_BASE}/api/v1/shares/${shareId}/download`;
}

// Helpers
function mapBackendToShareItem(payload: BackendSharePayload): ShareItem {
  return {
    shareId: payload.shareId,
    shortCode: payload.shortCode,
    type: payload.type,
    title: payload.title,
    textContent: payload.textContent,
    language: payload.language,
    file: payload.file
      ? {
          originalName: payload.file.originalName,
          mimeType: payload.file.mimeType,
          sizeBytes: payload.file.sizeBytes,
          downloadUrl: payload.downloadUrl || getFileDownloadUrl(payload.shareId),
          publicUrl: (payload.file as any)?.publicUrl,
        }
      : undefined,
    shareUrl: `${window.location.origin}/#d=${payload.shortCode}`,
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt,
    deleteToken: payload.deleteToken,
  };
}

function createClientFallbackShare(params: {
  title: string;
  type: 'text' | 'file';
  textContent?: string;
  language?: string;
  file?: {
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  };
  expiresIn: TtlOption;
}): ShareItem {
  const shortCode = Math.random().toString(36).substring(2, 7).toUpperCase();
  const hours = params.expiresIn === '1h' ? 1 : params.expiresIn === '24h' ? 24 : 168;
  const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

  return {
    shareId: 'local-' + Date.now(),
    shortCode,
    type: params.type,
    title: params.title,
    textContent: params.textContent,
    language: params.language,
    file: params.file,
    shareUrl: `${window.location.origin}/#d=${shortCode}`,
    createdAt: new Date().toISOString(),
    expiresAt,
    deleteToken: 'local-token-' + Math.random().toString(36).substring(2, 10),
  };
}
