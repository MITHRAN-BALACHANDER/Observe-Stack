// Custom metrics specific to auth service
const { authAttempts, authDuration } = require('../metrics/prometheus');

function recordAuthAttempt(success) {
  authAttempts.labels(success ? 'success' : 'failure').inc();
}

function recordAuthDuration(operation, duration) {
  authDuration.labels(operation).observe(duration);
}

module.exports = {
  recordAuthAttempt,
  recordAuthDuration
};
