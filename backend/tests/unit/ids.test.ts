import {
  calculateExpiryDate,
  generateDeleteToken,
  generateShareId,
  generateShortCode,
  hashToken
} from '../../src/utils/ids';
import { BadRequestError } from '../../src/utils/errors';

describe('Unit: IDs and Token Utilities', () => {
  describe('generateShareId', () => {
    it('should generate random shareId with default prefix', () => {
      const id1 = generateShareId();
      const id2 = generateShareId();

      expect(id1).toMatch(/^kd_[a-f0-9]{24}$/);
      expect(id2).toMatch(/^kd_[a-f0-9]{24}$/);
      expect(id1).not.toBe(id2);
    });

    it('should allow custom prefix', () => {
      const custom = generateShareId('custom_');
      expect(custom.startsWith('custom_')).toBe(true);
    });
  });

  describe('generateShortCode', () => {
    it('should generate human-friendly short code of expected length', () => {
      const code = generateShortCode(6);
      expect(code).toHaveLength(6);
      // Ensure no ambiguous characters like '0', 'O', '1', 'l', 'I'
      expect(code).not.toMatch(/[0O1lI]/);
    });

    it('should generate distinct codes on consecutive calls', () => {
      const set = new Set<string>();
      for (let i = 0; i < 50; i++) {
        set.add(generateShortCode(6));
      }
      expect(set.size).toBe(50);
    });
  });

  describe('generateDeleteToken & hashToken', () => {
    it('should generate 64-character hex delete token', () => {
      const token = generateDeleteToken();
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should hash token deterministically using SHA-256', () => {
      const token = 'my-secret-test-token';
      const hash1 = hashToken(token);
      const hash2 = hashToken(token);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(hash1).not.toBe(token);
    });
  });

  describe('calculateExpiryDate', () => {
    it('should default to 24 hours if unspecified', () => {
      const before = Date.now() + 24 * 60 * 60 * 1000 - 1000;
      const expiry = calculateExpiryDate();
      const after = Date.now() + 24 * 60 * 60 * 1000 + 1000;

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before);
      expect(expiry.getTime()).toBeLessThanOrEqual(after);
    });

    it('should calculate 1 hour expiry', () => {
      const before = Date.now() + 1 * 60 * 60 * 1000 - 1000;
      const expiry = calculateExpiryDate('1h');
      const after = Date.now() + 1 * 60 * 60 * 1000 + 1000;

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before);
      expect(expiry.getTime()).toBeLessThanOrEqual(after);
    });

    it('should calculate 7 days expiry', () => {
      const before = Date.now() + 7 * 24 * 60 * 60 * 1000 - 1000;
      const expiry = calculateExpiryDate('7d');
      const after = Date.now() + 7 * 24 * 60 * 60 * 1000 + 1000;

      expect(expiry.getTime()).toBeGreaterThanOrEqual(before);
      expect(expiry.getTime()).toBeLessThanOrEqual(after);
    });

    it('should throw BadRequestError on invalid duration', () => {
      expect(() => calculateExpiryDate('10d')).toThrow(BadRequestError);
      expect(() => calculateExpiryDate('forever')).toThrow(BadRequestError);
    });
  });
});
