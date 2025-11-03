#!/bin/bash

# PPBE Management System - Docker Configuration Validator
# This script validates that Docker setup is correctly configured

set -e

echo "=================================="
echo "Docker Configuration Validator"
echo "=================================="
echo ""

ERRORS=0
WARNINGS=0

# Function to report error
error() {
    echo "❌ ERROR: $1"
    ERRORS=$((ERRORS + 1))
}

# Function to report warning
warning() {
    echo "⚠️  WARNING: $1"
    WARNINGS=$((WARNINGS + 1))
}

# Function to report success
success() {
    echo "✓ $1"
}

# Check Docker installation
echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    success "Docker installed: $DOCKER_VERSION"
else
    error "Docker is not installed"
fi

# Check Docker Compose
if docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    success "Docker Compose available: $COMPOSE_VERSION"
else
    error "Docker Compose v2 is not available"
fi

echo ""

# Check for required files
echo "Checking required files..."
FILES=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    ".env.example"
    "backend/Dockerfile"
    "frontend/Dockerfile"
    "backend/package.json"
    "frontend/package.json"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        success "$file exists"
    else
        error "$file is missing"
    fi
done

echo ""

# Check .env file
echo "Checking environment configuration..."
if [ -f ".env" ]; then
    success ".env file exists"
    
    # Check for critical variables
    if grep -q "JWT_SECRET=" .env; then
        JWT_SECRET=$(grep "JWT_SECRET=" .env | cut -d'=' -f2)
        if [ ${#JWT_SECRET} -lt 32 ]; then
            warning "JWT_SECRET is too short (should be at least 32 characters)"
        else
            success "JWT_SECRET is configured"
        fi
    else
        warning "JWT_SECRET is not set in .env"
    fi
    
    if grep -q "POSTGRES_PASSWORD=" .env; then
        success "POSTGRES_PASSWORD is configured"
    else
        warning "POSTGRES_PASSWORD is not set in .env"
    fi
    
    if grep -q "REDIS_PASSWORD=" .env; then
        success "REDIS_PASSWORD is configured"
    else
        warning "REDIS_PASSWORD is not set in .env"
    fi
else
    warning ".env file not found (will be created from .env.example)"
fi

echo ""

# Validate docker-compose.yml syntax
echo "Validating docker-compose.yml..."
if docker compose -f docker-compose.yml config > /dev/null 2>&1; then
    success "docker-compose.yml syntax is valid"
else
    error "docker-compose.yml has syntax errors"
fi

# Validate docker-compose.dev.yml syntax
if docker compose -f docker-compose.yml -f docker-compose.dev.yml config > /dev/null 2>&1; then
    success "docker-compose.dev.yml syntax is valid"
else
    error "docker-compose.dev.yml has syntax errors"
fi

echo ""

# Check Dockerfiles
echo "Checking Dockerfiles..."

if [ -f "backend/Dockerfile" ]; then
    # Check basic Dockerfile syntax
    if docker build -f backend/Dockerfile --help > /dev/null 2>&1; then
        success "Backend Dockerfile exists"
    fi
fi

if [ -f "frontend/Dockerfile" ]; then
    # Check basic Dockerfile syntax
    if docker build -f frontend/Dockerfile --help > /dev/null 2>&1; then
        success "Frontend Dockerfile exists"
    fi
fi

echo ""

# Check for migrations
echo "Checking database migrations..."
if [ -f "backend/migrations/init.sql" ]; then
    success "Database migrations found"
else
    warning "Database migrations not found at backend/migrations/init.sql"
fi

echo ""

# Check nginx config
if [ -f "frontend/nginx.conf" ]; then
    success "Frontend nginx config exists"
else
    warning "Frontend nginx.conf not found"
fi

echo ""

# Check .dockerignore files
echo "Checking .dockerignore files..."
if [ -f "backend/.dockerignore" ]; then
    success "Backend .dockerignore exists"
else
    warning "Backend .dockerignore not found (may include unnecessary files in build)"
fi

if [ -f "frontend/.dockerignore" ]; then
    success "Frontend .dockerignore exists"
else
    warning "Frontend .dockerignore not found (may include unnecessary files in build)"
fi

echo ""

# Summary
echo "=================================="
echo "Validation Summary"
echo "=================================="
echo "Errors: $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "✅ All checks passed! Your Docker setup is ready."
    echo ""
    echo "Next steps:"
    echo "  1. Review .env file and set secure passwords"
    echo "  2. Run: ./docker-start.sh"
    echo "  3. Access: http://localhost:3000"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  Setup is valid but has warnings. Review them before proceeding."
    exit 0
else
    echo "❌ Setup has errors. Please fix them before running docker compose."
    exit 1
fi
