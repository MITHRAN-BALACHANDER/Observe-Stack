# Service Down Incident Lab

## Scenario
Test incident response when a critical service goes down.

## Steps

1. Start all services normally
2. Monitor dashboards to establish baseline
3. Stop the order-service: `docker-compose stop order-service`
4. Observe:
   - AlertManager alerts
   - Grafana dashboards show service as down
   - Error rate spike
   - Failed requests
5. Restart the service: `docker-compose start order-service`
6. Monitor recovery metrics

## Expected Observations

- Service health check fails
- Request error rate goes to 100%
- Dependent services may fail or degrade
- Recovery time measured
- Alerting effectiveness verified

## Learning Points

- Service discovery behavior
- Graceful degradation
- Circuit breaker patterns
- Recovery procedures
