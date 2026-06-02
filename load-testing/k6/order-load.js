import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

const ordersCreated = new Counter('orders_created');
const ordersFailed = new Counter('orders_failed');
const orderErrorRate = new Rate('order_error_rate');
const orderDuration = new Trend('order_duration_ms', true);

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m',  target: 20 },
    { duration: '3m',  target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000', 'p(99)<5000'],
    'order_error_rate': ['rate<0.10'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const SKUS = ['WIDGET-001', 'GADGET-XL', 'SENSOR-V2', 'MODULE-PRO', 'CABLE-USB-C'];

function randomOrder() {
  const itemCount = 1 + Math.floor(Math.random() * 3);
  const items = [];
  let total = 0;
  for (let i = 0; i < itemCount; i++) {
    const price = parseFloat((5 + Math.random() * 95).toFixed(2));
    const qty = 1 + Math.floor(Math.random() * 5);
    items.push({ sku: SKUS[Math.floor(Math.random() * SKUS.length)], quantity: qty, price });
    total += price * qty;
  }
  return {
    userId: `user-${__VU}-${Math.floor(Math.random() * 1000)}`,
    items,
    totalAmount: parseFloat(total.toFixed(2)),
  };
}

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'x-correlation-id': `k6-order-${__VU}-${__ITER}`,
  };

  group('order lifecycle', () => {
    const createRes = http.post(
      `${BASE_URL}/orders/create-order`,
      JSON.stringify(randomOrder()),
      { headers }
    );

    orderDuration.add(createRes.timings.duration);

    check(createRes, {
      'create order 201 or 500 (simulated failures ok)': (r) => [201, 500].includes(r.status),
      'create response time < 2s': (r) => r.timings.duration < 2000,
    });

    if (createRes.status === 201) {
      ordersCreated.add(1);
      orderErrorRate.add(false);

      let body;
      try { body = JSON.parse(createRes.body); } catch (_) { return; }

      const getRes = http.get(
        `${BASE_URL}/orders/orders/${body.orderId}`,
        { headers }
      );

      check(getRes, {
        'get order 200': (r) => r.status === 200,
      });
    } else {
      ordersFailed.add(1);
      orderErrorRate.add(createRes.status >= 500);
    }
  });

  sleep(1 + Math.random() * 1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify({
      test: 'order-load',
      timestamp: new Date().toISOString(),
      metrics: {
        orders_created: data.metrics.orders_created?.values?.count,
        orders_failed: data.metrics.orders_failed?.values?.count,
        p95_duration_ms: data.metrics.http_req_duration?.values['p(95)'],
        p99_duration_ms: data.metrics.http_req_duration?.values['p(99)'],
      },
    }, null, 2),
  };
}
