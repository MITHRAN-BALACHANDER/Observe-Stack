# Network Delay Incident Lab

## Scenario
Introduce network latency and observe impact.

## Steps

1. Establish baseline metrics
2. Use tc (traffic control) to add latency: 
   - `tc qdisc add dev eth0 root netem delay 100ms`
3. Monitor:
   - Request latency metrics
   - Error rates
   - Queue buildup
   - Alert behavior
4. Remove latency: `tc qdisc del dev eth0 root`

## Expected Observations

- Increased request duration
- Higher p95/p99 latencies
- Potential timeouts
- Queue size increase
- Circuit breaker activation

## Learning Points

- Latency impact analysis
- Timeout configuration
- Downstream effects
- Network resilience patterns
