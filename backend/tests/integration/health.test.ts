import request from 'supertest';
import { createApp } from '../../src/app';

describe('Integration: Health Endpoints', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return 200 with status ok and uptime', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(typeof res.body.data.uptimeSeconds).toBe('number');
      expect(res.body.requestId).toBeDefined();
    });
  });

  describe('GET /ready', () => {
    it('should respond with readiness status', async () => {
      const res = await request(app).get('/ready');
      // When mongoose is not connected in test environment, returns 503; when connected, 200
      expect([200, 503]).toContain(res.status);
      expect(res.body.requestId).toBeDefined();
    });
  });
});
