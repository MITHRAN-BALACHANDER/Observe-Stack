const client = require('prom-client');

// Error and failure metrics
const errorMetrics = {
  errorCount: new client.Counter({
    name: 'errors_total',
    help: 'Total errors',
    labelNames: ['service', 'type', 'severity']
  }),

  errorRate: new client.Gauge({
    name: 'error_rate',
    help: 'Error rate as percentage',
    labelNames: ['service']
  }),

  failedRequests: new client.Counter({
    name: 'failed_requests_total',
    help: 'Total failed requests',
    labelNames: ['service', 'status_code']
  })
};

module.exports = errorMetrics;
