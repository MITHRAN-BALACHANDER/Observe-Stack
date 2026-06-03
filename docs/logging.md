# Logging

## Log format

All services use Winston configured for structured JSON output to stdout. No colorization, no pretty-printing — the logs are intended to be parsed by Promtail, not read directly from a terminal.

Every log line has this shape:

```json
{
  "timestamp": "2026-06-03T14:22:01.456Z",
  "level": "info",
  "message": "order created successfully",
  "service": "order-service",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "correlationId": "abc123def456",
  "orderId": "ORD-A1B2C3D4"
}
```

The `service` field is set as a Winston default metadata field. `requestId` is the UUID generated per request. `correlationId` is the value from the `x-correlation-id` header — set by the gateway on the first hop and propagated through all downstream calls.

Log level is controlled by the `LOG_LEVEL` environment variable (default: `info`). Valid values: `error`, `warn`, `info`, `debug`.

---

## Log pipeline

```text
Service stdout (JSON)
  │
  ▼
Docker JSON file logging driver
  │  /var/lib/docker/containers/<id>/<id>-json.log
  ▼
Promtail (Docker socket discovery)
  │  Discovers containers via /var/run/docker.sock
  │  Reads log files from /var/lib/docker/containers
  │  Parses JSON, extracts labels, drops health-check noise
  ▼
Loki :3100
  │
  └── Grafana :3030 → Explore → Loki datasource
```

Promtail attaches the following labels to every log stream:

| Label | Value | Source |
|-------|-------|--------|
| `service` | e.g. `auth-service` | extracted from `service` field in the JSON log |
| `level` | e.g. `info`, `error` | extracted from `level` field in the JSON log |
| `container_name` | Docker container name | Docker SD metadata |
| `compose_service` | Docker Compose service name | Docker SD metadata |
| `stream` | `stdout` or `stderr` | Docker SD metadata |

Promtail's pipeline also drops health-check log lines to reduce noise. Any log line with `GET /health` in the message is filtered out before shipping to Loki.

![Grafana Explore — Loki log stream with parsed labels](images/loki-explore.png)

---

## Querying logs in Grafana

Open Grafana at <http://localhost:3030>, go to **Explore**, select the **Loki** datasource.

### Common LogQL queries

Filter all errors across all application services:

```logql
{compose_service=~"auth-service|order-service|notification-service"} | json | level = "error"
```

Trace a request end-to-end using a correlation ID:

```logql
{compose_service=~"api-gateway|auth-service|order-service|notification-service"} | json | correlationId = "abc123def456"
```

All order failures in the last 10 minutes:

```logql
{compose_service="order-service"} | json | message =~ "failed|error"
```

Login failures with reason:

```logql
{compose_service="auth-service"} | json | message = "login failed"
```

High-latency requests from the gateway (over 500ms):

```logql
{compose_service="api-gateway"} | json | latencyMs > 500
```

Count errors per service over time (metrics from logs):

```logql
sum by (compose_service) (
  rate({compose_service=~"auth-service|order-service|notification-service"} | json | level = "error" [5m])
)
```

---

## Correlation IDs

The gateway generates a `correlationId` from the `x-correlation-id` request header, or creates a new UUID if the header is absent. It is:

1. Set on the response as `x-correlation-id`
2. Forwarded to the downstream service as a request header
3. Attached to every log line via `correlationIdMiddleware` in each service

To trace all logs for a single end-user request, copy the `x-correlation-id` value from any response header and search for it in Loki:

```bash
# Make a request and capture the correlation ID
curl -i -X POST http://localhost:3000/orders/create-order \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","items":[{"sku":"WIDGET","quantity":1,"price":9.99}],"totalAmount":9.99}' \
  2>&1 | grep -i x-correlation-id
```

Then query Loki:

```logql
{compose_service=~"api-gateway|order-service"} | json | correlationId = "<value>"
```

![Cross-service correlation trace in Loki](images/loki-correlation-trace.png)

---

## Log retention

Loki retains logs based on the `compactor.retention_delete_delay` setting in `loki-config.yml` (currently 2 hours). The underlying storage is a named Docker volume (`loki-data`). There is no time-based retention configured beyond what Loki's compactor enforces — logs accumulate until the volume is pruned or the stack is torn down with `docker compose down -v`.

---

## Sensitive data

No passwords, JWT tokens, or personally identifiable information are logged. The auth service logs usernames on login attempts but does not log passwords or tokens at any level. The `LOG_LEVEL=debug` setting increases verbosity but does not expose sensitive fields.
