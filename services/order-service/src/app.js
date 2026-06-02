const express = require('express');
const logger = require('./logging/logger');
const correlationIdMiddleware = require('./middleware/correlationIdMiddleware');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const { register } = require('./metrics/prometheus');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

app.use('/health', require('./routes/health'));
app.use('/create-order', require('./routes/createOrder'));
app.use('/orders', require('./routes/getOrder'));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.use((err, req, res, next) => {
  logger.error('unhandled error', {
    requestId: req.requestId,
    correlationId: req.correlationId,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ error: 'internal server error' });
});

const PORT = process.env.PORT || 3002;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('order-service started', { port: PORT });
  });
}

module.exports = app;
