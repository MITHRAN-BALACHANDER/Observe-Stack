/**
 * Spike test — simulates a sudden traffic surge across all services.
 * Designed to trigger HighLatency and ErrorRateSpike alerts in Alertmanager.
 */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('spike_error_rate');
const latency = new Trend('spike_latency_ms', true);

export const options = {
  stages: [
    { duration: '10s', target: 5 },    // baseline
    { duration: '10s', target: 100 },  // instant spike
    { duration: '2m',  target: 100 },  // sustained spike — alerts should fire
    { duration: '10s', target: 5 },    // recovery
    { duration: '30s', target: 5 },    // post-spike observation
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    // Intentionally loose — this test is designed to trigger alerts
    'http_req_duration': ['p(99)<10000'],
    'spike_error_rate': ['rate<0.50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const SCENARIOS = ['login', 'order', 'notify_email', 'notify_sms'];

function runLogin(headers) {
  return http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ username: 'demo', password: 'password123' }),
    { headers }
  );
}

function runOrder(headers) {
  return http.post(
    `${BASE_URL}/orders/create-order`,
    JSON.stringify({
      userId: `spike-user-${__VU}`,
      items: [{ sku: 'SPIKE-ITEM', quantity: 1, price: 10.00 }],
      totalAmount: 10.00,
    }),
    { headers }
  );
}

function runNotifyEmail(headers) {
  return http.post(
    `${BASE_URL}/notifications/send-email`,
    JSON.stringify({ to: 'test@example.com', subject: 'Spike', body: 'Spike test message' }),
    { headers }
  );
}

function runNotifySms(headers) {
  return http.post(
    `${BASE_URL}/notifications/send-sms`,
    JSON.stringify({ phoneNumber: '+1555000000', message: 'Spike test' }),
    { headers }
  );
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-correlation-id': `k6-spike-${__VU}-${__ITER}`,
  };

  const scenario = SCENARIOS[__VU % SCENARIOS.length];

  group(`spike/${scenario}`, () => {
    let res;
    switch (scenario) {
      case 'login':       res = runLogin(headers); break;
      case 'order':       res = runOrder(headers); break;
      case 'notify_email': res = runNotifyEmail(headers); break;
      case 'notify_sms':  res = runNotifySms(headers); break;
    }

    if (!res) return;

    latency.add(res.timings.duration);

    const ok = check(res, {
      'status not 502/503': (r) => r.status !== 502 && r.status !== 503,
      'latency < 5s': (r) => r.timings.duration < 5000,
    });

    errorRate.add(!ok || res.status >= 500);
  });

  // Minimal sleep during spike to maximize pressure
  sleep(0.1 + Math.random() * 0.2);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      test: 'spike-test',
      timestamp: new Date().toISOString(),
      metrics: {
        total_requests: data.metrics.http_reqs?.values?.count,
        error_rate: data.metrics.spike_error_rate?.values?.rate,
        p95_ms: data.metrics.http_req_duration?.values['p(95)'],
        p99_ms: data.metrics.http_req_duration?.values['p(99)'],
        max_ms: data.metrics.http_req_duration?.values?.max,
      },
    }, null, 2),
  };
}
