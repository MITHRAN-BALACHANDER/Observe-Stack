const request = require('supertest');
const app = require('../src/app');
const { register } = require('../src/metrics/prometheus');

beforeEach(async () => {
  process.env.FAILURE_RATE = '0';
  await register.resetMetrics();
});

afterAll(() => {
  delete process.env.FAILURE_RATE;
});

describe('Notification Service', () => {
  describe('GET /health', () => {
    it('returns status up', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.service).toBe('notification-service');
    });
  });

  describe('POST /send-email', () => {
    it('delivers an email successfully', async () => {
      const res = await request(app).post('/send-email').send({
        to: 'user@example.com',
        subject: 'Order Confirmed',
        body: 'Your order has been confirmed.'
      });
      expect(res.status).toBe(200);
      expect(res.body.messageId).toMatch(/^EMAIL-/);
      expect(res.body.status).toBe('delivered');
    });

    it('rejects missing to field', async () => {
      const res = await request(app).post('/send-email').send({
        subject: 'Test',
        body: 'Hello'
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid email address', async () => {
      const res = await request(app).post('/send-email').send({
        to: 'not-an-email',
        subject: 'Test',
        body: 'Hello'
      });
      expect(res.status).toBe(400);
    });

    it('rejects missing subject', async () => {
      const res = await request(app).post('/send-email').send({
        to: 'user@example.com',
        body: 'Hello'
      });
      expect(res.status).toBe(400);
    });

    it('rejects missing body', async () => {
      const res = await request(app).post('/send-email').send({
        to: 'user@example.com',
        subject: 'Test'
      });
      expect(res.status).toBe(400);
    });

    it('simulates delivery failure at 100% rate', async () => {
      process.env.FAILURE_RATE = '1';
      const res = await request(app).post('/send-email').send({
        to: 'user@example.com',
        subject: 'Test',
        body: 'Test body'
      });
      expect(res.status).toBe(500);
    });
  });

  describe('POST /send-sms', () => {
    it('delivers an SMS successfully', async () => {
      const res = await request(app).post('/send-sms').send({
        phoneNumber: '+15551234567',
        message: 'Your verification code is 123456'
      });
      expect(res.status).toBe(200);
      expect(res.body.messageId).toMatch(/^SMS-/);
      expect(res.body.status).toBe('delivered');
    });

    it('rejects missing phoneNumber', async () => {
      const res = await request(app).post('/send-sms').send({
        message: 'Hello'
      });
      expect(res.status).toBe(400);
    });

    it('rejects invalid phone number format', async () => {
      const res = await request(app).post('/send-sms').send({
        phoneNumber: '5551234567',
        message: 'Hello'
      });
      expect(res.status).toBe(400);
    });

    it('rejects missing message', async () => {
      const res = await request(app).post('/send-sms').send({
        phoneNumber: '+15551234567'
      });
      expect(res.status).toBe(400);
    });

    it('simulates SMS failure at 100% rate', async () => {
      process.env.FAILURE_RATE = '1';
      const res = await request(app).post('/send-sms').send({
        phoneNumber: '+15551234567',
        message: 'Test'
      });
      expect(res.status).toBe(500);
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics with required counters', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('notifications_sent_total');
      expect(res.text).toContain('notifications_failed_total');
      expect(res.text).toContain('notification_latency_seconds');
    });

    it('increments notifications_sent_total on successful email', async () => {
      await request(app).post('/send-email').send({
        to: 'user@example.com',
        subject: 'Test',
        body: 'Hello'
      });
      const res = await request(app).get('/metrics');
      expect(res.text).toMatch(/notifications_sent_total\{type="email"\}\s+1/);
    });

    it('increments notifications_sent_total on successful SMS', async () => {
      await request(app).post('/send-sms').send({
        phoneNumber: '+15551234567',
        message: 'Test'
      });
      const res = await request(app).get('/metrics');
      expect(res.text).toMatch(/notifications_sent_total\{type="sms"\}\s+1/);
    });
  });
});
