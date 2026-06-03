const client = require('prom-client');

const register = new client.Registry();

register.setDefaultLabels({ service: 'auth-service' });
client.collectDefaultMetrics({ register });

const authRequestsTotal = new client.Counter({
  name: 'auth_requests_total',
  help: 'Total number of auth requests by method, path, and status',
  labelNames: ['method', 'path', 'status'],
  registers: [register]
});

const loginSuccessTotal = new client.Counter({
  name: 'login_success_total',
  help: 'Total number of successful login attempts',
  registers: [register]
});

const loginFailureTotal = new client.Counter({
  name: 'login_failure_total',
  help: 'Total number of failed login attempts',
  labelNames: ['reason'],
  registers: [register]
});

const authLatencySeconds = new client.Histogram({
  name: 'auth_latency_seconds',
  help: 'Auth service request latency in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

const activeSessionsTotal = new client.Gauge({
  name: 'active_sessions_total',
  help: 'Estimated number of active JWT sessions',
  registers: [register]
});

// Standard cross-service HTTP metrics used by shared alert and recording rules
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
  authRequestsTotal,
  loginSuccessTotal,
  loginFailureTotal,
  authLatencySeconds,
  activeSessionsTotal,
  httpRequestsTotal,
  httpRequestDurationSeconds
};
