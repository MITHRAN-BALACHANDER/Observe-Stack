const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestErrors = new client.Counter({
  name: 'http_requests_failed',
  help: 'Total number of failed HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors
};
