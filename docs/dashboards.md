# Dashboards Guide

## Available Dashboards

### Infrastructure Dashboard
- Node CPU usage
- Memory utilization
- Disk I/O
- Network traffic
- Container metrics

### Application Dashboard
- Request rates by service
- Response times (p50, p95, p99)
- Error rates
- Service dependencies
- Throughput metrics

### Business Dashboard
- Order volume
- Transaction success rate
- Customer satisfaction metrics
- Revenue tracking
- Peak usage times

### Incident Overview
- Current alerts
- Service health status
- Anomaly detection
- Incident timeline

## Accessing Dashboards

1. Open Grafana: http://localhost:3000
2. Login with credentials from .env
3. Select dashboard from sidebar

## Customizing Dashboards

Dashboards are JSON-based and stored in `monitoring/grafana/dashboards/`. Edit JSON files and restart Grafana to apply changes.
