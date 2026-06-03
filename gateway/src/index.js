const express = require('express');
const logger = require('./logging/logger');
const correlationIdMiddleware = require('./middleware/correlationId');
const metricsMiddleware = require('./middleware/metrics');
const rateLimitMiddleware = require('./middleware/rateLimit');
const authMiddleware = require('./middleware/authMiddleware');
const { register } = require('./metrics/prometheus');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(correlationIdMiddleware);
app.use(rateLimitMiddleware);
app.use(metricsMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'up',
    service: 'api-gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    backends: {
      auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      order: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003'
    }
  });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Auth routes are public — they issue the tokens
app.use('/auth', require('./routes/auth'));

// Protected routes require a valid JWT
app.use('/orders', authMiddleware, require('./routes/orders'));
app.use('/notifications', authMiddleware, require('./routes/notifications'));

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
  const server = app.listen(PORT, () => {
    logger.info('api-gateway started', { port: PORT });
  });

  const shutdown = (signal) => {
    logger.info('shutting down', { signal });
    server.close(() => {
      logger.info('server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
