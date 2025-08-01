#!/bin/bash

# Docker Clean Script for Recruitment Portal
# Usage: ./docker-clean.sh

set -e

echo "Cleaning up Docker resources..."

# Stop all containers
echo "Stopping all containers..."
docker-compose down
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.prod.yml down

# Remove containers, networks, and volumes
echo "Removing containers, networks, and volumes..."
docker-compose down -v
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.prod.yml down -v

# Remove unused containers, networks, images, and volumes
echo "Removing unused Docker resources..."
docker system prune -a -f
docker volume prune -f

echo "Docker cleanup completed!"
echo "To start fresh, run: ./docker-start.sh" 