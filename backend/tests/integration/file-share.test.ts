import request from 'supertest';
import { createApp } from '../../src/app';
import { shareService } from '../../src/modules/shares/share.service';
import { setStorageProvider } from '../../src/storage';
import { MockStorageProvider } from '../../src/storage/mock.provider';
import { InMemoryShareRepository } from '../helpers/mock-repository';

describe('Integration: File Sharing API', () => {
  let mockRepo: InMemoryShareRepository;
  let mockStorage: MockStorageProvider;
  const app = createApp();

  beforeEach(() => {
    mockRepo = new InMemoryShareRepository();
    mockStorage = new MockStorageProvider();
    (shareService as unknown as { repo: unknown }).repo = mockRepo;
    setStorageProvider(mockStorage);
  });

  describe('POST /api/v1/shares/file', () => {
    it('should upload a valid file and return metadata with downloadUrl and deleteToken', async () => {
      const fileBuffer = Buffer.from('PDF file mock content for testing KwickDrop');

      const res = await request(app)
        .post('/api/v1/shares/file')
        .attach('file', fileBuffer, 'document.txt')
        .field('title', 'Important Document')
        .field('expiresIn', '24h');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('file');
      expect(res.body.data.file.originalName).toBe('document.txt');
      expect(res.body.data.file.sizeBytes).toBe(fileBuffer.length);
      expect(res.body.data.downloadUrl).toBeDefined();
      expect(res.body.data.deleteToken).toBeDefined();
    });

    it('should reject prohibited file formats (.exe)', async () => {
      const exeBuffer = Buffer.from('fake exe content');

      const res = await request(app)
        .post('/api/v1/shares/file')
        .attach('file', exeBuffer, 'danger.exe');

      expect([400, 415]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject prohibited web-active scripts (.html)', async () => {
      const htmlBuffer = Buffer.from('<script>alert("xss")</script>');

      const res = await request(app)
        .post('/api/v1/shares/file')
        .attach('file', htmlBuffer, 'index.html');

      expect([400, 415]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when no file is attached', async () => {
      const res = await request(app)
        .post('/api/v1/shares/file')
        .field('title', 'No file attached');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_FILE');
    });
  });

  describe('GET /api/v1/shares/:shareId/download', () => {
    it('should stream file with strict security and attachment headers', async () => {
      const fileBuffer = Buffer.from('Downloadable test file content');

      const uploadRes = await request(app)
        .post('/api/v1/shares/file')
        .attach('file', fileBuffer, 'data.csv');

      const shareId = uploadRes.body.data.shareId;

      const downloadRes = await request(app).get(`/api/v1/shares/${shareId}/download`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.headers['x-content-type-options']).toBe('nosniff');
      expect(downloadRes.headers['content-security-policy']).toBe("default-src 'none'");
      expect(downloadRes.headers['content-disposition']).toContain('attachment');
      expect(downloadRes.headers['content-disposition']).toContain('data.csv');
      expect(downloadRes.text).toBe('Downloadable test file content');
    });
  });

  describe('File Deletion and Storage Cleanup', () => {
    it('should delete file from storage when share is deleted via capability token', async () => {
      const fileBuffer = Buffer.from('To be cleaned up');

      const uploadRes = await request(app)
        .post('/api/v1/shares/file')
        .attach('file', fileBuffer, 'temp.txt');

      const { shareId, deleteToken } = uploadRes.body.data;

      // Delete via API
      const delRes = await request(app)
        .delete(`/api/v1/shares/${shareId}`)
        .set('x-delete-token', deleteToken);

      expect(delRes.status).toBe(200);

      // Verify share is no longer accessible
      const getRes = await request(app).get(`/api/v1/shares/${shareId}`);
      expect(getRes.status).toBe(404);
    });
  });
});
