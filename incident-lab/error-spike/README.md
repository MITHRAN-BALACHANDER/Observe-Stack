# Error Spike Incident Lab

## Scenario
Generate sudden spike in error rate.

## Steps

1. Establish baseline with normal traffic
2. Introduce errors (modify service code or use traffic control)
3. Monitor:
   - Error rate spike
   - Error count metrics
   - Alert triggering
   - Service behavior
4. Fix the issue
5. Monitor recovery

## Expected Observations

- Rapid error rate increase
- Error type distribution in logs
- Alert state changes
- Possible cascading failures
- Recovery metrics

## Learning Points

- Error rate sensitivity
- Error classification
- Downstream impact
- Alert fatigue prevention
- Root cause analysis
