#!/bin/bash

# PPBE Management System - Docker Quick Start Script
# This script helps you quickly start the application with Docker

set -e

echo "=================================="
echo "PPBE Management System"
echo "Docker Quick Start"
echo "=================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo "❌ Error: Docker Compose is not available"
    echo "Please install Docker Compose v2: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ Docker is installed"
echo "✓ Docker Compose is available"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ .env file created"
        echo "⚠️  Please edit .env and set secure passwords before production use!"
    else
        echo "❌ Error: .env.example not found"
        exit 1
    fi
else
    echo "✓ .env file exists"
fi

echo ""
echo "Starting services..."
echo ""

# Parse command line arguments
MODE="production"
DETACHED=""
REBUILD=""
MONITORING=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--dev|--development)
            MODE="development"
            shift
            ;;
        -b|--build)
            REBUILD="--build"
            shift
            ;;
        --detach)
            DETACHED="-d"
            shift
            ;;
        -m|--monitoring)
            MONITORING="--profile monitoring"
            shift
            ;;
        -h|--help)
            echo "Usage: ./docker-start.sh [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  -d, --dev, --development    Start in development mode with hot reload"
            echo "  -b, --build                 Rebuild images before starting"
            echo "  --detach                    Run in background (detached mode)"
            echo "  -m, --monitoring            Start with Prometheus and Grafana monitoring"
            echo "  -h, --help                  Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./docker-start.sh                    # Start in production mode"
            echo "  ./docker-start.sh -d                 # Start in development mode"
            echo "  ./docker-start.sh -d --detach        # Start in dev mode, background"
            echo "  ./docker-start.sh -b                 # Rebuild and start"
            echo "  ./docker-start.sh -m                 # Start with monitoring"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Build command based on mode
if [ "$MODE" = "development" ]; then
    echo "🔧 Starting in DEVELOPMENT mode (hot reload enabled)..."
    COMPOSE_CMD="docker compose $MONITORING -f docker-compose.yml -f docker-compose.dev.yml up $DETACHED $REBUILD"
else
    echo "🚀 Starting in PRODUCTION mode..."
    COMPOSE_CMD="docker compose $MONITORING up $DETACHED $REBUILD"
fi

echo "Command: $COMPOSE_CMD"
echo ""

# Execute docker compose
eval $COMPOSE_CMD

# Show success message if running in detached mode
if [ ! -z "$DETACHED" ]; then
    echo ""
    echo "=================================="
    echo "✅ Services started successfully!"
    echo "=================================="
    echo ""
    echo "Access the application at:"
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:5000"
    echo "  Health:    http://localhost:5000/api/health"
    echo ""
    if [ ! -z "$MONITORING" ]; then
        echo "Monitoring:"
        echo "  Prometheus: http://localhost:9090"
        echo "  Grafana:    http://localhost:3001"
        echo ""
    fi
    echo "Default login:"
    echo "  Username: admin"
    echo "  Password: admin123"
    echo ""
    echo "To view logs:"
    echo "  docker compose logs -f"
    echo ""
    echo "To stop services:"
    echo "  docker compose down"
    echo ""
fi
