# Load Testing Reports

This directory contains reports from load testing runs.

## Files
- `login-load-report.html` - Login service load test results
- `order-load-report.html` - Order service load test results
- `spike-test-report.html` - Spike test results

## Running Tests

```bash
# Login load test
k6 run --vus 50 --duration 5m k6/login-load.js

# Order load test
k6 run --vus 30 --duration 5m k6/order-load.js

# Spike test
k6 run k6/spike-test.js
```

## Interpreting Results

Key metrics:
- **Response Time**: Average, min, max duration
- **Throughput**: Requests per second
- **Error Rate**: Failed requests percentage
- **VU Count**: Virtual users in test
