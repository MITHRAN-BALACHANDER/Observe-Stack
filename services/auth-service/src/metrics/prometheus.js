const client = require('prom-client');

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const authAttempts = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['result'],
  registers: [register]
});

const authDuration = new client.Histogram({
  name: 'auth_duration_seconds',
  help: 'Authentication operation duration',
  labelNames: ['operation'],
  registers: [register],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

module.exports = {
  register,
  authAttempts,
  authDuration
};
