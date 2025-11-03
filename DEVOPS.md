# DevOps Infrastructure Documentation

## Overview
This document provides comprehensive documentation for the production-grade DevOps infrastructure implemented for the Federal PPBE (Planning, Programming, Budgeting, and Execution) system.

## Features Implemented

### DEVOPS-001: Docker Containerization
**Multi-stage Docker builds for optimized production deployments**

#### Backend Dockerfile
- **Location**: `/home/user/fluffy-octo-meme/backend/Dockerfile`
- **Features**:
  - Multi-stage build (builder + production)
  - Non-root user for security
  - Health checks configured
  - Minimal production image size
  - Security best practices

#### Frontend Dockerfile
- **Location**: `/home/user/fluffy-octo-meme/frontend/Dockerfile`
- **Features**:
  - Multi-stage build with Nginx
  - Optimized static asset serving
  - Security headers configured
  - Non-root user execution
  - Health checks

**Usage**:
```bash
# Build backend
docker build -t ppbe-backend:latest ./backend

# Build frontend
docker build -t ppbe-frontend:latest ./frontend

# Run locally
docker run -p 5000:5000 ppbe-backend:latest
docker run -p 3000:80 ppbe-frontend:latest
```

---

### DEVOPS-002: Docker Compose for Local Development
**Complete local development environment with all services**

- **Location**: `/home/user/fluffy-octo-meme/docker-compose.yml`
- **Services**:
  - PostgreSQL 16 database with persistence
  - Redis 7 cache with persistence
  - Backend API (Node.js/Express)
  - Frontend (React/Nginx)
  - Prometheus monitoring (optional profile)
  - Grafana dashboards (optional profile)

**Usage**:
```bash
# Start core services
docker-compose up -d

# Start with monitoring
docker-compose --profile monitoring up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Clean volumes
docker-compose down -v
```

**Features**:
- Health checks for all services
- Named volumes for data persistence
- Network isolation
- Environment variable configuration
- Service dependencies managed

---

### DEVOPS-003: GitHub Actions CI/CD Pipeline
**Automated testing, building, and deployment**

- **Location**: `/home/user/fluffy-octo-meme/.github/workflows/ci-cd.yml`

**Pipeline Stages**:
1. **Lint**: Code quality checks
2. **Test**: Unit and integration tests
3. **Build**: Docker image builds
4. **Integration Test**: End-to-end testing
5. **Deploy Staging**: Automatic staging deployment
6. **Deploy Production**: Production deployment with approval

**Features**:
- Parallel job execution
- Docker layer caching
- Automated testing with services (PostgreSQL, Redis)
- GitHub Container Registry integration
- Environment-specific deployments
- Blue-green deployment support
- Rollback on failure

**Triggers**:
- Push to main/develop/staging branches
- Pull requests
- Manual workflow dispatch

---

### DEVOPS-004: Automated Security Scanning
**Comprehensive security scanning for vulnerabilities**

- **Location**: `/home/user/fluffy-octo-meme/.github/workflows/security-scan.yml`

**Scanning Tools**:
1. **NPM Audit**: Dependency vulnerability scanning
2. **Trivy**: Filesystem and Docker image scanning
3. **CodeQL**: Static application security testing (SAST)
4. **TruffleHog**: Secret detection
5. **OWASP Dependency Check**: Known vulnerability scanning

**Features**:
- Scheduled daily scans
- SARIF report generation
- GitHub Security tab integration
- PR comments with results
- Critical vulnerability blocking
- Compliance reporting

**Usage**:
```bash
# Manual security scan
npm audit

# Trivy scan
trivy fs --severity HIGH,CRITICAL ./backend

# Docker image scan
trivy image ppbe-backend:latest
```

---

### DEVOPS-005: Infrastructure as Code (Terraform)
**Complete AWS GovCloud infrastructure provisioning**

- **Location**: `/home/user/fluffy-octo-meme/terraform/`

**Infrastructure Components**:
1. **VPC Module**: Multi-AZ networking
   - Public and private subnets
   - NAT gateways
   - Internet gateway
   - VPC Flow Logs
   - Route tables

2. **Security Module**: Security groups and policies

3. **ALB Module**: Application Load Balancer
   - HTTPS/TLS termination
   - Target groups (blue/green)
   - Health checks

4. **RDS Module**: PostgreSQL database
   - Multi-AZ deployment
   - Automated backups
   - Encryption at rest
   - Parameter groups

5. **ElastiCache Module**: Redis cluster
   - Multi-node setup
   - Automatic failover
   - Encryption in transit

6. **ECS Module**: Container orchestration
   - Fargate tasks
   - Auto-scaling
   - Service discovery
   - Task definitions

**Usage**:
```bash
# Initialize Terraform
cd terraform
terraform init

# Plan infrastructure
terraform plan -var-file=environments/prod/terraform.tfvars

# Apply infrastructure
terraform apply -var-file=environments/prod/terraform.tfvars

# Destroy infrastructure
terraform destroy -var-file=environments/prod/terraform.tfvars
```

**Features**:
- State management in S3
- State locking with DynamoDB
- Environment separation (dev/staging/prod)
- Modular architecture
- KMS encryption
- Compliance tagging (FedRAMP, FISMA)

---

### DEVOPS-006: Database Migration System
**PostgreSQL schema management and migrations**

- **Location**: `/home/user/fluffy-octo-meme/backend/migrations/`

**Files**:
- `init.sql`: Initial schema creation
- `migrate.js`: Migration runner script

**Features**:
- Version-controlled schema changes
- Transactional migrations
- Rollback support
- Migration status tracking
- Automated execution in CI/CD

**Schema Includes**:
- Users table with authentication
- Fiscal years management
- Budget tracking
- Program management
- Execution records
- Audit logs for compliance
- Indexes for performance
- Triggers for timestamps

**Usage**:
```bash
# Run pending migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Check migration status
npm run migrate:status

# Rollback specific number of migrations
npm run migrate:rollback 2
```

---

### DEVOPS-007: Environment Configuration Management
**Comprehensive environment variable management**

- **Locations**:
  - `/home/user/fluffy-octo-meme/.env.example` - Template with all variables
  - `/home/user/fluffy-octo-meme/.env.development` - Development config
  - `/home/user/fluffy-octo-meme/.env.production` - Production config

**Configuration Categories**:
1. **Application**: Node environment, ports, URLs
2. **Database**: PostgreSQL connection, pooling
3. **Cache**: Redis configuration
4. **Security**: JWT, sessions, CORS, rate limiting
5. **AWS**: Region, credentials, services
6. **Logging**: Levels, formats, retention
7. **Monitoring**: Prometheus, Grafana
8. **Email**: SMTP configuration
9. **Features**: Feature flags
10. **Compliance**: FedRAMP, FISMA settings

**Best Practices**:
- Never commit actual secrets
- Use AWS Secrets Manager in production
- Environment-specific configurations
- Validation on startup
- Secure defaults

---

### DEVOPS-008: Winston Logging Infrastructure
**Production-grade structured logging**

- **Location**: `/home/user/fluffy-octo-meme/backend/utils/logger.js`

**Features**:
1. **Multiple Transports**:
   - Console (development)
   - Daily rotating files (production)
   - Error-specific logs
   - HTTP request logs

2. **Log Levels**:
   - error: Critical failures
   - warn: Warning conditions
   - info: Informational messages
   - http: HTTP requests
   - debug: Detailed debugging

3. **Structured Logging**:
   - JSON format for production
   - Colorized output for development
   - Timestamp inclusion
   - Stack trace capture

4. **Special Loggers**:
   - `audit()`: Compliance audit logging
   - `security()`: Security event logging
   - `performance()`: Performance metrics

5. **Log Rotation**:
   - Daily rotation
   - Compression of old logs
   - Retention policies (14 days default)
   - Size-based rotation (20MB default)

**Usage**:
```javascript
const { logger } = require('./utils/logger');

logger.info('User logged in', { userId: 123 });
logger.error('Database error', { error: err.message });
logger.audit('BUDGET_APPROVED', userId, budgetId);
logger.security('UNAUTHORIZED_ACCESS', 'high', { ip: req.ip });
logger.performance('DB_QUERY', duration, { query: 'SELECT *' });
```

**Compliance**:
- FedRAMP audit trail requirements
- FISMA logging standards
- Tamper-evident logs
- Long-term retention

---

### DEVOPS-009: Monitoring and Alerting
**Comprehensive system monitoring with Prometheus and Grafana**

#### Prometheus Configuration
- **Location**: `/home/user/fluffy-octo-meme/monitoring/prometheus.yml`

**Monitored Targets**:
- Backend API endpoints
- Frontend application
- PostgreSQL database
- Redis cache
- Container metrics (cAdvisor)
- System metrics (Node Exporter)
- Endpoint health (Blackbox Exporter)

**Features**:
- 15-second scrape interval
- Alert rule evaluation
- Remote write for long-term storage
- Service discovery

#### Alert Rules
- **Location**: `/home/user/fluffy-octo-meme/monitoring/prometheus/alerts/ppbe-alerts.yml`

**Alert Categories**:
1. **Application Alerts**:
   - Service down
   - High error rate
   - Slow response times

2. **Database Alerts**:
   - Database down
   - High connection count
   - Disk space warnings

3. **Infrastructure Alerts**:
   - High CPU usage
   - High memory usage
   - Container restarts

4. **Security Alerts**:
   - Unauthorized access attempts
   - Rate limit exceeded
   - Encryption failures

5. **Compliance Alerts**:
   - Audit log failures
   - Data encryption issues

#### Grafana Dashboards
- **Location**: `/home/user/fluffy-octo-meme/monitoring/grafana/`

**Dashboards**:
- Application Performance
- Database Metrics
- Infrastructure Overview
- Security Monitoring
- Business Metrics

#### CloudWatch Integration
- **Location**: `/home/user/fluffy-octo-meme/monitoring/cloudwatch/`

**AWS Metrics**:
- ECS task metrics
- RDS database metrics
- ElastiCache metrics
- ALB metrics
- Custom application metrics

**Usage**:
```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access Prometheus
open http://localhost:9090

# Access Grafana
open http://localhost:3001
```

---

### DEVOPS-010: Blue-Green Deployment Strategy
**Zero-downtime deployment with instant rollback**

- **Location**: `/home/user/fluffy-octo-meme/deployment/BLUE_GREEN_DEPLOYMENT.md`

**Strategy Components**:
1. **Infrastructure**:
   - Blue environment (current production)
   - Green environment (new deployment)
   - Load balancer with dual target groups
   - Independent ECS services

2. **Deployment Phases**:
   - Phase 1: Pre-deployment (backups, migrations)
   - Phase 2: Green deployment
   - Phase 3: Testing (health, smoke, performance)
   - Phase 4: Traffic cutover (gradual or instant)
   - Phase 5: Post-deployment validation
   - Phase 6: Blue cleanup

3. **Cutover Options**:
   - **Gradual**: 10% → 50% → 100% traffic shift
   - **Instant**: Immediate 100% cutover

4. **Rollback Capability**:
   - Instant traffic switch back to blue
   - Database migration rollback
   - Automated on failure detection

**Automation Script**:
- **Location**: `/home/user/fluffy-octo-meme/deployment/scripts/deploy.sh`

**Usage**:
```bash
# Gradual deployment
./deployment/scripts/deploy.sh gradual

# Instant deployment
./deployment/scripts/deploy.sh instant

# Manual rollback
./deployment/scripts/rollback.sh
```

**Features**:
- Pre-deployment validation
- Automated health checks
- Smoke test execution
- Performance monitoring
- Automatic rollback on failure
- Audit logging

**Compliance**:
- Change control documentation
- Risk assessment integration
- Security validation gates
- Post-deployment verification

---

## Quick Start Guide

### Local Development Setup

1. **Clone Repository**:
```bash
git clone <repository-url>
cd fluffy-octo-meme
```

2. **Configure Environment**:
```bash
cp .env.example .env
# Edit .env with your local settings
```

3. **Start Services**:
```bash
docker-compose up -d
```

4. **Run Migrations**:
```bash
cd backend
npm run migrate
```

5. **Access Application**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Production Deployment

1. **Infrastructure Provisioning**:
```bash
cd terraform
terraform init
terraform plan -var-file=environments/prod/terraform.tfvars
terraform apply -var-file=environments/prod/terraform.tfvars
```

2. **Build and Push Images**:
```bash
# Backend
docker build -t ppbe-backend:latest ./backend
docker tag ppbe-backend:latest <registry>/ppbe-backend:latest
docker push <registry>/ppbe-backend:latest

# Frontend
docker build -t ppbe-frontend:latest ./frontend
docker tag ppbe-frontend:latest <registry>/ppbe-frontend:latest
docker push <registry>/ppbe-frontend:latest
```

3. **Deploy via Blue-Green**:
```bash
./deployment/scripts/deploy.sh gradual
```

4. **Monitor Deployment**:
- Prometheus: https://prometheus.ppbe.example.gov
- Grafana: https://grafana.ppbe.example.gov
- CloudWatch: AWS Console

---

## Security Best Practices

1. **Container Security**:
   - Non-root user execution
   - Minimal base images
   - No secrets in images
   - Regular security scans

2. **Network Security**:
   - Private subnets for workloads
   - Security groups with least privilege
   - TLS/HTTPS everywhere
   - VPC Flow Logs enabled

3. **Data Security**:
   - Encryption at rest (RDS, EBS, S3)
   - Encryption in transit (TLS 1.2+)
   - KMS key management
   - Regular backups

4. **Access Control**:
   - IAM roles for services
   - No hardcoded credentials
   - AWS Secrets Manager integration
   - MFA for production access

5. **Compliance**:
   - FedRAMP Moderate controls
   - FISMA requirements
   - Audit logging enabled
   - Regular security assessments

---

## Monitoring and Observability

### Key Metrics

1. **Application**:
   - Request rate
   - Error rate
   - Response time (p50, p95, p99)
   - Active connections

2. **Infrastructure**:
   - CPU utilization
   - Memory usage
   - Network throughput
   - Disk I/O

3. **Database**:
   - Connection count
   - Query performance
   - Lock contention
   - Replication lag

4. **Business**:
   - Budget transactions
   - User sessions
   - Report generations
   - Approval workflows

### Alert Response

- **Critical**: < 5 minute response (PagerDuty)
- **Warning**: < 30 minute response (Email + Slack)
- **Info**: Next business day (Slack)

---

## Disaster Recovery

### Backup Strategy

1. **Database**:
   - Automated daily snapshots
   - 30-day retention
   - Point-in-time recovery
   - Cross-region replication

2. **Application State**:
   - Redis AOF persistence
   - Daily exports to S3
   - Versioned backups

3. **Configuration**:
   - Infrastructure as Code in Git
   - Environment configs in Secrets Manager
   - Runbooks documented

### Recovery Procedures

1. **Database Restore**:
```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ppbe-restored \
  --db-snapshot-identifier ppbe-backup-YYYYMMDD
```

2. **Application Rollback**:
```bash
./deployment/scripts/rollback.sh
```

3. **Full Region Failover**:
   - DNS cutover to backup region
   - Restore database from snapshot
   - Deploy application stack
   - Verify functionality

**RTO**: 4 hours
**RPO**: 24 hours

---

## Maintenance Windows

### Scheduled Maintenance
- **Day**: Sunday
- **Time**: 2:00 AM - 4:00 AM ET
- **Frequency**: Monthly
- **Activities**:
  - OS patching
  - Database maintenance
  - Certificate rotation
  - Security updates

### Emergency Maintenance
- Immediate for critical security issues
- Stakeholder notification
- Rollback plan required

---

## Support and Contacts

- **DevOps Team**: devops@ppbe.example.gov
- **Security Team**: security@ppbe.example.gov
- **On-Call**: +1-XXX-XXX-XXXX
- **Incident Response**: incidents@ppbe.example.gov

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [FedRAMP Documentation](https://www.fedramp.gov/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

## Change Log

- **2025-11-03**: Initial DevOps infrastructure implementation
  - Docker containerization
  - CI/CD pipelines
  - Infrastructure as Code
  - Monitoring and logging
  - Blue-green deployment

---

## License

Proprietary - Federal Government Use Only
