const { loginSuccessTotal, loginFailureTotal, authLatencySeconds } = require('./prometheus');

function recordLoginSuccess() {
  loginSuccessTotal.inc();
}

function recordLoginFailure(reason) {
  loginFailureTotal.inc({ reason });
}

function recordLatency(method, path, status, durationSeconds) {
  authLatencySeconds.observe({ method, path, status }, durationSeconds);
}

module.exports = { recordLoginSuccess, recordLoginFailure, recordLatency };
