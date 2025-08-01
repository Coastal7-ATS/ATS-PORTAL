#!/bin/bash

# Docker Stop Script for Recruitment Portal
# Usage: ./docker-stop.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "Stopping Recruitment Portal in $ENVIRONMENT mode..."

case $ENVIRONMENT in
    "dev")
        echo "Stopping development environment..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    "prod")
        echo "Stopping production environment..."
        docker-compose -f docker-compose.prod.yml down
        ;;
    *)
        echo "Stopping default environment..."
        docker-compose down
        ;;
esac

echo "Recruitment Portal has been stopped!" 