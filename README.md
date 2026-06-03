# ObservaStack

A production-inspired distributed observability platform demonstrating SRE engineering fundamentals: metrics collection, structured logging, distributed tracing correlation, alerting pipelines, and incident response tooling — all running locally via Docker Compose.

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           Client Traffic                 │
                    └────────────────┬────────────────────────┘
                                     │ :3000
                             ┌───────▼───────┐
                             │   API Gateway  │
                             │  (express +    │
                             │  http-proxy)   │
                             └──┬──────┬──┬──┘
                    ┌───────────┘      │  └──────────────┐
                    │ /auth            │ /orders          │ /notifications
           ┌────────▼───────┐  ┌──────▼──────┐  ┌──────▼──────────┐
           │  auth-service  │  │ order-service│  │notification-svc │
           │  :3001         │  │  :3002       │  │  :3003           │
           │  POST /login   │  │ POST /create │  │ POST /send-email │
           │  POST /register│  │ GET /orders/ │  │ POST /send-sms   │
           └────────────────┘  └─────────────┘  └──────────────────┘
                    │                  │                   │
                    └──────────────────┼───────────────────┘
                                       │  JSON logs → stdout
                              ┌────────▼────────┐
                              │    Promtail      │
                              │ (Docker socket)  │
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐    ┌─────────────────┐
                              │       Loki        │◄───│    Grafana       │
                              │  (log storage)    │    │  Dashboards:    │
                              └───────────────────┘    │  Infrastructure │
                                                        │  Application    │
                              ┌────────────────────┐   │  Business       │
                              │    Prometheus       │───│  Incident       │
                              │  Scrapes /metrics   │   └─────────────────┘
                              │  on all services    │
                              └────────┬────────────┘
                                       │ Alert rules
                              ┌────────▼────────────┐
                              │    Alertmanager      │
                              │  Routes → Discord    │
                              └─────────────────────┘

                              ┌─────────────────────┐
                              │    Node Exporter     │
                              │  CPU/Mem/Disk/Net    │
                              └─────────────────────┘

                              ┌─────────────────────┐
                              │      Redis           │
                              │  Session cache       │
                              └─────────────────────┘
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Docker | 24+ |
| Docker Compose | v2 (plugin, not standalone) |
| Git | any |

For load testing:
| Tool | Version |
|------|---------|
| k6 | 0.46+ |

---

## Quick Start

```bash
# Clone and enter the repo
git clone https://github.com/MITHRAN-BALACHANDER/Observe-Stack observastack
cd observastack

# Copy environment config
cp .env.example .env

# Start everything
docker compose up -d

# Verify all containers are healthy (takes ~30s)
docker compose ps
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | — |
| Grafana | http://localhost:3030 | admin / observastack |
| Prometheus | http://localhost:9090 | — |
| Alertmanager | http://localhost:9093 | — |
| Loki | http://localhost:3100 | — |
| Node Exporter | http://localhost:9100 | — |

---

## API Reference

### Auth Service (via gateway)

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'

# Login (returns JWT)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password123"}'
```

### Order Service (via gateway)

```bash
# Create order
curl -X POST http://localhost:3000/orders/create-order \
  -H "Content-Type: application/json" \
  -d '{"userId":"user-1","items":[{"sku":"WIDGET","quantity":2,"price":9.99}],"totalAmount":19.98}'

# Get order
curl http://localhost:3000/orders/orders/ORD-XXXXXXXX
```

### Notification Service (via gateway)

```bash
# Send email
curl -X POST http://localhost:3000/notifications/send-email \
  -H "Content-Type: application/json" \
  -d '{"to":"user@example.com","subject":"Welcome","body":"Thanks for joining!"}'

# Send SMS
curl -X POST http://localhost:3000/notifications/send-sms \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+1234567890","message":"Your code is 123456"}'
```

---

## Observability

### Metrics

Every service exposes a `/metrics` endpoint in Prometheus text format. Prometheus scrapes all services every 15 seconds.

Key metrics per service:

| Metric | Type | Service |
|--------|------|---------|
| `auth_requests_total` | Counter | auth |
| `login_success_total` | Counter | auth |
| `login_failure_total{reason}` | Counter | auth |
| `auth_latency_seconds` | Histogram | auth |
| `orders_created_total` | Counter | order |
| `orders_failed_total{reason}` | Counter | order |
| `order_processing_latency_seconds` | Histogram | order |
| `active_orders_total` | Gauge | order |
| `notifications_sent_total{type}` | Counter | notification |
| `notifications_failed_total{type,reason}` | Counter | notification |
| `notification_latency_seconds{type}` | Histogram | notification |

### Logs

All services emit structured JSON logs to stdout:

```json
{
  "timestamp": "2026-06-02T12:00:00.000Z",
  "service": "order-service",
  "level": "info",
  "message": "order created successfully",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "correlationId": "abc123",
  "orderId": "ORD-A1B2C3D4"
}
```

Promtail collects these via the Docker socket and ships them to Loki. Use Grafana → Explore → Loki datasource to query:

```logql
# All errors across services
{service=~"auth-service|order-service|notification-service"} |= "\"level\":\"error\""

# Trace a request by correlation ID
{service="order-service"} |= "abc123"

# All orders for a specific user
{service="order-service"} |= "user-123"
```

### Grafana Dashboards

Four pre-provisioned dashboards are available at http://localhost:3030:

| Dashboard | UID | Purpose |
|-----------|-----|---------|
| Infrastructure | observastack-infra | CPU, Memory, Disk, Network, Load |
| Application | observastack-app | Request rate, Error rate, p95/p99 latency |
| Business | observastack-biz | Login success rate, Orders, Notifications |
| Incident | observastack-incident | Active alerts, Service availability, Error trends |

---

## Alerting

### Active Alert Rules

| Alert | Severity | Condition | Duration |
|-------|----------|-----------|----------|
| ServiceDown | critical | `up == 0` | 1m |
| ContainerRestart | warning | restarts > 3 in 15m | immediate |
| HighCPU | warning | CPU > 80% | 5m |
| HighMemory | warning | Memory > 85% | 5m |
| DiskSpaceLow | warning | Disk > 85% | 10m |
| HighLatency | warning | p95 > 1s | 5m |
| ErrorRateSpike | critical | Error rate > 5% | 2m |
| QueueBacklog | warning | active_orders > 50 | 10m |
| HighLoginFailureRate | warning | Login failure rate > 30% | 3m |
| NotificationDeliveryDegraded | warning | Notification failure rate > 20% | 5m |

### Discord Webhook Setup

1. Open your Discord server → **Server Settings → Integrations → Webhooks**
2. Click **New Webhook**, name it `ObservaStack`, select a channel
3. Copy the webhook URL
4. Update [monitoring/alertmanager/alertmanager.yml](monitoring/alertmanager/alertmanager.yml):
   ```yaml
   url: 'https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN'
   ```
5. Or set it in `.env`:
   ```
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
   ```
6. Reload Alertmanager: `docker compose exec alertmanager kill -HUP 1`

---

## Load Testing

Requires [k6](https://k6.io/docs/get-started/installation/) to be installed.

```bash
# Ramp login traffic up to 60 VUs
k6 run load-testing/k6/login-load.js

# Order lifecycle test — creates and fetches orders
k6 run load-testing/k6/order-load.js

# Spike test — instant burst to 100 VUs across all services (triggers alerts)
k6 run load-testing/k6/spike-test.js

# Override base URL (defaults to http://localhost:3000)
k6 run -e BASE_URL=http://localhost:3000 load-testing/k6/login-load.js
```

---

## Failure Simulation

These scripts trigger real alert conditions for incident response practice.

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Stop a service for 60s (triggers ServiceDown alert)
./scripts/simulate-service-down.sh order-service 60

# Spike CPU on the host for 120s (triggers HighCPU alert after 5m)
./scripts/simulate-high-cpu.sh 120 2

# Allocate 256MB in a container (triggers HighMemory alert after 5m)
./scripts/simulate-memory-pressure.sh order-service 256 120

# Send burst of bad requests (triggers ErrorRateSpike alert after 2m)
./scripts/simulate-error-spike.sh 10 180
```

After each simulation, verify:
1. **Prometheus** (`:9090/alerts`) — alert fires
2. **Grafana Incident Dashboard** — metrics spike visible
3. **Alertmanager** (`:9093`) — notification routed to Discord

---

## Running Tests

```bash
# Test all services
cd services/auth-service && npm ci && npm test
cd services/order-service && npm ci && npm test
cd services/notification-service && npm ci && npm test
cd gateway && npm ci && npm test
```

---

## Project Structure

```
observastack/
├── services/
│   ├── auth-service/          # JWT auth, bcrypt, login metrics
│   ├── order-service/         # Order CRUD, failure simulation
│   └── notification-service/  # Email/SMS simulation, delivery metrics
├── gateway/                   # HTTP proxy gateway with metrics
├── monitoring/
│   ├── prometheus/            # scrape config, alert rules, recording rules
│   ├── grafana/
│   │   ├── dashboards/        # 4 JSON dashboard definitions
│   │   └── provisioning/      # Auto-provisioned datasources & dashboards
│   ├── loki/                  # Log storage config (tsdb v13)
│   ├── promtail/              # Docker log collector config
│   └── alertmanager/          # Alert routing & Discord webhook
├── load-testing/k6/           # login, order, and spike test scenarios
├── scripts/                   # Failure simulation scripts
├── .github/workflows/         # CI (test + validate configs) + Docker publish
└── docker-compose.yml         # Full stack definition
```

---

## Troubleshooting

**Containers not starting**: Check `docker compose logs <service>` and verify `.env` is present.

**Grafana shows "No data"**: Wait 2–3 minutes for Prometheus to collect initial scrapes, then reload.

**Loki "too many outstanding requests"**: The tsdb compactor is running; wait 30s and retry.

**Alerts not firing in Discord**: Verify your webhook URL in `alertmanager.yml` and check `docker compose logs alertmanager`.

**Promtail not collecting logs**: Ensure `/var/lib/docker/containers` is accessible. On some systems the Docker data root is different — check `docker info | grep "Docker Root Dir"`.

**Port conflict on 3030**: Grafana uses host port 3030 by default. Change `GRAFANA_PORT` in `.env` if that port is already bound on your machine.

---

## CI/CD

GitHub Actions pipelines run on every push:

| Workflow | Triggers | Steps |
|----------|----------|-------|
| CI | push/PR to main, develop | Install → Test → Coverage upload |
| Lint | push/PR to main, develop | JSON validation, YAML lint |
| Docker Build | push to main, tags | Build check (no push); publish on tags |

Prometheus and Alertmanager configs are validated with `promtool` and `amtool` in CI.

---

## License

MIT — see [LICENSE](LICENSE).
