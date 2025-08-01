#!/bin/bash

# Docker Start Script for Recruitment Portal
# Usage: ./docker-start.sh [dev|prod]

set -e

ENVIRONMENT=${1:-dev}

echo "Starting Recruitment Portal in $ENVIRONMENT mode..."

case $ENVIRONMENT in
    "dev")
        echo "Starting development environment..."
        docker-compose -f docker-compose.dev.yml up --build
        ;;
    "prod")
        echo "Starting production environment..."
        docker-compose -f docker-compose.prod.yml up --build -d
        ;;
    *)
        echo "Starting default environment..."
        docker-compose up --build
        ;;
esac

echo "Recruitment Portal is starting up!"
echo "Access the application at:"
echo "- Frontend: http://localhost"
echo "- Backend API: http://51.21.168.125:8000"
echo "- MongoDB: localhost:27017" 