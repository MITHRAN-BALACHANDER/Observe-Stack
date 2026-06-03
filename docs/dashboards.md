# Dashboards

Four dashboards are provisioned automatically from the JSON files in [monitoring/grafana/dashboards/](../monitoring/grafana/dashboards/). No manual import is required. They are available immediately after the stack starts at <http://localhost:3030>.

Login: `admin` / `observastack` (or whatever you set in `GRAFANA_ADMIN_PASSWORD`).

---

## Infrastructure Dashboard

**UID:** `observastack-infra` | **File:** `infrastructure.json`

Panels pulled from Node Exporter (`job="node-exporter"`):

- CPU utilization — uses the `instance:node_cpu_utilization:rate5m` recording rule
- Memory utilization — `instance:node_memory_utilization:ratio`
- Disk utilization by mount point — `instance:node_disk_utilization:ratio`
- Network receive and transmit rates — `instance:node_network_receive:rate5m` / `instance:node_network_transmit:rate5m`
- System load average (1m, 5m, 15m)
- Container count and restart count

Use this dashboard to correlate a latency or error alert with host-level resource pressure. If CPU spikes and you see `HighCPU` fire in the Incident dashboard, this is where you dig into which process caused it.

![Infrastructure dashboard](images/dashboard-infrastructure.png)

---

## Application Dashboard

**UID:** `observastack-app` | **File:** `application.json`

Panels pulled from the gateway and backend services:

- Request rate per service — `job:http_requests:rate5m`
- HTTP error rate per service — `job:http_errors:rate5m`
- Error ratio per service — `job:http_error_ratio:rate5m`
- p50 / p95 / p99 latency — `job:http_latency_p50:rate5m`, `job:http_latency_p95:rate5m`, `job:http_latency_p99:rate5m`
- Per-service histograms: `auth_latency_seconds`, `order_processing_latency_seconds`, `notification_latency_seconds`

These recording rules are computed from the raw histograms and counters every 15 seconds. If p95 latency climbs above 1 second, the `HighLatency` alert will fire after 5 minutes.

![Application dashboard](images/dashboard-application.png)

---

## Business Dashboard

**UID:** `observastack-biz` | **File:** `business.json`

Panels showing the application's business-level KPIs:

- Login success rate — `observastack:login_success_rate:rate5m`
- Order success rate — `observastack:order_success_rate:rate5m`
- Notification delivery success rate — `observastack:notification_success_rate:rate5m`
- Order processing p95 latency — `observastack:order_processing_p95:rate5m`
- Cumulative counters: `orders_created_total`, `notifications_sent_total{type="email"}`, `notifications_sent_total{type="sms"}`

Under normal load with default failure rates (5% orders, 8% notifications), these panels show a steady baseline. When a `simulate-error-spike.sh` run is active, the success rates drop visibly within 30 seconds.

![Business dashboard](images/dashboard-business.png)

---

## Incident Dashboard

**UID:** `observastack-incident` | **File:** `incident-overview.json`

Designed to be the first dashboard opened when an alert fires:

- Active alert count (from Alertmanager API)
- Service availability — `up` gauge per job
- Error rate trend (all services overlaid)
- Latency trend (all services overlaid)
- Restart count over time
- Order failure rate trend

The time range defaults to the last 30 minutes. Narrow it to 5 minutes when triaging an active incident to reduce noise.

![Incident dashboard](images/dashboard-incident.png)

---

## Customising dashboards

Dashboards are read-only from the provisioning directory by default. To edit a dashboard:

1. Edit the JSON file in `monitoring/grafana/dashboards/`.
2. Grafana polls the provisioning directory every 10 seconds and picks up changes automatically. No restart needed.

Alternatively, edit in the Grafana UI and export the updated JSON: **Dashboard → Share → Export → Save to file**, then replace the file in `monitoring/grafana/dashboards/`.

Setting `allowUiUpdates: true` in `monitoring/grafana/provisioning/dashboards/dashboard.yml` (already set) means UI edits persist until the next provisioning poll overwrites them — export before restarting if you want to keep changes.

---

## Adding a new dashboard

1. Build the dashboard in the Grafana UI.
2. Export it: **Share → Export → Save to file**.
3. Move the exported file to `monitoring/grafana/dashboards/`.
4. Grafana picks it up within 10 seconds.

The dashboard UID must be unique. Use the pattern `observastack-<name>` to stay consistent with the existing set.
