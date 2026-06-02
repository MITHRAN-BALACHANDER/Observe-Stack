const express = require('express');
const logger = require('./logging/logger');
const metricsMiddleware = require('./middleware/metricsMiddleware');
const correlationIdMiddleware = require('./middleware/correlationIdMiddleware');
const { register } = require('./metrics/prometheus');

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'auth-service' });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Routes
app.use('/login', require('./routes/login'));
app.use('/register', require('./routes/register'));

const PORT = process.env.AUTH_SERVICE_PORT || 3001;

app.listen(PORT, () => {
  logger.info(`Auth Service listening on port ${PORT}`);
});

module.exports = app;
