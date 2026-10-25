import https from 'https';
import path from 'path';
import { Readable } from 'stream';
import { cloudinary, configureCloudinary } from '../config/cloudinary';
import { StorageProvider, UploadOptions, UploadResult } from './storage.interface';

export class CloudinaryStorageProvider implements StorageProvider {
  constructor() {
    configureCloudinary();
  }

  async upload(file: Buffer, options: UploadOptions): Promise<UploadResult> {
    const isImage = options.contentType.startsWith('image/');
    // Cloudinary categorizes PDFs, ZIPs, text as 'raw', images as 'image'
    const resourceType = isImage ? 'image' : 'raw';
    const ext = path.extname(options.originalName || '');
    const publicId =
      resourceType === 'raw' && ext && !options.storageKey.endsWith(ext)
        ? `${options.storageKey}${ext}`
        : options.storageKey;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kwickdrop',
          public_id: publicId,
          resource_type: resourceType,
          overwrite: true
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload returned empty response.'));
          }

          resolve({
            storageKey: result.public_id,
            bytes: result.bytes || file.length,
            resourceType: result.resource_type,
            publicUrl: result.secure_url,
            downloadUrl: result.secure_url
          });
        }
      );

      const bufferStream = Readable.from(file);
      bufferStream.pipe(uploadStream);
    });
  }

  async delete(storageKey: string, resourceType = 'raw'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(storageKey, {
        resource_type: resourceType,
        invalidate: true
      });
    } catch (error) {
      console.error(`Failed to delete asset ${storageKey} from Cloudinary:`, error);
      throw error;
    }
  }

  async getDownloadUrl(storageKey: string, resourceType = 'raw'): Promise<string> {
    return cloudinary.url(storageKey, {
      resource_type: resourceType,
      secure: true,
      flags: 'attachment'
    });
  }

  async getDownloadStream(storageKeyOrUrl: string, resourceType = 'raw'): Promise<NodeJS.ReadableStream> {
    const targetUrl = storageKeyOrUrl.startsWith('http://') || storageKeyOrUrl.startsWith('https://')
      ? storageKeyOrUrl
      : cloudinary.url(storageKeyOrUrl, {
          resource_type: resourceType,
          secure: true
        });

    return new Promise((resolve, reject) => {
      const fetchWithRedirects = (currentUrl: string, hops = 0) => {
        if (hops > 5) {
          return reject(new Error('Too many redirects while streaming file from Cloudinary'));
        }
        https.get(currentUrl, (res) => {
          if (res.statusCode && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307)) {
            const redirectUrl = res.headers.location;
            if (!redirectUrl) {
              return reject(new Error(`Redirect status ${res.statusCode} with missing Location header`));
            }
            return fetchWithRedirects(redirectUrl, hops + 1);
          }
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Failed to fetch file from Cloudinary (HTTP ${res.statusCode})`));
          } else {
            resolve(res);
          }
        }).on('error', reject);
      };

      fetchWithRedirects(targetUrl);
    });
  }
}
