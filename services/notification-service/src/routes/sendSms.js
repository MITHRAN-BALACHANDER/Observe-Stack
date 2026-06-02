const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logging/logger');
const { notificationsSentTotal, notificationsFailedTotal, notificationLatencySeconds } = require('../metrics/prometheus');

const router = express.Router();

const FAILURE_RATE = () => parseFloat(process.env.FAILURE_RATE || '0.08');

router.post('/', async (req, res) => {
  const { phoneNumber, message } = req.body;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  if (!phoneNumber || !message) {
    notificationsFailedTotal.inc({ type: 'sms', reason: 'validation_error' });
    log.warn('sms send rejected: missing fields');
    return res.status(400).json({ error: 'phoneNumber and message are required' });
  }

  const deliveryStart = process.hrtime.bigint();

  try {
    if (Math.random() < FAILURE_RATE()) {
      throw new Error('SMS gateway unreachable');
    }

    // Simulate SMS gateway latency (30–300ms)
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 270));

    const messageId = `SMS-${uuidv4().split('-')[0].toUpperCase()}`;
    const durationSeconds = Number(process.hrtime.bigint() - deliveryStart) / 1e9;

    notificationLatencySeconds.observe({ type: 'sms' }, durationSeconds);
    notificationsSentTotal.inc({ type: 'sms' });

    log.info('sms delivered', { messageId, phoneNumber });

    res.json({
      messageId,
      phoneNumber,
      status: 'delivered',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const durationSeconds = Number(process.hrtime.bigint() - deliveryStart) / 1e9;
    notificationLatencySeconds.observe({ type: 'sms' }, durationSeconds);
    notificationsFailedTotal.inc({ type: 'sms', reason: 'delivery_error' });

    log.error('sms delivery failed', { phoneNumber, error: err.message });

    res.status(500).json({ error: 'sms delivery failed' });
  }
});

module.exports = router;
