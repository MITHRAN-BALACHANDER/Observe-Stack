#!/bin/bash
# CPU stress test for incident lab

set -e

SERVICE=${1:-order-service}
DURATION=${2:-60}

echo "Starting CPU stress on $SERVICE..."

docker-compose exec -T "$SERVICE" sh -c "
for i in \$(seq 1 10); do
  yes > /dev/null &
done
PID_LIST=\$(jobs -p)
sleep $DURATION
kill \$PID_LIST 2>/dev/null || true
" &

echo "CPU stress running for $DURATION seconds"
wait

echo "CPU stress complete!"
