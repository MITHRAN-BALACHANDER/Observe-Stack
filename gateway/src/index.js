const express = require('express');
const logger = require('./logging/logger');
const metricsMiddleware = require('./middleware/metrics');
const correlationIdMiddleware = require('./middleware/correlationId');
const { register } = require('./metrics/prometheus');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'api-gateway' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Service routes - would proxy to actual services
app.use('/auth', require('./routes/auth'));
app.use('/orders', require('./routes/orders'));
app.use('/notifications', require('./routes/notifications'));

const PORT = process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

module.exports = app;
