import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
};

export default function () {
  const url = 'http://gateway:3000/orders/create';
  const payload = JSON.stringify({
    userId: 'user123',
    items: [
      { productId: 'prod1', quantity: 2 },
      { productId: 'prod2', quantity: 1 }
    ],
    totalAmount: 99.99
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(url, payload, params);

  check(res, {
    'status is 201': (r) => r.status === 201,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
