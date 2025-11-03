# DEVOPS-010: Blue-Green Deployment Strategy

## Overview
This document describes the blue-green deployment strategy for the PPBE federal system, ensuring zero-downtime deployments with rapid rollback capabilities.

## Blue-Green Deployment Architecture

### Concept
Blue-green deployment maintains two identical production environments:
- **Blue Environment**: Currently serving production traffic
- **Green Environment**: New version being deployed and tested

### Benefits
1. **Zero Downtime**: Instant cutover between environments
2. **Easy Rollback**: Switch back to blue if issues arise
3. **Risk Mitigation**: Test in production-like environment before cutover
4. **Compliance**: Maintains audit trail of all deployments

## Infrastructure Setup

### AWS ECS Configuration

#### Target Groups
```hcl
# Blue Target Group (Current Production)
resource "aws_lb_target_group" "blue" {
  name     = "ppbe-backend-blue"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
  }

  tags = {
    Environment = "blue"
  }
}

# Green Target Group (New Deployment)
resource "aws_lb_target_group" "green" {
  name     = "ppbe-backend-green"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = var.vpc_id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/api/health"
    matcher             = "200"
  }

  tags = {
    Environment = "green"
  }
}
```

#### Load Balancer Listener Rules
```hcl
# Production listener (initially points to blue)
resource "aws_lb_listener" "production" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue.arn
  }
}

# Test listener for green environment
resource "aws_lb_listener" "test" {
  load_balancer_arn = aws_lb.main.arn
  port              = "8443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green.arn
  }
}
```

## Deployment Process

### Phase 1: Pre-Deployment (30 minutes)

#### 1.1 Preparation Checklist
- [ ] Code review completed and approved
- [ ] All tests passing (unit, integration, security)
- [ ] Security scan completed (no critical vulnerabilities)
- [ ] Database migrations prepared and tested
- [ ] Deployment window scheduled (low-traffic period)
- [ ] Stakeholders notified
- [ ] Rollback plan reviewed

#### 1.2 Backup Current State
```bash
# Backup database
aws rds create-db-snapshot \
  --db-instance-identifier ppbe-prod \
  --db-snapshot-identifier ppbe-prod-$(date +%Y%m%d-%H%M%S)

# Tag current production image
docker tag ppbe-backend:latest ppbe-backend:blue-backup
docker tag ppbe-frontend:latest ppbe-frontend:blue-backup
```

#### 1.3 Database Migrations (if needed)
```bash
# Run forward-compatible migrations on blue environment
# These migrations must work with both old and new code
npm run migrate

# Verify migrations
npm run migrate:status
```

### Phase 2: Green Environment Deployment (20 minutes)

#### 2.1 Deploy to Green Environment
```bash
# Deploy backend to green
aws ecs update-service \
  --cluster ppbe-cluster \
  --service ppbe-backend-green \
  --task-definition ppbe-backend:latest \
  --force-new-deployment

# Deploy frontend to green
aws ecs update-service \
  --cluster ppbe-cluster \
  --service ppbe-frontend-green \
  --task-definition ppbe-frontend:latest \
  --force-new-deployment
```

#### 2.2 Wait for Deployment Completion
```bash
# Monitor deployment status
aws ecs wait services-stable \
  --cluster ppbe-cluster \
  --services ppbe-backend-green ppbe-frontend-green

# Check task health
aws ecs describe-services \
  --cluster ppbe-cluster \
  --services ppbe-backend-green
```

### Phase 3: Green Environment Testing (15 minutes)

#### 3.1 Health Checks
```bash
# Test health endpoint
curl -f https://ppbe.example.gov:8443/api/health || exit 1

# Verify database connectivity
curl -f https://ppbe.example.gov:8443/api/health/db || exit 1

# Verify cache connectivity
curl -f https://ppbe.example.gov:8443/api/health/cache || exit 1
```

#### 3.2 Smoke Tests
```bash
# Run automated smoke tests against green environment
npm run test:smoke -- --target=https://ppbe.example.gov:8443

# Key functionality tests:
# - User authentication
# - Budget creation
# - Program management
# - Execution tracking
# - Report generation
```

#### 3.3 Performance Testing
```bash
# Run load test to verify performance
artillery run \
  --target https://ppbe.example.gov:8443 \
  tests/load/smoke-test.yml

# Verify response times < 500ms for p95
# Verify error rate < 0.1%
```

#### 3.4 Security Validation
```bash
# Verify security headers
curl -I https://ppbe.example.gov:8443/api/health | grep -i "strict-transport-security"

# Test authentication
npm run test:security -- --target=green

# Verify audit logging
tail -f /var/log/ppbe/audit.log
```

### Phase 4: Traffic Cutover (5 minutes)

#### 4.1 Gradual Traffic Shift (Canary)
```bash
# Option 1: Gradual shift (recommended)
# Shift 10% of traffic to green
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions \
    Type=forward,ForwardConfig={TargetGroups=[{TargetGroupArn=$BLUE_TG,Weight=90},{TargetGroupArn=$GREEN_TG,Weight=10}]}

# Wait 5 minutes and monitor metrics
sleep 300

# Shift 50% of traffic
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions \
    Type=forward,ForwardConfig={TargetGroups=[{TargetGroupArn=$BLUE_TG,Weight=50},{TargetGroupArn=$GREEN_TG,Weight=50}]}

# Wait 5 minutes and monitor metrics
sleep 300

# Shift 100% of traffic to green
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG
```

#### 4.2 Instant Cutover (for urgent deployments)
```bash
# Switch all traffic to green immediately
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$GREEN_TG
```

### Phase 5: Post-Deployment Validation (10 minutes)

#### 5.1 Monitor Key Metrics
```bash
# Check error rates in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=LoadBalancer,Value=$LB_NAME \
  --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Sum

# Monitor response times
# Monitor active connections
# Monitor database performance
```

#### 5.2 Verify Business Functions
```bash
# Test critical user workflows
# - Login
# - Budget approval
# - Report generation
# - Data export
```

#### 5.3 Check Audit Logs
```bash
# Verify audit logging is functioning
tail -n 100 /var/log/ppbe/audit.log

# Check for any security events
grep "SECURITY" /var/log/ppbe/application.log
```

### Phase 6: Blue Environment Cleanup (5 minutes)

#### 6.1 Keep Blue Running (Recommended)
```bash
# Keep blue environment running for quick rollback
# Scale down to minimal capacity to save costs
aws ecs update-service \
  --cluster ppbe-cluster \
  --service ppbe-backend-blue \
  --desired-count 1
```

#### 6.2 Decommission Blue (After Soak Period)
```bash
# After 24-48 hours of successful green operation
aws ecs update-service \
  --cluster ppbe-cluster \
  --service ppbe-backend-blue \
  --desired-count 0

# Swap labels: Green becomes new Blue
aws ecs tag-resource \
  --resource-arn $GREEN_SERVICE_ARN \
  --tags key=Environment,value=blue

# Keep old blue task definition for rollback
```

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

#### Scenario: Critical issue detected in green environment

```bash
# Instantly switch all traffic back to blue
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions Type=forward,TargetGroupArn=$BLUE_TG

# Verify traffic is flowing
curl -f https://ppbe.example.gov/api/health

# Scale up blue if needed
aws ecs update-service \
  --cluster ppbe-cluster \
  --service ppbe-backend-blue \
  --desired-count 3

# Investigate green environment issues
aws ecs describe-tasks --cluster ppbe-cluster --tasks $GREEN_TASK_ARN
```

#### Database Rollback (if migrations were applied)
```bash
# Rollback database migrations
npm run migrate:rollback

# Verify database state
npm run migrate:status

# Test blue environment with rolled-back database
curl -f https://ppbe.example.gov/api/health/db
```

### Gradual Rollback

```bash
# Reduce green traffic gradually
aws elbv2 modify-listener \
  --listener-arn $LISTENER_ARN \
  --default-actions \
    Type=forward,ForwardConfig={TargetGroups=[{TargetGroupArn=$BLUE_TG,Weight=70},{TargetGroupArn=$GREEN_TG,Weight=30}]}

# Monitor and continue reducing if issues persist
```

## Automation Scripts

### Deployment Script
```bash
#!/bin/bash
# deploy-blue-green.sh

set -e

ENVIRONMENT=${1:-prod}
DEPLOYMENT_TYPE=${2:-gradual}  # gradual or instant

echo "Starting blue-green deployment to $ENVIRONMENT..."

# 1. Run pre-deployment checks
./scripts/pre-deployment-checks.sh

# 2. Deploy to green
./scripts/deploy-green.sh $ENVIRONMENT

# 3. Run smoke tests
./scripts/smoke-test.sh green

# 4. Perform cutover
if [ "$DEPLOYMENT_TYPE" = "gradual" ]; then
    ./scripts/gradual-cutover.sh
else
    ./scripts/instant-cutover.sh
fi

# 5. Post-deployment validation
./scripts/post-deployment-validation.sh

# 6. Cleanup
./scripts/cleanup-blue.sh

echo "Deployment completed successfully!"
```

### Health Check Script
```bash
#!/bin/bash
# health-check.sh

TARGET=$1
MAX_RETRIES=30
RETRY_INTERVAL=10

for i in $(seq 1 $MAX_RETRIES); do
    if curl -sf $TARGET/api/health > /dev/null; then
        echo "Health check passed"
        exit 0
    fi
    echo "Health check failed, retry $i/$MAX_RETRIES..."
    sleep $RETRY_INTERVAL
done

echo "Health check failed after $MAX_RETRIES retries"
exit 1
```

## Monitoring During Deployment

### Key Metrics to Watch

1. **Application Metrics**
   - HTTP 5xx error rate (should be < 0.1%)
   - Response time p95 (should be < 1s)
   - Active connections
   - Request rate

2. **Infrastructure Metrics**
   - CPU utilization (< 80%)
   - Memory utilization (< 90%)
   - Network throughput
   - Disk I/O

3. **Database Metrics**
   - Connection count
   - Query performance
   - Lock contention
   - Replication lag (if applicable)

4. **Business Metrics**
   - Successful logins
   - Budget transactions
   - Report generations
   - Failed operations

### Alert Configuration

```yaml
# Deployment alert rules
alerts:
  - name: DeploymentHighErrorRate
    condition: error_rate > 1%
    action: STOP_DEPLOYMENT_AND_ROLLBACK

  - name: DeploymentSlowResponse
    condition: p95_response_time > 2s
    action: PAUSE_DEPLOYMENT

  - name: DeploymentDatabaseErrors
    condition: db_errors > 10/min
    action: STOP_DEPLOYMENT_AND_ROLLBACK
```

## Compliance Considerations

### FedRAMP Requirements
- All deployments must be logged and auditable
- Change control documentation required
- Security testing mandatory before cutover
- Rollback capability must be tested quarterly

### FISMA Requirements
- Deployment window must be approved
- Risk assessment completed
- Incident response team on standby
- Post-deployment security validation

## Best Practices

1. **Always Deploy During Low-Traffic Windows**
   - Recommended: 2 AM - 4 AM Eastern Time
   - Avoid: Business hours, month-end, fiscal year-end

2. **Database Migration Strategy**
   - Phase 1: Add new columns (backward compatible)
   - Phase 2: Deploy application changes
   - Phase 3: Migrate data (background job)
   - Phase 4: Remove old columns (next deployment)

3. **Feature Flags**
   - Use feature flags for risky changes
   - Enable gradually on green environment
   - Quick disable if issues arise

4. **Communication**
   - Notify stakeholders 24 hours in advance
   - Status updates during deployment
   - Post-deployment summary

5. **Testing**
   - Automated smoke tests required
   - Manual testing of critical paths
   - Performance testing under load
   - Security validation

## Troubleshooting

### Common Issues

#### Green Environment Won't Start
```bash
# Check ECS task logs
aws ecs describe-tasks --cluster ppbe-cluster --tasks $GREEN_TASK_ARN

# Check CloudWatch logs
aws logs tail /aws/ecs/ppbe-green --follow
```

#### Health Checks Failing
```bash
# Test health endpoint directly
curl -v https://green.ppbe.example.gov/api/health

# Check security group rules
# Check target group health checks
# Verify application logs
```

#### High Error Rate After Cutover
```bash
# Immediate rollback
./scripts/rollback.sh

# Check application logs
# Review recent changes
# Verify environment variables
```

## Appendix

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations prepared
- [ ] Rollback plan documented
- [ ] Stakeholders notified
- [ ] Deployment window scheduled
- [ ] Backup completed
- [ ] Team available for support

### Post-Deployment Checklist
- [ ] All health checks passing
- [ ] Error rates normal
- [ ] Performance metrics acceptable
- [ ] Security validation completed
- [ ] Business functions verified
- [ ] Audit logs functioning
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Stakeholders notified of completion

### Contact Information
- DevOps Team: devops@ppbe.example.gov
- Security Team: security@ppbe.example.gov
- On-Call: +1-XXX-XXX-XXXX
- Incident Response: incidents@ppbe.example.gov
