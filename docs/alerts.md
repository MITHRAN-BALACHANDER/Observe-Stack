# Alerts Configuration

## Alert Rules

Alert rules are defined in `monitoring/prometheus/alert-rules.yml`.

### Common Alerts

1. **HighCPUUsage**: CPU usage > 80% for 5 minutes
2. **HighMemoryUsage**: Memory usage > 90% for 5 minutes
3. **HighErrorRate**: Error rate > 5% for 5 minutes
4. **ServiceDown**: Service unavailable for 1 minute
5. **HighLatency**: p95 latency > 1000ms for 5 minutes
6. **QueueBacklog**: Queue size > threshold

## AlertManager Configuration

AlertManager routes alerts based on labels:
- Severity levels: critical, warning, info
- Service names
- Alert type

### Notification Channels

Alerts can be routed to:
- Email
- Slack
- PagerDuty
- Webhook endpoints

## Managing Alerts

1. View active alerts: http://localhost:9093
2. Modify rules in `alert-rules.yml`
3. Reload configuration: `docker-compose restart prometheus`

## Alert Silencing

Temporarily suppress alerts via AlertManager UI or API.
