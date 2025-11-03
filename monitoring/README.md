# DEVOPS-009: Monitoring and Alerting Documentation

## Overview
This directory contains monitoring and alerting configurations for the PPBE system using Prometheus, Grafana, and AWS CloudWatch.

## Components

### Prometheus
- **Location**: `prometheus.yml`
- **Purpose**: Metrics collection and storage
- **Scrape Interval**: 15 seconds
- **Retention**: 15 days (configurable)

#### Monitored Services:
- Backend API (port 5000)
- Frontend Application (port 80)
- PostgreSQL Database
- Redis Cache
- Container metrics (cAdvisor)
- System metrics (Node Exporter)
- Health endpoints (Blackbox Exporter)

### Grafana
- **Location**: `grafana/`
- **Purpose**: Metrics visualization and dashboards
- **Default Port**: 3001
- **Default Credentials**: admin/admin (change in production)

#### Dashboards:
- Application Performance Dashboard
- Database Metrics Dashboard
- Infrastructure Overview Dashboard
- Security Monitoring Dashboard
- Business Metrics Dashboard

### CloudWatch (AWS GovCloud)
- **Location**: `cloudwatch/`
- **Purpose**: AWS native monitoring and alerting
- **Integration**: ECS, RDS, ElastiCache

## Alert Rules

### Critical Alerts
1. **ApplicationDown**: Service unavailable for 1+ minute
2. **DatabaseDown**: Database unavailable for 1+ minute
3. **RedisDown**: Cache unavailable for 1+ minute
4. **AuditLogFailure**: Compliance violation - immediate action required
5. **DataEncryptionFailure**: Security violation - immediate action required

### Warning Alerts
1. **HighErrorRate**: Error rate > 5% for 5 minutes
2. **SlowResponseTime**: 95th percentile > 1 second
3. **HighDatabaseConnections**: > 80 active connections
4. **HighCPUUsage**: > 80% CPU utilization
5. **HighMemoryUsage**: > 90% memory utilization

### Security Alerts
1. **UnauthorizedAccessAttempts**: > 10 unauthorized attempts/second
2. **RateLimitExceeded**: Rate limiting frequently triggered
3. **SuspiciousActivity**: Unusual access patterns

## Setup Instructions

### Local Development (Docker Compose)
```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access Prometheus
http://localhost:9090

# Access Grafana
http://localhost:3001
```

### Production Deployment

#### 1. Prometheus Setup
```bash
# Deploy Prometheus to ECS
aws ecs create-service \
  --cluster ppbe-cluster \
  --service-name prometheus \
  --task-definition ppbe-prometheus \
  --desired-count 1
```

#### 2. Grafana Setup
```bash
# Deploy Grafana to ECS
aws ecs create-service \
  --cluster ppbe-cluster \
  --service-name grafana \
  --task-definition ppbe-grafana \
  --desired-count 1
```

#### 3. CloudWatch Alarms
```bash
# Create CloudWatch alarms
aws cloudwatch put-metric-alarm \
  --cli-input-json file://cloudwatch/alarms.json
```

## Metrics Endpoints

### Backend API
```
GET /metrics - Prometheus metrics
GET /health - Health check endpoint
```

### Metrics Format
```
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",status="200"} 1234

# HELP http_request_duration_seconds HTTP request duration
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.1"} 100
```

## Key Metrics

### Application Metrics
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration
- `active_connections`: Active connections
- `budget_transactions_total`: Budget transactions
- `user_sessions_active`: Active user sessions

### Infrastructure Metrics
- `container_cpu_usage_seconds_total`: CPU usage
- `container_memory_usage_bytes`: Memory usage
- `container_network_receive_bytes_total`: Network RX
- `container_network_transmit_bytes_total`: Network TX

### Database Metrics
- `pg_stat_database_numbackends`: Active connections
- `pg_database_size_bytes`: Database size
- `pg_stat_statements_total`: Query count
- `pg_locks_count`: Lock count

### Redis Metrics
- `redis_connected_clients`: Connected clients
- `redis_used_memory_bytes`: Memory usage
- `redis_commands_processed_total`: Commands processed
- `redis_keyspace_hits_total`: Cache hits

## Alert Routing

### Severity Levels
1. **Critical**: Immediate notification (PagerDuty, Phone)
2. **Warning**: Email + Slack notification
3. **Info**: Slack notification only

### Notification Channels
- Email: ops-team@ppbe.example.gov
- Slack: #ppbe-alerts
- PagerDuty: ppbe-oncall
- SNS Topic: arn:aws-us-gov:sns:us-gov-west-1:ACCOUNT:ppbe-alerts

## Compliance Requirements

### FedRAMP Moderate
- Audit log monitoring (24/7)
- Security event alerting (< 1 minute)
- System availability monitoring (99.9% uptime)
- Performance metrics retention (90 days)

### FISMA
- Continuous monitoring enabled
- Security alerts configured
- Incident response integration
- Audit trail maintained

## Troubleshooting

### Prometheus Not Scraping
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check service discovery
docker-compose logs prometheus
```

### Grafana Connection Issues
```bash
# Test Prometheus connectivity
curl http://prometheus:9090/api/v1/query?query=up

# Check Grafana logs
docker-compose logs grafana
```

### Missing Metrics
```bash
# Verify exporter is running
docker-compose ps

# Test metrics endpoint
curl http://backend:5000/metrics
```

## Best Practices

1. **Alert Fatigue**: Tune alert thresholds to reduce false positives
2. **Dashboard Design**: Keep dashboards focused and actionable
3. **Metric Naming**: Follow Prometheus naming conventions
4. **Retention Policy**: Balance storage costs with compliance needs
5. **High Availability**: Deploy Prometheus in HA mode for production

## References
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [FedRAMP Continuous Monitoring](https://www.fedramp.gov/)
