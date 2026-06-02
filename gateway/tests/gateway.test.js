const request = require('supertest');
const app = require('../src/index');

describe('API Gateway', () => {
  describe('GET /health', () => {
    it('returns status up with backend URLs', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.service).toBe('api-gateway');
      expect(res.body.backends).toBeDefined();
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_requests_total');
    });
  });

  describe('correlation ID propagation', () => {
    it('returns x-request-id header on every response', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-request-id']).toBeTruthy();
    });

    it('echoes back x-correlation-id when provided', async () => {
      const res = await request(app)
        .get('/health')
        .set('x-correlation-id', 'gw-test-cid');
      expect(res.headers['x-correlation-id']).toBe('gw-test-cid');
    });
  });
});
