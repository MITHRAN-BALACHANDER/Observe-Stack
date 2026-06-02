#!/usr/bin/env bash
# simulate-service-down.sh
# Pauses a microservice container to trigger ServiceDown alerts in Alertmanager.
# Usage: ./scripts/simulate-service-down.sh [service] [duration_seconds]
# Example: ./scripts/simulate-service-down.sh order-service 60

set -euo pipefail

SERVICE="${1:-order-service}"
DURATION="${2:-60}"

VALID_SERVICES=("auth-service" "order-service" "notification-service" "gateway")

if [[ ! " ${VALID_SERVICES[*]} " =~ " ${SERVICE} " ]]; then
  echo "ERROR: Unknown service '${SERVICE}'"
  echo "Valid services: ${VALID_SERVICES[*]}"
  exit 1
fi

echo "================================================"
echo "  ObservaStack — Failure Simulation"
echo "  Simulating: SERVICE DOWN"
echo "  Target:     ${SERVICE}"
echo "  Duration:   ${DURATION}s"
echo "================================================"
echo ""
echo "[$(date -u +%H:%M:%SZ)] Pausing ${SERVICE}..."
docker compose pause "${SERVICE}"

echo "[$(date -u +%H:%M:%SZ)] ${SERVICE} is paused. Prometheus should detect 'up == 0' within 30s."
echo "[$(date -u +%H:%M:%SZ)] ServiceDown alert will fire after 1 minute."
echo "[$(date -u +%H:%M:%SZ)] Sleeping for ${DURATION}s..."

sleep "${DURATION}"

echo "[$(date -u +%H:%M:%SZ)] Resuming ${SERVICE}..."
docker compose unpause "${SERVICE}"

echo "[$(date -u +%H:%M:%SZ)] ${SERVICE} resumed. Alert should resolve within 5 minutes."
echo ""
echo "To monitor: http://localhost:9090/alerts"
echo "            http://localhost:9093 (Alertmanager)"
