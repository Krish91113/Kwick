import crypto from 'crypto';
import { BadRequestError } from './errors';

const SHORT_CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure random share identifier.
 * Example output: 'kd_a8f93bc10492e718'
 */
export function generateShareId(prefix = 'kd_'): string {
  const randomBytes = crypto.randomBytes(12).toString('hex');
  return `${prefix}${randomBytes}`;
}

/**
 * Generate a human-friendly short code (6-8 characters), avoiding ambiguous characters (0, O, 1, l, I).
 */
export function generateShortCode(length = 6): string {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    const byte = bytes[i];
    if (byte !== undefined) {
      code += SHORT_CODE_CHARS[byte % SHORT_CODE_CHARS.length];
    }
  }
  return code;
}

/**
 * Generate a random capability delete token.
 */
export function generateDeleteToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash a capability token using SHA-256 for secure storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type ExpiryOption = '1h' | '24h' | '7d';

/**
 * Calculate expiry date based on supported duration strings.
 * Defaults to 24 hours.
 */
export function calculateExpiryDate(expiresIn?: string): Date {
  const now = new Date();
  const option = (expiresIn || '24h').toLowerCase();

  switch (option) {
    case '1h':
      return new Date(now.getTime() + 1 * 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      throw new BadRequestError(
        `Unsupported expiration duration: '${expiresIn}'. Allowed values are '1h', '24h', or '7d'.`,
        'INVALID_EXPIRY'
      );
  }
}
