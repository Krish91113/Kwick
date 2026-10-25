import { z } from 'zod';
import { env } from '../../config/env';

export const ALLOWED_LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'html',
  'css',
  'json',
  'markdown',
  'go',
  'rust',
  'java',
  'c',
  'cpp',
  'csharp',
  'sql',
  'bash',
  'shell',
  'yaml',
  'xml',
  'php',
  'ruby',
  'dockerfile'
] as const;

export const createTextShareSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  textContent: z
    .string()
    .min(1, 'Text content cannot be empty')
    .refine(
      (val) => Buffer.byteLength(val, 'utf8') <= env.MAX_TEXT_SIZE_BYTES,
      `Text content exceeds maximum allowed size of ${env.MAX_TEXT_SIZE_BYTES} bytes (${Math.round(
        env.MAX_TEXT_SIZE_BYTES / 1024
      )} KB)`
    ),
  language: z
    .string()
    .toLowerCase()
    .refine((val) => ALLOWED_LANGUAGES.includes(val as (typeof ALLOWED_LANGUAGES)[number]), {
      message: `Unsupported language. Allowed: ${ALLOWED_LANGUAGES.join(', ')}`
    })
    .optional()
    .default('plaintext'),
  expiresIn: z.enum(['1h', '24h', '7d']).optional().default('24h')
});

export const createFileShareSchema = z.object({
  title: z
    .string()
    .trim()
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  expiresIn: z.enum(['1h', '24h', '7d']).optional().default('24h')
});

export const deleteShareSchema = z.object({
  deleteToken: z
    .string()
    .min(10, 'Invalid delete capability token')
});

export const shareIdParamSchema = z.object({
  shareId: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{8,64}$/, 'Malformed or invalid share identifier')
});

export const shortCodeParamSchema = z.object({
  shortCode: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9_-]{4,20}$/, 'Malformed or invalid short code')
});
