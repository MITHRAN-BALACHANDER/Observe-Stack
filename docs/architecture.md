# Architecture

## Overview

ObservaStack is a set of three Node.js services behind an API gateway, with a full observability stack — metrics, logs, alerting, and dashboards — running alongside in Docker Compose.

The gateway is the only public entry point. It proxies requests to the three backend services, strips the path prefix, and propagates the correlation ID header so requests can be traced across service boundaries.

```text
Client
  │
  │ :3000
  ▼
API Gateway (Express + http-proxy-middleware)
  │
  ├── /auth/*      → auth-service:3001
  ├── /orders/*    → order-service:3002
  └── /notifications/* → notification-service:3003
```

---

## Services

### API Gateway

- Generates a `requestId` (UUID v4) and reads or propagates `x-correlation-id` on every request.
- Measures HTTP request duration and records it to Prometheus histograms.
- Proxies to backend services using `http-proxy-middleware` v2; path prefixes (`/auth`, `/orders`, `/notifications`) are stripped before forwarding.
- No auth enforcement at the gateway layer — services handle their own validation.

### auth-service (port 3001)

- `POST /login` — validates credentials against an in-memory user store, compares the submitted password against a bcrypt hash, and returns a signed JWT on success.
- `POST /register` — hashes the password with bcrypt (salt rounds: 10) and inserts the user. Enforces an 8-character minimum password length.
- The user store (`src/store/users.js`) is a `Map` seeded with a demo account (`demo` / `password123`). There is no database — this is intentional to keep the stack self-contained.
- Redis is available at `redis://redis:6379` and is depended on at startup, though session state is currently managed in-process.

### order-service (port 3002)

- `POST /create-order` — validates the request body (userId, items array, totalAmount), then simulates a configurable failure rate (`FAILURE_RATE` env, default 5%) and a variable processing latency (50–800ms, with a 10% chance of a latency spike).
- `GET /orders/:id` — retrieves an order from the in-memory store.
- All orders are stored in a `Map`. There is no database or queue dependency.

### notification-service (port 3003)

- `POST /send-email` and `POST /send-sms` — simulate delivery with a configurable failure rate (`FAILURE_RATE` env, default 8%) and a variable latency (20–200ms).
- No external delivery system is connected. Failures are synthetic and controlled by the failure rate.

---

## Observability stack

```text
All services
  │ JSON logs to stdout
  ▼
Promtail (Docker socket discovery)
  │
  ▼
Loki :3100
  │
  └── Grafana :3030 (datasource: Loki)

All services
  │ GET /metrics (Prometheus text format)
  ▼
Prometheus :9090
  │
  ├── Grafana :3030 (datasource: Prometheus)
  └── Alertmanager :9093
        │
        └── Discord webhook

Node Exporter :9100
  │
  └── Prometheus (job: node-exporter)
```

### Prometheus

- Scrapes `/metrics` on all four services and on `node-exporter` every 15 seconds.
- Evaluates alert rules and recording rules on the same 15-second interval.
- Data is retained for 30 days by default (`PROMETHEUS_RETENTION` env).
- The lifecycle API is enabled (`--web.enable-lifecycle`) so config can be hot-reloaded with `POST /-/reload`.

### Loki

- Uses the `tsdb` storage schema (v13) backed by local filesystem.
- Promtail discovers running containers via the Docker socket and forwards their stdout/stderr to Loki.
- The pipeline stages parse Winston JSON, extract the `level` and `service` labels, and drop health-check noise.

### Grafana

- Four dashboards are provisioned from JSON files at startup — no manual import needed.
- Both Prometheus and Loki datasources are provisioned automatically.
- Persistent dashboard state is stored in a named Docker volume (`grafana-data`).

### Alertmanager

- Receives firing alerts from Prometheus and routes them to a Discord webhook.
- Critical alerts are grouped and delivered after a 10-second wait; warnings after 60 seconds.
- A `ServiceDown` alert inhibits all other alerts for the same job to prevent alert storms.

---

## Request flow

A typical order creation request:

1. Client sends `POST /orders/create-order` to the gateway on port 3000.
2. Gateway assigns a `requestId`, reads or generates a `correlationId`, records request start time.
3. Gateway proxies the request to `order-service:3002/create-order`.
4. order-service validates the body, runs the failure-rate check, simulates latency, persists to the in-memory store.
5. Both gateway and order-service emit a structured JSON log line to stdout with the `correlationId`.
6. Promtail picks up both log lines from the Docker socket and ships them to Loki with a `service` label.
7. Gateway records the request duration to `http_request_duration_seconds` and increments `http_requests_total`.
8. order-service records to `order_processing_latency_seconds`, `orders_created_total` (or `orders_failed_total`), and `active_orders_total`.
9. Prometheus scrapes both `/metrics` endpoints within the next 15 seconds.

To trace the full request: query Loki with `{service=~"api-gateway|order-service"} |= "<correlationId>"`.

---

## Correlation IDs

Every service has a `correlationIdMiddleware` that:

- Reads `x-correlation-id` from the incoming request headers (set by the gateway when it first generates one).
- Falls back to `x-request-id` if `x-correlation-id` is absent.
- Attaches both IDs to every log line written during that request.

This means a single correlation ID can be used to pull logs from all services involved in one request, even without a distributed tracing backend.

---

## Network

All containers share a single bridge network named `observastack_network`. Services communicate by container name (e.g., `auth-service:3001`). No service is reachable from the host except through the ports exposed in `docker-compose.yml`.

---

## Persistence

| Volume | Contents |
|--------|----------|
| `prometheus-data` | Prometheus TSDB blocks and WAL |
| `grafana-data` | Grafana database, dashboard state, plugins |
| `loki-data` | Loki log chunks and index |
| `alertmanager-data` | Alertmanager silences and notification log |
| `redis-data` | Redis AOF file (append-only persistence) |

Deleting volumes with `docker compose down -v` resets all state to zero.
