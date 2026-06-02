const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const emailsSent = new client.Counter({
  name: 'emails_sent_total',
  help: 'Total emails sent',
  labelNames: ['status'],
  registers: [register]
});

const smsSent = new client.Counter({
  name: 'sms_sent_total',
  help: 'Total SMS messages sent',
  labelNames: ['status'],
  registers: [register]
});

const notificationDuration = new client.Histogram({
  name: 'notification_duration_seconds',
  help: 'Notification sending duration',
  labelNames: ['type'],
  registers: [register],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

module.exports = {
  register,
  emailsSent,
  smsSent,
  notificationDuration
};
