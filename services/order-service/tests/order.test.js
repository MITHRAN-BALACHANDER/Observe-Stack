const request = require('supertest');
const app = require('../src/app');

describe('Order Service', () => {
  describe('GET /health', () => {
    it('returns status up', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('up');
      expect(res.body.service).toBe('order-service');
    });
  });

  describe('POST /create-order', () => {
    beforeEach(() => { process.env.FAILURE_RATE = '0'; });

    it('creates a valid order', async () => {
      const res = await request(app).post('/create-order').send({
        userId: 'user-123',
        items: [{ sku: 'WIDGET-001', quantity: 2, price: 9.99 }],
        totalAmount: 19.98
      });
      expect(res.status).toBe(201);
      expect(res.body.orderId).toMatch(/^ORD-/);
      expect(res.body.status).toBe('confirmed');
    });

    it('rejects missing userId', async () => {
      const res = await request(app).post('/create-order').send({
        items: [{ sku: 'X', quantity: 1, price: 1 }],
        totalAmount: 1
      });
      expect(res.status).toBe(400);
    });

    it('rejects empty items array', async () => {
      const res = await request(app).post('/create-order').send({
        userId: 'user-1',
        items: [],
        totalAmount: 0
      });
      expect(res.status).toBe(400);
    });

    it('rejects missing totalAmount', async () => {
      const res = await request(app).post('/create-order').send({
        userId: 'user-1',
        items: [{ sku: 'X', quantity: 1, price: 1 }]
      });
      expect(res.status).toBe(400);
    });

    it('simulates failures at 100% failure rate', async () => {
      process.env.FAILURE_RATE = '1';
      const res = await request(app).post('/create-order').send({
        userId: 'user-fail',
        items: [{ sku: 'X', quantity: 1, price: 5 }],
        totalAmount: 5
      });
      expect(res.status).toBe(500);
      process.env.FAILURE_RATE = '0';
    });
  });

  describe('GET /orders/:id', () => {
    it('returns 404 for unknown order', async () => {
      const res = await request(app).get('/orders/ORD-NOTEXIST');
      expect(res.status).toBe(404);
    });

    it('retrieves a created order by ID', async () => {
      process.env.FAILURE_RATE = '0';
      const create = await request(app).post('/create-order').send({
        userId: 'user-456',
        items: [{ sku: 'GADGET', quantity: 1, price: 49.99 }],
        totalAmount: 49.99
      });
      expect(create.status).toBe(201);

      const get = await request(app).get(`/orders/${create.body.orderId}`);
      expect(get.status).toBe(200);
      expect(get.body.orderId).toBe(create.body.orderId);
    });
  });

  describe('GET /metrics', () => {
    it('returns prometheus metrics with required counters', async () => {
      const res = await request(app).get('/metrics');
      expect(res.status).toBe(200);
      expect(res.text).toContain('orders_created_total');
      expect(res.text).toContain('orders_failed_total');
      expect(res.text).toContain('order_processing_latency_seconds');
      expect(res.text).toContain('active_orders_total');
    });
  });
});
