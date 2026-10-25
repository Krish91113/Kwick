import request from 'supertest';
import { createApp } from '../../src/app';
import { shareService } from '../../src/modules/shares/share.service';
import { InMemoryShareRepository } from '../helpers/mock-repository';

describe('Integration: Text Shares API', () => {
  let mockRepo: InMemoryShareRepository;
  const app = createApp();

  beforeEach(() => {
    mockRepo = new InMemoryShareRepository();
    // Swap service repository to in-memory repository
    (shareService as unknown as { repo: unknown }).repo = mockRepo;
  });

  describe('POST /api/v1/shares', () => {
    it('should create a text share and return metadata with one-time deleteToken', async () => {
      const res = await request(app)
        .post('/api/v1/shares')
        .send({
          title: 'API Test Note',
          textContent: 'const hello = "world";',
          language: 'javascript',
          expiresIn: '24h'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.shareId).toBeDefined();
      expect(res.body.data.shortCode).toBeDefined();
      expect(res.body.data.deleteToken).toBeDefined();
      expect(res.body.data.shareUrl).toContain(res.body.data.shareId);
      expect(res.body.data.qrUrl).toContain(res.body.data.shareId);
      expect(res.body.data.type).toBe('text');
      expect(res.body.data.language).toBe('javascript');
    });

    it('should reject empty text content', async () => {
      const res = await request(app)
        .post('/api/v1/shares')
        .send({
          title: 'Empty',
          textContent: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject text exceeding 100 KB limit', async () => {
      // 101 KB string
      const largeText = 'A'.repeat(101 * 1024);
      const res = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: largeText
        });

      expect([400, 413]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('should reject unsupported programming language', async () => {
      const res = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'print("hi")',
          language: 'invalid_lang_xyz'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/shares/:shareId', () => {
    it('should retrieve text share metadata and content without exposing deleteTokenHash', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          title: 'Secret Share',
          textContent: 'Console.log("test")',
          language: 'typescript'
        });

      const shareId = createRes.body.data.shareId;

      const getRes = await request(app).get(`/api/v1/shares/${shareId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data.shareId).toBe(shareId);
      expect(getRes.body.data.textContent).toBe('Console.log("test")');
      expect(getRes.body.data.deleteTokenHash).toBeUndefined();
      expect(getRes.body.data.deleteToken).toBeUndefined();
    });

    it('should return 404 for nonexistent shareId', async () => {
      const res = await request(app).get('/api/v1/shares/kd_nonexistent999999999999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('SHARE_NOT_FOUND');
    });
  });

  describe('GET /api/v1/shares/:shareId/content', () => {
    it('should return raw text content with text/plain header', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'Plain text raw output'
        });

      const shareId = createRes.body.data.shareId;
      const contentRes = await request(app).get(`/api/v1/shares/${shareId}/content`);

      expect(contentRes.status).toBe(200);
      expect(contentRes.headers['content-type']).toContain('text/plain');
      expect(contentRes.text).toBe('Plain text raw output');
    });
  });

  describe('Short Code Resolution', () => {
    it('should resolve share using /api/v1/s/:shortCode and /s/:shortCode', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'Shortcode payload'
        });

      const shortCode = createRes.body.data.shortCode;

      const resApi = await request(app).get(`/api/v1/s/${shortCode}`);
      expect(resApi.status).toBe(200);
      expect(resApi.body.data.shortCode).toBe(shortCode);

      const resRoot = await request(app).get(`/s/${shortCode}`);
      expect(resRoot.status).toBe(200);
      expect(resRoot.body.data.shortCode).toBe(shortCode);
    });
  });

  describe('Real-time Expiration Enforcement', () => {
    it('should return 410 SHARE_EXPIRED when share has reached expiry date', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'Expired content'
        });

      const shareId = createRes.body.data.shareId;

      // Manually set expiry to the past in repository
      mockRepo.setShareExpiry(shareId, new Date(Date.now() - 5000));

      const getRes = await request(app).get(`/api/v1/shares/${shareId}`);
      expect(getRes.status).toBe(410);
      expect(getRes.body.error.code).toBe('SHARE_EXPIRED');
    });
  });

  describe('DELETE /api/v1/shares/:shareId', () => {
    it('should delete share when valid capability token is provided in x-delete-token header', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'To be deleted'
        });

      const { shareId, deleteToken } = createRes.body.data;

      const deleteRes = await request(app)
        .delete(`/api/v1/shares/${shareId}`)
        .set('x-delete-token', deleteToken);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);

      // Subsequent access should fail with 404
      const getRes = await request(app).get(`/api/v1/shares/${shareId}`);
      expect(getRes.status).toBe(404);
    });

    it('should reject deletion when capability token is invalid or missing', async () => {
      const createRes = await request(app)
        .post('/api/v1/shares')
        .send({
          textContent: 'Protected'
        });

      const { shareId } = createRes.body.data;

      const deleteRes = await request(app)
        .delete(`/api/v1/shares/${shareId}`)
        .set('x-delete-token', 'wrong-token-1234567890');

      expect(deleteRes.status).toBe(401);
      expect(deleteRes.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
