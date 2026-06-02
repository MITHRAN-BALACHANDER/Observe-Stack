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
app.use('/send-email', require('./routes/sendEmail'));
app.use('/send-sms', require('./routes/sendSms'));

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

const PORT = process.env.PORT || 3003;

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('notification-service started', { port: PORT });
  });
}

module.exports = app;
