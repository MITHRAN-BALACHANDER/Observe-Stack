# Runbook

This document covers the most common alert conditions in ObservaStack and the exact steps to investigate and resolve them. All commands assume the stack is running via `docker compose up -d`.

---

## General investigation checklist

Before diving into a specific incident, get a quick state-of-the-world:

```bash
# Container health and restart counts
docker compose ps

# Recent logs from a specific service
docker compose logs --tail=100 <service-name>

# Active firing alerts
curl -s http://localhost:9093/api/v2/alerts | jq '.[].labels'

# Prometheus target health
curl -s http://localhost:9090/api/v1/targets \
  | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
```

Open these in parallel:

- Prometheus alerts: <http://localhost:9090/alerts>
- Alertmanager: <http://localhost:9093>
- Grafana Incident dashboard: <http://localhost:3030/d/observastack-incident>

---

## ServiceDown (critical)

**Condition:** `up == 0` for 1 minute
**Meaning:** Prometheus cannot reach a service's `/metrics` endpoint. The service may be crashed, the container may have exited, or the health check may be failing.

### Investigation

```bash
# Check which service is down
curl -s 'http://localhost:9090/api/v1/query?query=up' \
  | jq '.data.result[] | select(.value[1] == "0") | .metric.job'

# Check the container state
docker compose ps <service-name>

# Check why it crashed
docker compose logs --tail=50 <service-name>

# Check the health endpoint directly
curl http://localhost:3001/health   # auth-service
curl http://localhost:3002/health   # order-service
curl http://localhost:3003/health   # notification-service
curl http://localhost:3000/health   # gateway
```

### Resolution

If the container exited:

```bash
docker compose up -d <service-name>
```

If it keeps crashing, look at the startup logs for a missing environment variable or a dependency (Redis) not yet healthy:

```bash
docker compose logs --tail=200 <service-name> | grep -i "error\|fatal\|refused"
```

If Redis is the issue:

```bash
docker compose restart redis
docker compose up -d auth-service order-service
```

---

## ContainerRestart (warning)

**Condition:** Container restart count increases by more than 3 in 15 minutes
**Meaning:** A service is crash-looping.

### Investigation

```bash
# Restart counts per container
docker compose ps

# Crash reason
docker compose logs --tail=100 <service-name>
```

A crash-loop is most often caused by: an unhandled exception on startup, a missing env variable, or an OOM kill from the host. Check the log lines immediately before the crash — Winston logs at `error` level before an unhandled exception reaches the process.

---

## HighCPU (warning)

**Condition:** `instance:node_cpu_utilization:rate5m > 0.80` for 5 minutes
**Meaning:** Host CPU has been above 80% for at least 5 minutes.

This is a host-level metric from Node Exporter, not per-container. It reflects total CPU usage on the Docker host.

### Investigation

Grafana Infrastructure dashboard: <http://localhost:3030/d/observastack-infra>

```promql
rate(node_cpu_seconds_total[5m])
```

If the spike correlates with a `simulate-high-cpu.sh` run, it is expected. Otherwise look for a runaway process or an unintentionally running load test.

### Resolution

Check for runaway order simulation:

```bash
curl -s 'http://localhost:9090/api/v1/query?query=rate(order_processing_latency_seconds_sum[5m])' | jq
```

Stop the offending process or reduce the load test concurrency if a k6 run is the cause.

---

## HighMemory (warning)

**Condition:** `instance:node_memory_utilization:ratio > 0.85` for 5 minutes
**Meaning:** Host memory usage is above 85%.

### Investigation

```promql
1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)
```

```bash
docker stats --no-stream
```

Redis is capped at 256MB (`--maxmemory 256mb`) and will evict keys under pressure. If Prometheus is the culprit, its TSDB may have grown large.

### Resolution

```bash
# Check Prometheus storage size
docker compose exec prometheus du -sh /prometheus
```

To reduce retention, set `PROMETHEUS_RETENTION=7d` in `.env` and restart:

```bash
docker compose restart prometheus
```

---

## ErrorRateSpike (critical)

**Condition:** `job:http_error_ratio:rate5m > 0.05` for 2 minutes
**Meaning:** More than 5% of HTTP requests are returning 5xx for at least 2 minutes.

### Investigation

Identify which service has the elevated error rate:

```promql
job:http_error_ratio:rate5m
```

Check the error logs:

```bash
docker compose logs --tail=200 order-service | grep '"level":"error"'
```

Or query Loki:

```logql
{compose_service=~"auth-service|order-service|notification-service"} | json | level = "error"
```

Check the current failure rate:

```bash
curl -s 'http://localhost:9090/api/v1/query?query=rate(orders_failed_total[5m])/(rate(orders_created_total[5m])+rate(orders_failed_total[5m]))' \
  | jq '.data.result[0].value[1]'
```

### Resolution

If `ORDER_FAILURE_RATE` was raised for testing, reset it in `.env` and redeploy:

```bash
docker compose up -d order-service
```

---

## HighLatency (warning)

**Condition:** `job:http_latency_p95:rate5m > 1` for 5 minutes
**Meaning:** p95 request latency has been above 1 second for at least 5 minutes.

### Investigation

Identify which service:

```promql
job:http_latency_p95:rate5m
```

Check order processing latency specifically:

```promql
histogram_quantile(0.95, rate(order_processing_latency_seconds_bucket[5m]))
```

Correlate with CPU:

```promql
instance:node_cpu_utilization:rate5m
```

### Resolution

The order service deliberately introduces latency spikes (10% chance of a high-latency path). Single-digit spikes above 1s are expected under load. If all services are affected and CPU is high, check for a concurrent simulation script that was left running.

---

## QueueBacklog (warning)

**Condition:** `active_orders_total > 50` for 10 minutes
**Meaning:** The in-memory order store has more than 50 entries.

Since orders are stored in a `Map` that is never pruned, this gauge only ever increases during a session. This alert fires reliably during any sustained load test and is included to demonstrate queue-depth alerting.

```promql
active_orders_total
```

### Resolution

Restart the order service to reset the in-memory store:

```bash
docker compose restart order-service
```

---

## HighLoginFailureRate (warning)

**Condition:** Login failure rate > 30% for 3 minutes
**Meaning:** More than 30% of login attempts are failing.

### Investigation

```promql
sum by (reason) (rate(login_failure_total[5m]))
```

```logql
{compose_service="auth-service"} | json | message = "login failed"
```

The `reason` label will show `missing_credentials`, `user_not_found`, or `invalid_password`.

---

## NotificationDeliveryDegraded (warning)

**Condition:** Notification failure rate > 20% for 5 minutes
**Meaning:** More than 20% of notifications are failing. The default failure rate is 8%, so this requires a deliberate rate increase or a bug.

### Investigation

```promql
sum by (type, reason) (rate(notifications_failed_total[5m]))
```

### Resolution

Reset `NOTIFICATION_FAILURE_RATE=0.08` in `.env`, then:

```bash
docker compose up -d notification-service
```

---

## Useful PromQL one-liners

```promql
up{job=~"gateway|auth-service|order-service|notification-service"}

sum by (job) (job:http_requests:rate5m)

topk(5, sum by (job, route) (rate(http_requests_failed[5m])))

instance:node_disk_utilization:ratio
```

## Useful LogQL one-liners

```logql
{compose_service=~".+"} | json | level = "error"

{compose_service=~".+"} | json | correlationId = "REPLACE_ME"

{compose_service="order-service"} | json | level = "error"

{compose_service="auth-service"} | json | reason = "invalid_password"
```
