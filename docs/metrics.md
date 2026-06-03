# Metrics

All services expose a `/metrics` endpoint in Prometheus text format. Prometheus scrapes every 15 seconds. Node.js default metrics (event loop lag, heap, GC, libuv handles) are collected automatically via `prom-client`'s `collectDefaultMetrics()`.

![Prometheus targets — all services UP](images/prometheus-targets.png)

---

## Application metrics

### API Gateway

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status` | End-to-end proxy duration including upstream response |
| `http_requests_total` | Counter | `method`, `route`, `status` | Total requests proxied |
| `http_requests_failed` | Counter | `method`, `route`, `status` | Requests that returned 4xx/5xx or resulted in a proxy error |

Histogram buckets: `0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5`.

### auth-service

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `auth_requests_total` | Counter | `method`, `route`, `status_code` | All requests to the auth service |
| `login_success_total` | Counter | — | Successful login attempts |
| `login_failure_total` | Counter | `reason` | Failed login attempts; reason is one of `missing_credentials`, `user_not_found`, `invalid_password` |
| `auth_latency_seconds` | Histogram | `route` | Request duration for auth endpoints |
| `active_sessions_total` | Gauge | — | In-memory count of active JWT sessions |

### order-service

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `orders_created_total` | Counter | — | Successfully created orders |
| `orders_failed_total` | Counter | `reason` | Failed order attempts |
| `order_processing_latency_seconds` | Histogram | — | Simulated processing duration including latency spikes |
| `active_orders_total` | Gauge | — | Current count of in-memory orders |

The order service runs a 5% random failure rate by default (`ORDER_FAILURE_RATE=0.05`). The `QueueBacklog` alert fires when `active_orders_total` exceeds 50 for 10 minutes.

### notification-service

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `notifications_sent_total` | Counter | `type` | Successfully delivered notifications; type is `email` or `sms` |
| `notifications_failed_total` | Counter | `type`, `reason` | Failed notifications |
| `notification_latency_seconds` | Histogram | `type` | Simulated delivery duration |

The notification service runs an 8% random failure rate by default (`NOTIFICATION_FAILURE_RATE=0.08`).

---

## Infrastructure metrics

Collected by Node Exporter (`job="node-exporter"`) and exposed on port 9100.

| Metric family | Description |
|---------------|-------------|
| `node_cpu_seconds_total` | CPU time by mode (user, system, idle, iowait) |
| `node_memory_MemTotal_bytes` / `node_memory_MemAvailable_bytes` | Total and available RAM |
| `node_disk_read_bytes_total` / `node_disk_written_bytes_total` | Disk I/O by device |
| `node_network_receive_bytes_total` / `node_network_transmit_bytes_total` | Network I/O by interface |
| `node_load1` / `node_load5` / `node_load15` | System load averages |
| `node_filesystem_size_bytes` / `node_filesystem_avail_bytes` | Filesystem capacity by mount point |

---

## Recording rules

Pre-computed aggregations in [monitoring/prometheus/recording-rules.yml](../monitoring/prometheus/recording-rules.yml). These reduce query-time cost for dashboards and alert expressions.

### Infrastructure

| Rule | Expression summary |
|------|--------------------|
| `instance:node_cpu_utilization:rate5m` | 1 minus the 5-minute idle CPU rate |
| `instance:node_memory_utilization:ratio` | `(MemTotal - MemAvailable) / MemTotal` |
| `instance:node_disk_utilization:ratio` | `(size - avail) / size` per device |
| `instance:node_network_receive:rate5m` | 5-minute receive byte rate |
| `instance:node_network_transmit:rate5m` | 5-minute transmit byte rate |

### HTTP

| Rule | Expression summary |
|------|--------------------|
| `job:http_requests:rate5m` | Request rate per job |
| `job:http_errors:rate5m` | Error rate per job |
| `job:http_error_ratio:rate5m` | `errors / requests` per job |
| `job:http_latency_p50:rate5m` | 50th percentile latency per job |
| `job:http_latency_p95:rate5m` | 95th percentile latency per job |
| `job:http_latency_p99:rate5m` | 99th percentile latency per job |

### Business KPIs

| Rule | Expression summary |
|------|--------------------|
| `observastack:login_success_rate:rate5m` | `login_success / auth_requests` |
| `observastack:order_success_rate:rate5m` | `orders_created / (orders_created + orders_failed)` |
| `observastack:notification_success_rate:rate5m` | `notifications_sent / (sent + failed)` |
| `observastack:order_processing_p95:rate5m` | p95 of `order_processing_latency_seconds` |

---

## Common PromQL queries

Request rate for a single service:

```promql
rate(http_requests_total{job="order-service"}[5m])
```

HTTP error ratio across all services:

```promql
job:http_error_ratio:rate5m
```

p95 latency by service:

```promql
job:http_latency_p95:rate5m
```

Login failure breakdown by reason:

```promql
sum by (reason) (rate(login_failure_total[5m]))
```

Order failure rate:

```promql
rate(orders_failed_total[5m]) / (rate(orders_created_total[5m]) + rate(orders_failed_total[5m]))
```

Active orders gauge:

```promql
active_orders_total
```

Node memory utilization:

```promql
instance:node_memory_utilization:ratio
```

![Prometheus graph — request rate by service](images/prometheus-graph.png)

---

## Metrics retention

Prometheus retains data for 30 days by default. This is controlled by the `PROMETHEUS_RETENTION` environment variable in `.env` (passed to Prometheus as `--storage.tsdb.retention.time`). The data lives in the `prometheus-data` Docker volume.

To check current storage usage:

```bash
docker compose exec prometheus du -sh /prometheus
```
