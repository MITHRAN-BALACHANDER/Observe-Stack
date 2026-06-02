# Metrics Collection

## Metrics Types

### System Metrics
- CPU usage, memory, disk, network
- Container metrics
- Process metrics

### Application Metrics
- HTTP request count
- Request duration
- Error count and rate
- Queue sizes
- Database connection pool stats

### Business Metrics
- Orders processed
- Transaction success rate
- User registrations
- Active sessions
- Revenue metrics

## Prometheus Scrape Configuration

Services expose metrics on `/metrics` endpoint:
- Gateway: http://localhost:3000/metrics
- Auth Service: http://localhost:3001/metrics
- Order Service: http://localhost:3002/metrics
- Notification Service: http://localhost:3003/metrics

## Custom Metrics

Services implement custom metrics:
- Business transaction counters
- Custom latency histograms
- Application-specific gauges

## PromQL Queries

Common queries for dashboards:
- Request rate: rate(http_requests_total[5m])
- Error ratio: rate(http_requests_failed[5m]) / rate(http_requests_total[5m])
- Latency: histogram_quantile(0.95, http_request_duration_seconds_bucket)

## Retention Policy

Metrics are retained for ${PROMETHEUS_RETENTION} (default 30 days).
