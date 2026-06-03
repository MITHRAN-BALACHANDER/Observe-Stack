# Setup

## Prerequisites

| Tool | Minimum Version | Notes |
|------|----------------|-------|
| Docker | 24+ | |
| Docker Compose | v2 (plugin) | `docker compose`, not `docker-compose` |
| Git | any | |
| Node.js | 18+ | Only needed for local gateway dev |
| k6 | 0.46+ | Only needed for load testing |

## First-time Setup

```bash
git clone https://github.com/MITHRAN-BALACHANDER/Observe-Stack observastack
cd observastack

cp .env.example .env
```

Review `.env` before starting. The defaults work out of the box. The one value you should change before exposing to any network is `JWT_SECRET`.

```bash
docker compose up -d
```

All containers include health checks. Wait about 30 seconds, then verify:

```bash
docker compose ps
```

Every service should show `healthy`. If a service shows `starting`, wait another 15 seconds and check again.

## Service Endpoints

| Service | URL | Credentials |
|---------|-----|-------------|
| API Gateway | http://localhost:3000 | — |
| Grafana | http://localhost:3030 | admin / observastack |
| Prometheus | http://localhost:9090 | — |
| Alertmanager | http://localhost:9093 | — |
| Loki | http://localhost:3100 | — |
| Node Exporter metrics | http://localhost:9100/metrics | — |

The gateway has a `gateway` Docker Compose profile assigned. It is excluded from the default `docker compose up` because in development you run it directly on the host so you get live reload. See the [Local Development](#local-development) section.

To include the gateway in Docker as well:

```bash
docker compose --profile gateway up -d
```

## Local Development

Run the gateway outside Docker against the containerized services:

```bash
docker compose up -d   # start everything except gateway

cd gateway
npm ci

# Point to the containerized services
export AUTH_SERVICE_URL=http://localhost:3001
export ORDER_SERVICE_URL=http://localhost:3002
export NOTIFICATION_SERVICE_URL=http://localhost:3003

npm run dev            # starts with nodemon on port 3000
```

Each backend service also supports `npm run dev` if you want to run one outside Docker. Set the corresponding `*_SERVICE_URL` in the gateway env if you do.

## Environment Variables

All configurable values live in `.env`. Key ones:

| Variable | Default | Description |
|----------|---------|-------------|
| `GRAFANA_PORT` | 3030 | Host port for Grafana |
| `JWT_SECRET` | *(change me)* | Signing key for all JWTs |
| `JWT_EXPIRES_IN` | 1h | Token lifetime |
| `ORDER_FAILURE_RATE` | 0.05 | Fraction of orders that fail (0–1) |
| `NOTIFICATION_FAILURE_RATE` | 0.08 | Fraction of notifications that fail (0–1) |
| `PROMETHEUS_RETENTION` | 30d | How long Prometheus keeps data |
| `LOG_LEVEL` | info | One of: debug, info, warn, error |
| `DISCORD_WEBHOOK_URL` | placeholder | Webhook URL for alert notifications |

## Alertmanager Discord Integration

Without a real webhook, alerts still fire in Prometheus and Alertmanager — they just cannot be delivered to Discord. To enable delivery:

1. In your Discord server: **Server Settings → Integrations → Webhooks → New Webhook**
2. Name it, pick a channel, copy the URL
3. Set it in `.env`:

   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/<id>/<token>
   ```

4. Restart Alertmanager to pick up the new env value:

   ```bash
   docker compose restart alertmanager
   ```

## Running Tests

```bash
cd services/auth-service    && npm ci && npm test
cd services/order-service   && npm ci && npm test
cd services/notification-service && npm ci && npm test
```

Gateway tests currently require a `transformIgnorePatterns` workaround for uuid v9's ESM-only dist. The service tests run without issue.

## Stopping the Stack

```bash
docker compose down           # stop and remove containers, keep volumes
docker compose down -v        # also delete all persistent data volumes
```
