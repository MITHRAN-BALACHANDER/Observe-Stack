const client = require('prom-client');

// Service-wide metrics
const serviceMetrics = {
  httpRequests: new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'path', 'status']
  }),

  requestDuration: new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration',
    labelNames: ['method', 'path'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10]
  }),

  activeConnections: new client.Gauge({
    name: 'active_connections',
    help: 'Number of active connections'
  })
};

module.exports = serviceMetrics;
