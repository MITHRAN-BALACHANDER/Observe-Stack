#!/bin/bash
# Generate load on services for testing

set -e

echo "Starting load generation..."

# Duration in seconds
DURATION=${1:-300}
RPS=${2:-100}  # Requests per second

# Generate login load
echo "Generating login load..."
k6 run --vus 50 --duration "${DURATION}s" load-testing/k6/login-load.js

# Generate order load
echo "Generating order load..."
k6 run --vus 30 --duration "${DURATION}s" load-testing/k6/order-load.js

# Generate spike test
echo "Running spike test..."
k6 run load-testing/k6/spike-test.js

echo "Load generation complete!"
