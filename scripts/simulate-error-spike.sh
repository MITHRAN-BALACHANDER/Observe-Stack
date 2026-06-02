#!/usr/bin/env bash
# simulate-error-spike.sh
# Fires a burst of malformed requests at each service to push error rate above 5%
# and trigger the ErrorRateSpike alert in Alertmanager.
# Requires: curl
# Usage: ./scripts/simulate-error-spike.sh [requests_per_second] [duration_seconds]

set -euo pipefail

RPS="${1:-10}"
DURATION="${2:-180}"

BASE_URL="http://localhost:3000"
TOTAL=$((RPS * DURATION))

echo "================================================"
echo "  ObservaStack — Failure Simulation"
echo "  Simulating: ERROR RATE SPIKE"
echo "  Rate:       ${RPS} req/s"
echo "  Duration:   ${DURATION}s"
echo "  Total:      ~${TOTAL} requests"
echo "================================================"
echo ""
echo "[$(date -u +%H:%M:%SZ)] Starting error spike (ErrorRateSpike fires after 2m above 5%)..."
echo ""

END_TIME=$(( $(date +%s) + DURATION ))
COUNT=0

while [[ $(date +%s) -lt ${END_TIME} ]]; do
  # Intentionally malformed requests that will return 4xx/5xx

  # Missing required fields -> 400
  curl -s -o /dev/null -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{}' &

  # Wrong content type -> triggers error handling
  curl -s -o /dev/null -X POST "${BASE_URL}/orders/create-order" \
    -H "Content-Type: text/plain" \
    -d 'not-json' &

  # Missing fields -> 400
  curl -s -o /dev/null -X POST "${BASE_URL}/notifications/send-email" \
    -H "Content-Type: application/json" \
    -d '{"to":""}' &

  # Non-existent order
  curl -s -o /dev/null "${BASE_URL}/orders/orders/ORD-DOESNOTEXIST" &

  COUNT=$((COUNT + 4))

  # Throttle to stay near target RPS
  sleep "$(echo "scale=4; 4 / ${RPS}" | bc 2>/dev/null || echo 0.4)"
done

wait

echo ""
echo "[$(date -u +%H:%M:%SZ)] Error spike complete. Sent ~${COUNT} requests."
echo "[$(date -u +%H:%M:%SZ)] Alerts should resolve within 5-10 minutes."
echo ""
echo "To monitor: http://localhost:9090/alerts"
echo "  PromQL:   sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))"
