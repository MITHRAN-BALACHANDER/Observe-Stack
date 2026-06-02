const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logging/logger');
const { notificationsSentTotal, notificationsFailedTotal, notificationLatencySeconds } = require('../metrics/prometheus');

const router = express.Router();

const FAILURE_RATE = () => parseFloat(process.env.FAILURE_RATE || '0.08');

router.post('/', async (req, res) => {
  const { to, subject, body } = req.body;
  const log = logger.child({ requestId: req.requestId, correlationId: req.correlationId });

  if (!to || !subject || !body) {
    notificationsFailedTotal.inc({ type: 'email', reason: 'validation_error' });
    log.warn('email send rejected: missing fields');
    return res.status(400).json({ error: 'to, subject, and body are required' });
  }

  const deliveryStart = process.hrtime.bigint();

  try {
    if (Math.random() < FAILURE_RATE()) {
      throw new Error('SMTP connection refused');
    }

    // Simulate delivery latency (20–200ms)
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 180));

    const messageId = `EMAIL-${uuidv4().split('-')[0].toUpperCase()}`;
    const durationSeconds = Number(process.hrtime.bigint() - deliveryStart) / 1e9;

    notificationLatencySeconds.observe({ type: 'email' }, durationSeconds);
    notificationsSentTotal.inc({ type: 'email' });

    log.info('email delivered', { messageId, to });

    res.json({
      messageId,
      to,
      subject,
      status: 'delivered',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    const durationSeconds = Number(process.hrtime.bigint() - deliveryStart) / 1e9;
    notificationLatencySeconds.observe({ type: 'email' }, durationSeconds);
    notificationsFailedTotal.inc({ type: 'email', reason: 'delivery_error' });

    log.error('email delivery failed', { to, error: err.message });

    res.status(500).json({ error: 'email delivery failed' });
  }
});

module.exports = router;
