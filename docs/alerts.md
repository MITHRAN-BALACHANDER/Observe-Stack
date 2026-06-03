# Alerts

## Alert rules

Rules are defined in [monitoring/prometheus/alert-rules.yml](../monitoring/prometheus/alert-rules.yml) and loaded by Prometheus at startup. Prometheus evaluates all rules every 15 seconds.

### Service health

| Alert | Severity | Condition | For |
|-------|----------|-----------|-----|
| `ServiceDown` | critical | `up == 0` | 1m |
| `ContainerRestart` | warning | restart count > 3 in the last 15 minutes | immediate |

`ServiceDown` fires when Prometheus cannot scrape a target for a full minute. It uses an inhibition rule in Alertmanager: while `ServiceDown` is active for a given job, all other alerts for that same job are suppressed.

`ContainerRestart` uses `changes(up[15m]) >= 4` — it counts how many times a target's `up` metric toggles within 15 minutes. This works without cAdvisor using only the data Prometheus scrapes from each service's `/metrics` endpoint. Four or more state changes in 15 minutes indicates a service is crash-looping.

### Infrastructure

| Alert | Severity | Condition | For |
|-------|----------|-----------|-----|
| `HighCPU` | warning | CPU utilization > 80% | 5m |
| `HighMemory` | warning | Memory utilization > 85% | 5m |
| `DiskSpaceLow` | warning | Filesystem used > 85% | 10m |

These use the recording rules pre-computed in `recording-rules.yml`:

- `instance:node_cpu_utilization:rate5m`
- `instance:node_memory_utilization:ratio`
- `instance:node_disk_utilization:ratio`

### Application SLOs

| Alert | Severity | Condition | For |
|-------|----------|-----------|-----|
| `HighLatency` | warning | p95 request latency > 1s | 5m |
| `ErrorRateSpike` | critical | HTTP error rate > 5% | 2m |

`ErrorRateSpike` is based on the recording rule `job:http_error_ratio:rate5m`. It fires when more than 5% of requests to any job return a 5xx status for at least two consecutive minutes.

### Business metrics

| Alert | Severity | Condition | For |
|-------|----------|-----------|-----|
| `QueueBacklog` | warning | `active_orders_total` > 50 | 10m |
| `HighLoginFailureRate` | warning | login failure rate > 30% | 3m |
| `NotificationDeliveryDegraded` | warning | notification failure rate > 20% | 5m |

`HighLoginFailureRate` fires when the ratio of `login_failure_total` to `auth_requests_total` exceeds 30% for three minutes. At the default 5% order failure rate and 8% notification failure rate, these alerts should remain quiet under normal load.

![Prometheus alert rules page](images/prometheus-alerts.png)

---

## Alertmanager routing

Alertmanager is configured in [monitoring/alertmanager/alertmanager.yml](../monitoring/alertmanager/alertmanager.yml).

### Delivery

All alerts are routed to Discord via a webhook receiver. There is one channel for critical alerts and one for warnings. The webhook URL is read from the `DISCORD_WEBHOOK_URL` environment variable set in `.env`.

To configure the webhook:

1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**
2. Select a channel, copy the URL
3. Set `DISCORD_WEBHOOK_URL` in `.env`
4. Restart Alertmanager: `docker compose restart alertmanager`

### Timing

| Severity | Group wait | Repeat interval |
|----------|-----------|----------------|
| critical | 10s | 1h |
| warning | 60s | 4h |

`group_wait` is how long Alertmanager waits to batch alerts before sending the first notification. `repeat_interval` is how long it waits before re-notifying if the alert is still firing.

### Inhibition

When `ServiceDown` is active for a job, all other alerts for that job are inhibited. This prevents a service restart from generating a flood of `HighErrorRate`, `HighLatency`, and `QueueBacklog` notifications simultaneously.

![Alertmanager UI with active alert groups](images/alertmanager-ui.png)

<!-- ![Discord alert notification](images/discord-alert.png) -->

---

## Viewing and managing alerts

**Active alerts in Prometheus:** <http://localhost:9090/alerts>

**Alertmanager UI:** <http://localhost:9093>

### Reload Prometheus rules without restart

Prometheus is started with `--web.enable-lifecycle`. Send a POST to apply rule changes immediately:

```bash
curl -X POST http://localhost:9090/-/reload
```

### Silence an alert

Via the Alertmanager UI at <http://localhost:9093>: click the alert, then **Silence**. Set a duration and a comment.

Via the API:

```bash
curl -X POST http://localhost:9093/api/v2/silences \
  -H "Content-Type: application/json" \
  -d '{
    "matchers": [{"name": "alertname", "value": "HighCPU", "isRegex": false}],
    "startsAt": "2026-06-03T00:00:00Z",
    "endsAt": "2026-06-03T02:00:00Z",
    "comment": "scheduled maintenance",
    "createdBy": "ops"
  }'
```

### Check Alertmanager config is valid

```bash
docker compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml
```
