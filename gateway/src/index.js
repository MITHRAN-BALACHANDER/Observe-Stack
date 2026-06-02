const express = require('express');
const logger = require('./logging/logger');
const correlationIdMiddleware = require('./middleware/correlationId');
const metricsMiddleware = require('./middleware/metrics');
const { register } = require('./metrics/prometheus');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'up',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    backends: {
      auth: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003'
    }
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use('/auth', require('./routes/auth'));
app.use('/orders', require('./routes/orders'));
app.use('/notifications', require('./routes/notifications'));

app.use((err, req, res, next) => {
  logger.error('gateway error', {
    requestId: req.requestId,
    correlationId: req.correlationId,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: 'gateway error' });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('api-gateway started', { port: PORT });
  });
}

module.exports = app;
