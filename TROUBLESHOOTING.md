# Troubleshooting

## Before anything else

Check container health state. A service that fails its health check is almost always the source of a cascade.

```bash
docker compose ps
docker compose logs --tail=50 <service-name>
```

---

## Containers

### Service stuck in "starting" or exits immediately

```bash
docker compose logs --tail=100 <service-name>
```

Common causes:

- **auth-service or order-service exits**: Redis is not yet healthy. The service depends on `redis: condition: service_healthy`. Redis typically starts in under 5 seconds — wait and re-check.
- **promtail exits**: Loki is not yet ready. Same pattern — promtail depends on `loki: condition: service_healthy`. Loki can take 20–30 seconds on first start.
- **Gateway not found**: The gateway uses the `gateway` Docker Compose profile and is excluded from the default stack by design. See [SETUP.md](SETUP.md).

### Containers rebuild on every `docker compose up`

This happens when image layers are invalidated. If you changed `package.json` or `Dockerfile`, the rebuild is expected. To force a rebuild explicitly:

```bash
docker compose build --no-cache <service-name>
docker compose up -d
```

---

## Prometheus

### "No data" or gaps in Grafana panels

Prometheus scrapes every 15 seconds. After first start, wait at least 30 seconds before expecting data.

Verify Prometheus is reaching each service:

1. Open <http://localhost:9090/targets>
2. All targets under `gateway`, `auth-service`, `order-service`, `notification-service`, and `node-exporter` should show `UP`.
3. If a target shows `DOWN`, check the service is running and its `/health` endpoint responds:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

To reload Prometheus config without restart (requires `--web.enable-lifecycle`, which is already set):

```bash
curl -X POST http://localhost:9090/-/reload
```

### Alert rules not evaluating

Check that the rule files load without errors:

```bash
docker compose exec prometheus promtool check rules /etc/prometheus/alert-rules.yml
docker compose exec prometheus promtool check rules /etc/prometheus/recording-rules.yml
```

---

## Grafana

### Dashboards show "No data"

1. Wait 2–3 minutes after stack start for Prometheus to accumulate scrapes.
2. Confirm the Prometheus datasource is reachable: **Grafana → Connections → Data Sources → Prometheus → Test**.
3. Confirm the time range in the top-right is not set to a window before the stack started.

### Can't log in to Grafana

Default credentials are `admin` / `observastack`. If you changed `GRAFANA_ADMIN_PASSWORD` in `.env` after initial start, Grafana will not pick up the change because the password is stored in the persisted volume. Either:

- Delete the volume and restart: `docker compose down -v && docker compose up -d`
- Or reset via the Grafana CLI: `docker compose exec grafana grafana-cli admin reset-admin-password <newpass>`

---

## Loki and logs

### Loki logs not appearing in Grafana Explore

Check Promtail is running and connected:

```bash
docker compose logs promtail
```

Promtail reads the Docker socket and discovers containers automatically. If you see connection refused errors pointing at Loki, Loki is still starting — Promtail will retry.

Verify Loki is ready:

```bash
curl http://localhost:3100/ready
```

Should return `ready`.

### "Too many outstanding requests" from Loki

The tsdb compactor runs periodically. This resolves on its own within 30 seconds. If it persists, restart Loki:

```bash
docker compose restart loki
```

---

## Alertmanager

### Alerts fire in Prometheus but no Discord notification

1. Verify the webhook URL is set:

   ```bash
   docker compose exec alertmanager cat /etc/alertmanager/alertmanager.yml | grep discord
   ```

   If it shows the placeholder `YOUR_WEBHOOK_ID`, update `DISCORD_WEBHOOK_URL` in `.env` and restart:

   ```bash
   docker compose restart alertmanager
   ```

2. Check Alertmanager received the alert: <http://localhost:9093>

3. Check Alertmanager logs for delivery errors:

   ```bash
   docker compose logs alertmanager
   ```

---

## Port conflicts

| Default port | Service | How to change |
|-------------|---------|---------------|
| 3000 | API Gateway | `GATEWAY_PORT` in `.env` |
| 3001 | auth-service | `AUTH_SERVICE_PORT` in `.env` |
| 3002 | order-service | `ORDER_SERVICE_PORT` in `.env` |
| 3003 | notification-service | `NOTIFICATION_SERVICE_PORT` in `.env` |
| 3030 | Grafana | `GRAFANA_PORT` in `.env` |
| 9090 | Prometheus | `PROMETHEUS_PORT` in `.env` |
| 9093 | Alertmanager | `ALERTMANAGER_PORT` in `.env` |
| 3100 | Loki | `LOKI_PORT` in `.env` |
| 9100 | Node Exporter | `NODE_EXPORTER_PORT` in `.env` |
| 6379 | Redis | `REDIS_PORT` in `.env` |

Find what is bound on a port:

```bash
# Linux / macOS
lsof -i :<port>

# Windows
netstat -ano | findstr :<port>
```

---

## Tests

### Gateway Jest tests fail with "SyntaxError: Cannot use import statement"

uuid v9 ships an ESM-only `dist-node` package. Jest (CommonJS mode) cannot parse it without a transform config. This is a known issue. The three service tests (`auth-service`, `order-service`, `notification-service`) run correctly. Fix the gateway tests by adding to `gateway/package.json`:

```json
"jest": {
  "transformIgnorePatterns": [
    "/node_modules/(?!uuid)"
  ]
}
```

### auth-service tests fail to hash passwords

bcrypt requires native bindings compiled with `python3`, `make`, and `g++`. The Docker image includes these (`apk add python3 make g++`), but a local `npm ci` on a machine without them will fail. Install the build tools for your OS or run tests inside the container:

```bash
docker compose exec auth-service npm test
```

---

## Debug logging

Set `LOG_LEVEL=debug` in `.env` and restart the affected service. Structured JSON logs appear in `docker compose logs`.

```bash
LOG_LEVEL=debug docker compose up -d auth-service
docker compose logs -f auth-service
```
