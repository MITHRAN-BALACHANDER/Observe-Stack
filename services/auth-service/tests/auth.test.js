const request = require('supertest');
const app = require('../src/app');

describe('Auth Service', () => {
  describe('GET /health', () => {
    it('returns status up', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.service).toBe('auth-service');
    });
  });

  describe('POST /register', () => {
    it('registers a new user', async () => {
      const res = await request(app).post('/register').send({
        username: `testuser_${Date.now()}`,
        password: 'securepass123'
      });
      expect(res.status).toBe(201);
      expect(res.body.message).toBe('user registered successfully');
    });

    it('rejects missing username', async () => {
      const res = await request(app).post('/register').send({ password: 'pass1234' });
      expect(res.status).toBe(400);
    });

    it('rejects short password', async () => {
      const res = await request(app).post('/register').send({
        username: 'someone',
        password: 'short'
      });
      expect(res.status).toBe(400);
    });

    it('rejects duplicate username', async () => {
      const username = `dup_${Date.now()}`;
      await request(app).post('/register').send({ username, password: 'password123' });
      const res = await request(app).post('/register').send({ username, password: 'password123' });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /login', () => {
    it('logs in the seeded demo user', async () => {
      // Wait briefly for bcrypt seed to complete
      await new Promise(r => setTimeout(r, 500));
      const res = await request(app).post('/login').send({
        username: 'demo',
        password: 'password123'
      });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeTruthy();
      expect(res.body.user.username).toBe('demo');
    });

    it('rejects wrong password', async () => {
      const res = await request(app).post('/login').send({
        username: 'demo',
        password: 'wrongpassword'
      });
      expect(res.status).toBe(401);
    });

    it('rejects non-existent user', async () => {
      const res = await request(app).post('/login').send({
        username: 'nobody',
        password: 'password123'
      });
      expect(res.status).toBe(401);
    });

    it('rejects missing credentials', async () => {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(400);
    });

    it('propagates x-correlation-id header', async () => {
      const res = await request(app)
        .post('/login')
        .set('x-correlation-id', 'test-cid-123')
        .send({ username: 'demo', password: 'password123' });
      expect(res.headers['x-correlation-id']).toBe('test-cid-123');
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('auth_requests_total');
    });
  });
});
