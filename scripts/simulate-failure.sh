#!/bin/bash
# Simulate service failures for incident response testing

set -e

echo "Simulating service failure..."

SERVICE=${1:-order-service}
DURATION=${2:-60}

case $SERVICE in
  "auth-service")
    echo "Stopping auth-service for $DURATION seconds..."
    docker-compose pause auth-service
    sleep "$DURATION"
    docker-compose unpause auth-service
    echo "auth-service restarted"
    ;;
  "order-service")
    echo "Stopping order-service for $DURATION seconds..."
    docker-compose pause order-service
    sleep "$DURATION"
    docker-compose unpause order-service
    echo "order-service restarted"
    ;;
  "notification-service")
    echo "Stopping notification-service for $DURATION seconds..."
    docker-compose pause notification-service
    sleep "$DURATION"
    docker-compose unpause notification-service
    echo "notification-service restarted"
    ;;
  *)
    echo "Unknown service: $SERVICE"
    exit 1
    ;;
esac

echo "Simulation complete!"
