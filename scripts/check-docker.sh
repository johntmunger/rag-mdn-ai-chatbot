#!/bin/bash

# Check if Docker is installed and running

echo "🔍 Checking Docker status..."
echo ""

# Check if docker command exists
if ! command -v docker &> /dev/null; then
    echo "❌ Docker command not found in PATH"
    echo ""
    echo "Docker Desktop may not be running. Please:"
    echo "1. Open Docker Desktop manually from Applications"
    echo "2. Wait for Docker to fully start (icon in menu bar)"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Docker command found: $(which docker)"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running"
    echo ""
    echo "Please start Docker Desktop:"
    echo "1. Open Applications folder"
    echo "2. Double-click Docker.app"
    echo "3. Wait for the Docker icon to appear in your menu bar"
    echo "4. Run this script again"
    exit 1
fi

echo "✅ Docker daemon is running"

# Check Docker version
DOCKER_VERSION=$(docker --version)
echo "✅ Version: $DOCKER_VERSION"

# Check Docker Compose
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo "✅ Docker Compose: $COMPOSE_VERSION"
else
    echo "✅ Docker Compose: Built-in to Docker (compose plugin)"
fi

echo ""
echo "🎉 Docker is ready to use!"
echo ""
echo "Next steps:"
echo "  npm run db:up       # Start PostgreSQL database"
echo "  npm run db:status   # Check database status"
