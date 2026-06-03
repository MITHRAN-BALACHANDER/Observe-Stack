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
      expect(res.body.backends.auth).toBeDefined();
      expect(res.body.backends.order).toBeDefined();
      expect(res.body.backends.notification).toBeDefined();
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('http_requests_total');
    });
  });

  describe('Correlation ID propagation', () => {
    it('returns x-request-id header on every response', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-request-id']).toBeTruthy();
    });

    it('echoes back a safe x-correlation-id when provided', async () => {
      const res = await request(app)
        .get('/health')
        .set('x-correlation-id', 'gw-test-cid');
      expect(res.headers['x-correlation-id']).toBe('gw-test-cid');
    });

    it('rejects unsafe x-correlation-id and generates a new one', async () => {
      const malicious = '<script>alert(1)</script>';
      const res = await request(app)
        .get('/health')
        .set('x-correlation-id', malicious);
      expect(res.headers['x-correlation-id']).not.toBe(malicious);
      expect(res.headers['x-correlation-id']).toBeTruthy();
    });
  });

  describe('Rate limiting', () => {
    it('returns X-RateLimit headers', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
      expect(res.headers['x-ratelimit-reset']).toBeDefined();
    });
  });

  describe('JWT enforcement on protected routes', () => {
    it('rejects /orders without Authorization header', async () => {
      const res = await request(app).post('/orders/create-order').send({});
      expect(res.status).toBe(401);
    });

    it('rejects /notifications without Authorization header', async () => {
      const res = await request(app).post('/notifications/send-email').send({});
      expect(res.status).toBe(401);
    });

    it('rejects /orders with an invalid token', async () => {
      const res = await request(app)
        .post('/orders/create-order')
        .set('Authorization', 'Bearer not-a-real-token')
        .send({});
      expect(res.status).toBe(401);
    });

    it('allows /auth routes without a token', async () => {
      // Auth routes are public — they should not return 401
      // Backend will be unreachable in unit tests (502 is expected, not 401)
      const res = await request(app).post('/auth/login').send({
        username: 'demo',
        password: 'password123'
      });
      expect(res.status).not.toBe(401);
    });
  });
});
