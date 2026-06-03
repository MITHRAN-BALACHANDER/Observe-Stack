const request = require('supertest');
const app = require('../src/app');
const users = require('../src/store/users');

afterEach(() => {
  // Remove any users registered during tests, preserving the seeded demo user
  for (const key of users.keys()) {
    if (key !== 'demo') users.delete(key);
  }
});

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

    it('rejects unsafe x-correlation-id with special characters', async () => {
      const res = await request(app)
        .post('/login')
        .set('x-correlation-id', '<script>alert(1)</script>')
        .send({ username: 'demo', password: 'password123' });
      // Unsafe header is ignored and a generated UUID is used instead
      expect(res.headers['x-correlation-id']).not.toBe('<script>alert(1)</script>');
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('auth_requests_total');
      expect(res.text).toContain('http_requests_total');
    });

    it('records request metrics on login', async () => {
      await request(app).post('/login').send({ username: 'demo', password: 'password123' });
      const res = await request(app).get('/metrics');
      expect(res.text).toContain('login_success_total');
    });
  });
});
