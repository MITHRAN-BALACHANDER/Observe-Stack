# Memory Leak Incident Lab

## Scenario
Simulate and detect memory leak behavior.

## Steps

1. Monitor memory baseline
2. Apply memory stress: `./scripts/memory-stress.sh order-service 512 300`
3. Observe memory usage over time
4. Monitor:
   - Memory gauge increasing
   - Alert thresholds
   - System response
5. Check recovery after stress ends

## Expected Observations

- Memory usage metric increases
- Alert triggers if threshold exceeded
- Container restart if OOM
- Log messages about memory pressure
- Service degradation possible

## Learning Points

- Memory leak detection
- OOM killer behavior
- Container resource limits
- Memory alerting thresholds
