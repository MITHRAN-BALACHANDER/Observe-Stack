import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 50 },
    { duration: '20s', target: 0 },
  ],
};

export default function () {
  const urls = [
    'http://gateway:3000/auth/login',
    'http://gateway:3000/orders/create',
    'http://gateway:3000/notifications/send-email'
  ];

  const payload = JSON.stringify({
    username: 'testuser',
    password: 'testpass'
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(urls[Math.floor(Math.random() * urls.length)], payload, params);

  check(res, {
    'status is 2xx or 3xx': (r) => r.status < 400,
  });

  sleep(0.5);
}
