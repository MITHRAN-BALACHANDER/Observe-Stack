#!/usr/bin/env bash
# simulate-high-cpu.sh
# Runs a CPU stress workload inside node-exporter's host to trigger HighCPU alerts.
# Uses 'yes' pipe as a portable CPU burner (no stress/stress-ng required).
# Usage: ./scripts/simulate-high-cpu.sh [duration_seconds] [num_workers]

set -euo pipefail

DURATION="${1:-120}"
WORKERS="${2:-$(nproc 2>/dev/null || echo 2)}"

echo "================================================"
echo "  ObservaStack — Failure Simulation"
echo "  Simulating: HIGH CPU"
echo "  Workers:    ${WORKERS}"
echo "  Duration:   ${DURATION}s"
echo "================================================"
echo ""
echo "[$(date -u +%H:%M:%SZ)] Starting ${WORKERS} CPU stress worker(s)..."
echo "[$(date -u +%H:%M:%SZ)] HighCPU alert fires after 5m above 80%."
echo ""

PIDS=()
for ((i=1; i<=WORKERS; i++)); do
  (yes > /dev/null 2>&1) &
  PIDS+=($!)
  echo "[$(date -u +%H:%M:%SZ)] Worker ${i} started (PID $!)."
done

echo ""
echo "[$(date -u +%H:%M:%SZ)] CPU stress active. Sleeping ${DURATION}s..."
sleep "${DURATION}"

echo ""
echo "[$(date -u +%H:%M:%SZ)] Stopping stress workers..."
for PID in "${PIDS[@]}"; do
  kill "${PID}" 2>/dev/null || true
done

echo "[$(date -u +%H:%M:%SZ)] Done. CPU should normalise within 1 minute."
echo ""
echo "To monitor: http://localhost:9090/graph?g0.expr=100-(avg+by(instance)(rate(node_cpu_seconds_total{mode='idle'}[5m]))*100)"
