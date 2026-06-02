const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({ service: 'api-gateway' });
client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests through the gateway in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests through the gateway',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestErrors = new client.Counter({
  name: 'http_requests_failed',
  help: 'Total number of failed (4xx/5xx) HTTP requests through the gateway',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  httpRequestErrors
};
