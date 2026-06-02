#!/usr/bin/env bash
# simulate-memory-pressure.sh
# Allocates memory inside a running container to trigger HighMemory alerts.
# Uses Python's bytearray to allocate without needing stress tools in the container.
# Usage: ./scripts/simulate-memory-pressure.sh [service] [mb] [duration_seconds]

set -euo pipefail

SERVICE="${1:-order-service}"
MEMORY_MB="${2:-256}"
DURATION="${3:-120}"

echo "================================================"
echo "  ObservaStack — Failure Simulation"
echo "  Simulating: MEMORY PRESSURE"
echo "  Target:     ${SERVICE}"
echo "  Allocation: ${MEMORY_MB}MB"
echo "  Duration:   ${DURATION}s"
echo "================================================"
echo ""
echo "[$(date -u +%H:%M:%SZ)] Allocating ${MEMORY_MB}MB inside ${SERVICE} container..."

docker compose exec -d "${SERVICE}" sh -c \
  "python3 -c \"import time; x=bytearray(${MEMORY_MB}*1024*1024); print('allocated'); time.sleep(${DURATION})\" 2>/dev/null || \
   node -e \"const b=Buffer.alloc(${MEMORY_MB}*1024*1024); setTimeout(()=>{}, ${DURATION}000)\" 2>/dev/null || \
   (dd if=/dev/zero of=/dev/null bs=1M count=${MEMORY_MB} & sleep ${DURATION})"

echo "[$(date -u +%H:%M:%SZ)] Memory pressure applied for ${DURATION}s."
echo "[$(date -u +%H:%M:%SZ)] HighMemory alert fires after 5m above 85%."
echo ""
echo "To monitor: http://localhost:9090/graph?g0.expr=(1-(node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes))*100"
