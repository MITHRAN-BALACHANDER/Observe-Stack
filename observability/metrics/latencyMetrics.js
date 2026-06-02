const client = require('prom-client');

// Latency-specific metrics
const latencyMetrics = {
  p50Latency: new client.Gauge({
    name: 'latency_p50_ms',
    help: 'P50 latency in milliseconds',
    labelNames: ['service']
  }),

  p95Latency: new client.Gauge({
    name: 'latency_p95_ms',
    help: 'P95 latency in milliseconds',
    labelNames: ['service']
  }),

  p99Latency: new client.Gauge({
    name: 'latency_p99_ms',
    help: 'P99 latency in milliseconds',
    labelNames: ['service']
  })
};

module.exports = latencyMetrics;
