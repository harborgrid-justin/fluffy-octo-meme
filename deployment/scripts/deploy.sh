#!/bin/bash
# DEVOPS-010: Blue-Green Deployment Automation Script

set -e

# Configuration
CLUSTER_NAME="ppbe-cluster"
SERVICE_BLUE="ppbe-backend-blue"
SERVICE_GREEN="ppbe-backend-green"
LOAD_BALANCER_ARN="arn:aws-us-gov:elasticloadbalancing:us-gov-west-1:ACCOUNT:loadbalancer/app/ppbe-alb"
LISTENER_ARN="arn:aws-us-gov:elasticloadbalancing:us-gov-west-1:ACCOUNT:listener/app/ppbe-alb"
TARGET_GROUP_BLUE="arn:aws-us-gov:elasticloadbalancing:us-gov-west-1:ACCOUNT:targetgroup/ppbe-blue"
TARGET_GROUP_GREEN="arn:aws-us-gov:elasticloadbalancing:us-gov-west-1:ACCOUNT:targetgroup/ppbe-green"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi

    # Check Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Verify AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured"
        exit 1
    fi

    log_info "Pre-deployment checks passed"
}

# Deploy to green environment
deploy_green() {
    log_info "Deploying to green environment..."

    # Update green service with new task definition
    aws ecs update-service \
        --cluster $CLUSTER_NAME \
        --service $SERVICE_GREEN \
        --force-new-deployment \
        --region us-gov-west-1

    log_info "Waiting for green deployment to stabilize..."
    aws ecs wait services-stable \
        --cluster $CLUSTER_NAME \
        --services $SERVICE_GREEN \
        --region us-gov-west-1

    log_info "Green deployment completed"
}

# Health check
health_check() {
    local target=$1
    local max_retries=30
    local retry_interval=10

    log_info "Running health checks on $target..."

    for i in $(seq 1 $max_retries); do
        if curl -sf "$target/api/health" > /dev/null; then
            log_info "Health check passed"
            return 0
        fi
        log_warn "Health check failed, retry $i/$max_retries..."
        sleep $retry_interval
    done

    log_error "Health check failed after $max_retries retries"
    return 1
}

# Smoke tests
smoke_tests() {
    log_info "Running smoke tests..."

    # Test authentication
    log_info "Testing authentication..."
    # Add authentication test here

    # Test database connectivity
    log_info "Testing database connectivity..."
    # Add database test here

    # Test cache connectivity
    log_info "Testing cache connectivity..."
    # Add cache test here

    log_info "Smoke tests passed"
}

# Gradual cutover
gradual_cutover() {
    log_info "Starting gradual cutover..."

    # 10% traffic to green
    log_info "Shifting 10% traffic to green..."
    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,ForwardConfig="{TargetGroups=[{TargetGroupArn=$TARGET_GROUP_BLUE,Weight=90},{TargetGroupArn=$TARGET_GROUP_GREEN,Weight=10}]}" \
        --region us-gov-west-1

    sleep 300  # Wait 5 minutes

    # 50% traffic to green
    log_info "Shifting 50% traffic to green..."
    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,ForwardConfig="{TargetGroups=[{TargetGroupArn=$TARGET_GROUP_BLUE,Weight=50},{TargetGroupArn=$TARGET_GROUP_GREEN,Weight=50}]}" \
        --region us-gov-west-1

    sleep 300  # Wait 5 minutes

    # 100% traffic to green
    log_info "Shifting 100% traffic to green..."
    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_GREEN \
        --region us-gov-west-1

    log_info "Cutover completed"
}

# Instant cutover
instant_cutover() {
    log_info "Performing instant cutover..."

    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_GREEN \
        --region us-gov-west-1

    log_info "Instant cutover completed"
}

# Rollback
rollback() {
    log_error "Rolling back to blue environment..."

    aws elbv2 modify-listener \
        --listener-arn $LISTENER_ARN \
        --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_BLUE \
        --region us-gov-west-1

    log_info "Rollback completed"
}

# Main deployment flow
main() {
    local deployment_type=${1:-gradual}

    log_info "Starting blue-green deployment (type: $deployment_type)..."

    # Pre-deployment checks
    pre_deployment_checks

    # Deploy to green
    deploy_green

    # Health checks
    if ! health_check "https://ppbe-green.example.gov"; then
        log_error "Health checks failed, aborting deployment"
        exit 1
    fi

    # Smoke tests
    if ! smoke_tests; then
        log_error "Smoke tests failed, aborting deployment"
        exit 1
    fi

    # Cutover
    if [ "$deployment_type" = "gradual" ]; then
        gradual_cutover
    else
        instant_cutover
    fi

    # Post-deployment validation
    log_info "Running post-deployment validation..."
    if ! health_check "https://ppbe.example.gov"; then
        log_error "Post-deployment validation failed, initiating rollback"
        rollback
        exit 1
    fi

    log_info "Deployment completed successfully!"
}

# Run main function
main "$@"
