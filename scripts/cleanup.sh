#!/bin/bash
# Cleanup script for demo/testing

set -e

echo "Cleaning up observability platform..."

# Stop containers
echo "Stopping containers..."
docker-compose down

# Remove data volumes (optional)
read -p "Remove data volumes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Removing volumes..."
  docker volume prune -f
  rm -rf data/*/
fi

# Remove logs
echo "Removing logs..."
rm -rf logs/
find . -name "*.log" -delete

echo "Cleanup complete!"
