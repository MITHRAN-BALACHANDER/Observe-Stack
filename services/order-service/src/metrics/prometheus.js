const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const ordersCreated = new client.Counter({
  name: 'orders_created_total',
  help: 'Total orders created',
  labelNames: ['status'],
  registers: [register]
});

const orderDuration = new client.Histogram({
  name: 'order_processing_duration_seconds',
  help: 'Order processing duration',
  registers: [register],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const queueSize = new client.Gauge({
  name: 'order_queue_size',
  help: 'Current order queue size',
  registers: [register]
});

module.exports = {
  register,
  ordersCreated,
  orderDuration,
  queueSize
};
