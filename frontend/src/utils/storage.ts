import { RecentDrop, ShareItem } from '../types';

const RECENTS_KEY = 'kwickdrop_recent_drops';
const SHARES_KEY = 'kwickdrop_local_shares';

export function getRecentDrops(): RecentDrop[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    if (!raw) {
      // Default initial samples matching the Stitch design
      return [
        {
          shortCode: 'X89F2',
          title: 'production-deploy-config.yaml',
          type: 'text',
          sizeFormatted: '1.8 KB',
          expiresInText: 'Expires in 23h',
          isExpired: false,
          timestamp: Date.now() - 14 * 60 * 1000,
        },
        {
          shortCode: 'B41Z9',
          title: 'docker-compose.prod.yml',
          type: 'text',
          sizeFormatted: '0 B',
          expiresInText: 'Purged from storage',
          isExpired: true,
          timestamp: Date.now() - 25 * 3600 * 1000,
        },
        {
          shortCode: 'R72M0',
          title: 'WireGuard key pair',
          type: 'text',
          sizeFormatted: '512 B',
          expiresInText: 'Expires in 45m',
          isExpired: false,
          timestamp: Date.now() - 40 * 60 * 1000,
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecentDrop(drop: RecentDrop): void {
  try {
    const current = getRecentDrops().filter((d) => d.shortCode !== drop.shortCode);
    const updated = [drop, ...current].slice(0, 10);
    localStorage.setItem(RECENTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function clearRecentDrops(): void {
  try {
    localStorage.removeItem(RECENTS_KEY);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}

/**
 * Save complete share payload for instant client-side resolution
 */
export function saveFullShare(share: ShareItem): void {
  try {
    const raw = localStorage.getItem(SHARES_KEY);
    const shares: Record<string, ShareItem> = raw ? JSON.parse(raw) : {};
    shares[share.shortCode.toUpperCase()] = share;
    localStorage.setItem(SHARES_KEY, JSON.stringify(shares));
  } catch (e) {
    console.error('Failed to save full share to localStorage:', e);
  }
}

/**
 * Retrieve complete share payload by shortCode from client storage
 */
export function getLocalShare(shortCode: string): ShareItem | null {
  try {
    const clean = shortCode.trim().toUpperCase();
    const raw = localStorage.getItem(SHARES_KEY);
    if (!raw) return null;
    const shares: Record<string, ShareItem> = JSON.parse(raw);
    const found = shares[clean];
    if (!found) return null;

    // Check expiration
    if (new Date(found.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return found;
  } catch {
    return null;
  }
}
