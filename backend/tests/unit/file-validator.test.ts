import {
  sanitizeFilename,
  validateUploadedFile,
  DISALLOWED_EXTENSIONS
} from '../../src/utils/file-validator';
import { BadRequestError, UnsupportedMediaTypeError } from '../../src/utils/errors';

describe('Unit: File Validation & Sanitization', () => {
  describe('sanitizeFilename', () => {
    it('should strip path traversal attempts', () => {
      expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
      expect(sanitizeFilename('C:\\Windows\\System32\\cmd.exe')).toBe('cmd.exe');
      expect(sanitizeFilename('..\\..\\secret.pdf')).toBe('secret.pdf');
    });

    it('should replace special and control characters with underscore', () => {
      expect(sanitizeFilename('my file (test) [v1].png')).toBe('my_file__test___v1_.png');
    });

    it('should truncate overly long filenames while keeping extension', () => {
      const veryLongName = 'a'.repeat(150) + '.pdf';
      const sanitized = sanitizeFilename(veryLongName);
      expect(sanitized.endsWith('.pdf')).toBe(true);
      expect(sanitized.length).toBeLessThanOrEqual(120);
    });

    it('should handle empty or null filenames gracefully', () => {
      expect(sanitizeFilename('')).toBe('unnamed_file');
    });
  });

  describe('validateUploadedFile', () => {
    it('should accept valid plain text file', async () => {
      const textBuffer = Buffer.from('Hello KwickDrop, this is valid plain text.');
      const result = await validateUploadedFile(textBuffer, 'notes.txt', 'text/plain');

      expect(result.extension).toBe('.txt');
      expect(result.detectedMimeType).toBe('text/plain');
      expect(result.sanitizedName).toBe('notes.txt');
    });

    it('should reject prohibited executable extension .exe', async () => {
      const buffer = Buffer.from('fake exe content');
      await expect(validateUploadedFile(buffer, 'malware.exe')).rejects.toThrow(
        UnsupportedMediaTypeError
      );
    });

    it('should reject prohibited web-active scripts .html and .svg', async () => {
      const htmlBuffer = Buffer.from('<html><body><script>alert(1)</script></body></html>');
      await expect(validateUploadedFile(htmlBuffer, 'page.html')).rejects.toThrow(
        UnsupportedMediaTypeError
      );

      const svgBuffer = Buffer.from('<svg><script>alert(1)</script></svg>');
      await expect(validateUploadedFile(svgBuffer, 'image.svg')).rejects.toThrow(
        UnsupportedMediaTypeError
      );
    });

    it('should reject binary content inside text file', async () => {
      // Buffer containing null bytes / binary markers with .txt extension
      const fakeText = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      await expect(validateUploadedFile(fakeText, 'disguised.txt')).rejects.toThrow(
        BadRequestError
      );
    });

    it('should accept valid PNG header', async () => {
      // 8-byte standard PNG signature: 89 50 4E 47 0D 0A 1A 0A
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52
      ]);
      const result = await validateUploadedFile(pngBuffer, 'photo.png', 'image/png');
      expect(result.extension).toBe('.png');
      expect(result.detectedMimeType).toBe('image/png');
    });
  });
});
