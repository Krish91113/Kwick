import path from 'path';
import FileType from 'file-type';
import { BadRequestError, UnsupportedMediaTypeError } from './errors';

// Disallowed dangerous extensions (executables, scripts, HTML/SVG that can execute script in browser)
export const DISALLOWED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.vbs', '.vbe', '.js', '.mjs',
  '.msi', '.com', '.scr', '.jar', '.apk', '.bin', '.pif', '.application',
  '.gadget', '.html', '.htm', '.xhtml', '.svg', '.php', '.asp', '.aspx',
  '.jsp', '.ps1', '.py', '.rb', '.pl', '.cgi', '.dll', '.so', '.dylib'
]);

// Allowed extensions and corresponding MIME types
export const ALLOWED_EXTENSIONS_MAP: Record<string, string[]> = {
  // Common Images
  '.png': ['image/png'],
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.ico': ['image/x-icon', 'image/vnd.microsoft.icon'],
  '.bmp': ['image/bmp'],
  '.tiff': ['image/tiff'],

  // Documents, Configs and Data
  '.pdf': ['application/pdf'],
  '.txt': ['text/plain'],
  '.md': ['text/markdown', 'text/plain'],
  '.markdown': ['text/markdown', 'text/plain'],
  '.csv': ['text/csv', 'text/plain', 'application/vnd.ms-excel'],
  '.json': ['application/json', 'text/plain'],
  '.yaml': ['text/yaml', 'text/x-yaml', 'application/x-yaml', 'text/plain'],
  '.yml': ['text/yaml', 'text/x-yaml', 'application/x-yaml', 'text/plain'],
  '.xml': ['application/xml', 'text/xml', 'text/plain'],
  '.toml': ['text/plain', 'application/toml'],
  '.ini': ['text/plain'],
  '.env': ['text/plain'],
  '.conf': ['text/plain'],
  '.cfg': ['text/plain'],
  '.log': ['text/plain'],
  '.sql': ['text/plain', 'application/sql', 'text/x-sql'],

  // Archives
  '.zip': ['application/zip', 'application/x-zip-compressed'],
  '.tar': ['application/x-tar', 'application/tar'],
  '.gz': ['application/gzip', 'application/x-gzip'],
  '.7z': ['application/x-7z-compressed'],

  // Office formats
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  '.doc': ['application/msword'],
  '.xls': ['application/vnd.ms-excel'],
  '.ppt': ['application/vnd.ms-powerpoint']
};

/**
 * Sanitize client filename to prevent path traversal, control character injection, and overly long names.
 */
export function sanitizeFilename(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return 'unnamed_file';
  }

  // Extract base filename (removes path traversal like ../ or C:\)
  const basename = path.basename(rawName).trim();

  // Replace invalid characters with underscore, preserve alpha-numeric, dots, dashes, underscores
  const cleanName = basename.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Avoid hidden files or empty names
  const safeName = cleanName.replace(/^\.+/, '') || 'unnamed_file';

  // Truncate to maximum 120 characters while preserving extension
  const ext = path.extname(safeName);
  const nameWithoutExt = path.basename(safeName, ext);

  if (safeName.length > 120) {
    return `${nameWithoutExt.substring(0, 120 - ext.length)}${ext}`;
  }

  return safeName;
}

export interface ValidatedFileResult {
  sanitizedName: string;
  extension: string;
  detectedMimeType: string;
}

/**
 * Validate uploaded file buffer, extension, and detected MIME type.
 * Ensures dangerous files, executables, and spoofed extensions are rejected.
 */
export async function validateUploadedFile(
  fileBuffer: Buffer,
  originalFilename: string,
  clientMimeType?: string
): Promise<ValidatedFileResult> {
  const sanitizedName = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitizedName).toLowerCase();

  if (!ext) {
    throw new BadRequestError('Uploaded file must have a valid file extension.', 'MISSING_EXTENSION');
  }

  // Reject dangerous extensions
  if (DISALLOWED_EXTENSIONS.has(ext)) {
    throw new UnsupportedMediaTypeError(
      `File format '${ext}' is dangerous or prohibited. Executable, script, and web-active formats are rejected.`
    );
  }

  // Check if extension is in our allowlist
  const allowedMimes = ALLOWED_EXTENSIONS_MAP[ext];
  if (!allowedMimes) {
    throw new UnsupportedMediaTypeError(
      `Unsupported file extension '${ext}'. Allowed types: PNG, JPG, GIF, WEBP, PDF, TXT, MD, CSV, JSON, ZIP.`
    );
  }

  // Detect MIME type from buffer magic bytes
  const detectedType = await FileType.fromBuffer(fileBuffer);
  let resolvedMime = clientMimeType || allowedMimes[0]!;

  if (detectedType) {
    // If magic bytes were detected, ensure the detected mime matches or is compatible with the extension
    const detectedExt = `.${detectedType.ext}`.toLowerCase();

    // Handle jpeg alias (.jpg vs .jpeg)
    const isJpegMatch = (ext === '.jpg' || ext === '.jpeg') && (detectedExt === '.jpg' || detectedExt === '.jpeg');
    const isExtensionMatch = isJpegMatch || ext === detectedExt;

    if (!isExtensionMatch && !allowedMimes.includes(detectedType.mime)) {
      throw new BadRequestError(
        `File extension '${ext}' does not match detected binary content (${detectedType.mime}).`,
        'MIME_MISMATCH'
      );
    }

    resolvedMime = detectedType.mime;
  } else {
    // Magic bytes were not detected (typical for plain text, configs, source, data)
    const isTextBased = [
      '.txt', '.md', '.markdown', '.csv', '.json',
      '.yaml', '.yml', '.xml', '.toml', '.ini',
      '.env', '.conf', '.cfg', '.log', '.sql'
    ].includes(ext);
    if (!isTextBased) {
      throw new UnsupportedMediaTypeError(
        `Unable to verify binary file signature for extension '${ext}'.`
      );
    }

    // Verify buffer is valid text (not binary executable in disguise)
    // Check first 1024 bytes for null bytes / binary markers
    const sampleLength = Math.min(fileBuffer.length, 1024);
    for (let i = 0; i < sampleLength; i++) {
      if (fileBuffer[i] === 0) {
        throw new BadRequestError('Binary content detected in text file.', 'INVALID_TEXT_FILE');
      }
    }

    resolvedMime = allowedMimes[0]!;
  }

  return {
    sanitizedName,
    extension: ext,
    detectedMimeType: resolvedMime
  };
}
