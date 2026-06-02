const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({ service: 'order-service' });
client.collectDefaultMetrics({ register });

const ordersCreatedTotal = new client.Counter({
  name: 'orders_created_total',
  help: 'Total number of orders successfully created',
  registers: [register]
});

const ordersFailedTotal = new client.Counter({
  name: 'orders_failed_total',
  help: 'Total number of orders that failed to process',
  labelNames: ['reason'],
  registers: [register]
});

const orderProcessingLatencySeconds = new client.Histogram({
  name: 'order_processing_latency_seconds',
  help: 'Order processing latency in seconds',
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register]
});

const activeOrdersTotal = new client.Gauge({
  name: 'active_orders_total',
  help: 'Number of orders currently in pending/processing state',
  registers: [register]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests processed',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

module.exports = {
  register,
  ordersCreatedTotal,
  ordersFailedTotal,
  orderProcessingLatencySeconds,
  activeOrdersTotal,
  httpRequestsTotal,
  httpRequestDurationSeconds
};
