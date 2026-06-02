import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const loginSuccess = new Counter('login_success');
const loginFailure = new Counter('login_failure');
const loginErrorRate = new Rate('login_error_rate');
const loginDuration = new Trend('login_duration_ms', true);

export const options = {
  stages: [
    { duration: '30s', target: 5 },   // warm up
    { duration: '1m',  target: 30 },  // ramp to steady state
    { duration: '2m',  target: 30 },  // hold steady
    { duration: '30s', target: 60 },  // burst
    { duration: '1m',  target: 60 },  // hold burst
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'login_error_rate': ['rate<0.05'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const VALID_USERS = [
  { username: 'demo', password: 'password123' },
];

const INVALID_USERS = [
  { username: 'demo', password: 'wrongpassword' },
  { username: 'nonexistent', password: 'password123' },
];

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-correlation-id': `k6-login-${__VU}-${__ITER}`,
  };

  group('auth flow', () => {
    // 80% valid logins, 20% invalid to generate realistic failure metrics
    const isValid = Math.random() < 0.8;
    const user = isValid
      ? VALID_USERS[Math.floor(Math.random() * VALID_USERS.length)]
      : INVALID_USERS[Math.floor(Math.random() * INVALID_USERS.length)];

    const res = http.post(
      `${BASE_URL}/auth/login`,
      JSON.stringify(user),
      { headers }
    );

    loginDuration.add(res.timings.duration);

    const ok = check(res, {
      'login status is 200 or 401': (r) => [200, 401].includes(r.status),
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has x-correlation-id': (r) => r.headers['X-Correlation-Id'] !== undefined,
    });

    if (res.status === 200) {
      loginSuccess.add(1);
      loginErrorRate.add(false);
    } else if (res.status === 401) {
      loginFailure.add(1);
      loginErrorRate.add(false);
    } else {
      loginErrorRate.add(true);
    }
  });

  sleep(1 + Math.random() * 0.5);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      test: 'login-load',
      timestamp: new Date().toISOString(),
      metrics: {
        login_success: data.metrics.login_success?.values?.count,
        login_failure: data.metrics.login_failure?.values?.count,
        p95_duration_ms: data.metrics.http_req_duration?.values['p(95)'],
        p99_duration_ms: data.metrics.http_req_duration?.values['p(99)'],
        error_rate: data.metrics.http_req_failed?.values.rate,
      },
    }, null, 2),
  };
}
