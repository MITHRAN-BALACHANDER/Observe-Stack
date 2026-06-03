const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logging/logger');
const {
  ordersCreatedTotal,
  ordersFailedTotal,
  orderProcessingLatencySeconds,
  activeOrdersTotal
} = require('../metrics/prometheus');
const orders = require('../store/orders');

const router = express.Router();

const getFailureRate = () => parseFloat(process.env.FAILURE_RATE || '0.05');

function simulateProcessingDelay() {
  const base = 50 + Math.random() * 300;
  const spike = Math.random() < 0.1 ? Math.random() * 500 : 0;
  return base + spike;
}

router.post('/', async (req, res) => {
  const { userId, items, totalAmount } = req.body;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  if (!userId || !items || !Array.isArray(items) || items.length === 0 || !totalAmount) {
    ordersFailedTotal.inc({ reason: 'validation_error' });
    log.warn('order creation rejected: missing or invalid fields');
    return res.status(400).json({ error: 'userId, items (array), and totalAmount are required' });
  }

  const processingStart = process.hrtime.bigint();
  const orderId = `ORD-${uuidv4().replace(/-/g, '').slice(0, 16).toUpperCase()}`;

  activeOrdersTotal.inc();

  try {
    if (Math.random() < getFailureRate()) {
      throw new Error('downstream payment processor timeout');
    }

    const delayMs = simulateProcessingDelay();
    await new Promise(resolve => setTimeout(resolve, delayMs));

    const order = {
      orderId,
      userId,
      items,
      totalAmount,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    orders.set(orderId, order);

    const durationSeconds = Number(process.hrtime.bigint() - processingStart) / 1e9;
    orderProcessingLatencySeconds.observe(durationSeconds);
    ordersCreatedTotal.inc();

    log.info('order created successfully', { orderId, userId, totalAmount });

    res.status(201).json(order);
  } catch (err) {
    const durationSeconds = Number(process.hrtime.bigint() - processingStart) / 1e9;
    orderProcessingLatencySeconds.observe(durationSeconds);
    ordersFailedTotal.inc({ reason: 'processing_error' });

    log.error('order processing failed', { orderId, userId, error: err.message });

    res.status(500).json({ error: 'order processing failed', orderId });
  } finally {
    activeOrdersTotal.dec();
  }
});

module.exports = router;
