import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),

  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/kwickdrop'),

  // Domains & URLs
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
  PUBLIC_APP_URL: z.string().default('http://localhost:5000'),

  // Cloudinary Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // Storage provider: 'cloudinary' | 'mock'
  STORAGE_PROVIDER: z.enum(['cloudinary', 'mock']).default('mock'),

  // Limits
  MAX_FILE_SIZE_BYTES: z.coerce.number().default(10 * 1024 * 1024), // 10MB
  MAX_TEXT_SIZE_BYTES: z.coerce.number().default(100 * 1024),       // 100KB
  DEFAULT_SHARE_TTL_HOURS: z.coerce.number().default(24),
  CLEANUP_INTERVAL_MINUTES: z.coerce.number().default(15)
}).superRefine((data, ctx) => {
  // If in production and storage provider is cloudinary, ensure credentials are set
  if (data.NODE_ENV === 'production' && data.STORAGE_PROVIDER === 'cloudinary') {
    if (!data.CLOUDINARY_CLOUD_NAME || !data.CLOUDINARY_API_KEY || !data.CLOUDINARY_API_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CLOUDINARY credentials are required when STORAGE_PROVIDER is cloudinary in production.'
      });
    }
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment configuration:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  throw new Error('Environment configuration error. Please check your .env file or environment variables.');
}

export const env = parsedEnv.data;
