# Logging Architecture

## Log Collection

Logs are collected using Promtail and sent to Loki.

### Log Levels
- ERROR: Error events
- WARN: Warning events
- INFO: Informational events
- DEBUG: Debug events

### Structured Logging

All logs include:
- Timestamp
- Service name
- Request ID (correlation ID)
- Log level
- Message
- Context data

## Log Labels

Logs are indexed by:
- service: service name
- environment: prod, staging, dev
- level: error, warn, info, debug
- trace_id: request correlation ID

## Accessing Logs

1. Open Grafana: http://localhost:3000
2. Select Loki datasource
3. Use LogQL queries

### LogQL Examples
- All logs from auth-service: {service="auth-service"}
- Error logs: {level="error"}
- Specific trace: {trace_id="abc123"}

## Log Retention

Logs are retained based on volume and Loki configuration.

## Distributed Tracing

Request flow tracking:
1. Correlation ID generated at gateway
2. Propagated through service headers
3. Included in all logs
4. Enables end-to-end tracing

## Privacy & Security

- No sensitive data in logs (passwords, tokens)
- Log access controlled by authentication
- Sensitive fields are redacted
