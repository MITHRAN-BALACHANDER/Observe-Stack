const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({ service: 'notification-service' });
client.collectDefaultMetrics({ register });

const notificationsSentTotal = new client.Counter({
  name: 'notifications_sent_total',
  help: 'Total notifications successfully delivered',
  labelNames: ['type'],
  registers: [register]
});

const notificationsFailedTotal = new client.Counter({
  name: 'notifications_failed_total',
  help: 'Total notifications that failed to deliver',
  labelNames: ['type', 'reason'],
  registers: [register]
});

const notificationLatencySeconds = new client.Histogram({
  name: 'notification_latency_seconds',
  help: 'Notification delivery latency in seconds',
  labelNames: ['type'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
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
  notificationsSentTotal,
  notificationsFailedTotal,
  notificationLatencySeconds,
  httpRequestsTotal,
  httpRequestDurationSeconds
};
