#!/bin/bash
# Memory stress test for incident lab

set -e

SERVICE=${1:-order-service}
ALLOCATION=${2:-512}  # MB

echo "Starting memory stress on $SERVICE ($ALLOCATION MB)..."

docker-compose exec -T "$SERVICE" sh -c "
stress-ng --vm 1 --vm-bytes ${ALLOCATION}m --timeout ${3:-60}s
" &

echo "Memory stress running..."
wait

echo "Memory stress complete!"
