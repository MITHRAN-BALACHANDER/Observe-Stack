# High CPU Incident Lab

## Scenario
Test system behavior under CPU stress and monitoring accuracy.

## Steps

1. Start load generation: `./scripts/generate-load.sh`
2. Monitor CPU metrics in Grafana
3. Apply CPU stress: `./scripts/cpu-stress.sh order-service 120`
4. Observe:
   - CPU usage spike
   - Response time increase
   - Memory impact
   - Alert triggering
5. Monitor system stabilization

## Expected Observations

- CPU gauge metric increases
- Request latency degradation
- High CPU alert triggered
- Possible throttling behavior
- Queue buildup

## Learning Points

- Metric accuracy under stress
- Alert sensitivity tuning
- Auto-scaling effectiveness
- Resource constraint handling
