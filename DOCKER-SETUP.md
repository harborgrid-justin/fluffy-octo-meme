# Docker Setup Guide

## Overview

This guide provides detailed instructions for setting up and running the PPBE Management System using Docker.

## Quick Start

### 1. Prerequisites

- Docker Engine 20.10 or higher
- Docker Compose v2.0 or higher
- 4GB+ RAM allocated to Docker
- 10GB+ free disk space

### 2. Clone and Configure

```bash
# Clone the repository
git clone <repository-url>
cd fluffy-octo-meme

# Create environment file
cp .env.example .env

# Edit .env and set secure values (REQUIRED FOR PRODUCTION)
nano .env  # or your preferred editor
```

**Critical Environment Variables to Change:**
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
POSTGRES_PASSWORD=changeme-use-strong-password
REDIS_PASSWORD=changeme-use-strong-password
```

### 3. Start the Application

```bash
# Start all services
docker compose up

# Or start in detached mode (background)
docker compose up -d
```

### 4. Access the Application

Once all services are healthy:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **API Health Check:** http://localhost:5000/api/health
- **Database:** localhost:5432 (PostgreSQL)
- **Redis:** localhost:6379

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **IMPORTANT:** Change these credentials in production!

## Architecture

### Services

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **postgres** | PostgreSQL 16 | 5432 | Primary database |
| **redis** | Redis 7 | 6379 | Caching and sessions |
| **backend** | Node.js 20 + TypeScript | 5000 | REST API server |
| **frontend** | React 19 + nginx | 3000 | Web application |
| **prometheus** | Prometheus (optional) | 9090 | Metrics collection |
| **grafana** | Grafana (optional) | 3001 | Monitoring dashboard |

### Network

All services communicate over a dedicated bridge network (`ppbe-network`):
- Subnet: 172.20.0.0/16
- Internal DNS resolution by service name
- Services are isolated from host network

### Volumes

Persistent data is stored in named volumes:

| Volume | Purpose | Backup Priority |
|--------|---------|-----------------|
| `postgres_data` | Database data | **Critical** |
| `redis_data` | Cache data | Low |
| `backend_logs` | Application logs | Medium |
| `prometheus_data` | Metrics history | Low |
| `grafana_data` | Dashboard configs | Low |

## Development Mode

### Hot Reload Setup

For development with automatic code reloading:

```bash
# Start with development overrides
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This enables:
- **Backend:** TypeScript hot reload with ts-node-dev
- **Frontend:** Vite HMR (Hot Module Replacement)
- **Source mounting:** Changes reflect immediately
- **Debugging:** Node.js inspector on port 9229

### Debugging Backend

With development mode running, you can attach a debugger:

```bash
# Chrome DevTools
chrome://inspect

# VS Code launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/backend",
  "remoteRoot": "/app",
  "protocol": "inspector"
}
```

### Accessing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend

# Last 100 lines
docker compose logs --tail=100 backend

# With timestamps
docker compose logs -f -t backend
```

## Common Operations

### Starting Services

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Start specific services
docker compose up postgres redis backend

# Rebuild and start
docker compose up --build

# Force recreate containers
docker compose up --force-recreate
```

### Stopping Services

```bash
# Stop all services (preserves data)
docker compose down

# Stop and remove volumes (DELETES ALL DATA)
docker compose down -v

# Stop specific service
docker compose stop backend
```

### Rebuilding

```bash
# Rebuild all images
docker compose build

# Rebuild specific service
docker compose build backend

# Rebuild without cache
docker compose build --no-cache

# Pull latest base images
docker compose build --pull
```

### Viewing Status

```bash
# List running containers
docker compose ps

# Show detailed status
docker compose ps -a

# Check health
docker inspect ppbe-backend --format='{{json .State.Health.Status}}'
```

## Database Operations

### Connecting to Database

```bash
# Using docker compose
docker compose exec postgres psql -U ppbe_user -d ppbe

# Direct connection
psql -h localhost -p 5432 -U ppbe_user -d ppbe
```

### Running Migrations

Migrations run automatically on container startup via `init.sql`. To manually run:

```bash
docker compose exec postgres psql -U ppbe_user -d ppbe -f /docker-entrypoint-initdb.d/init.sql
```

### Backup Database

```bash
# Create backup
docker compose exec -T postgres pg_dump -U ppbe_user ppbe > backup-$(date +%Y%m%d).sql

# With compression
docker compose exec -T postgres pg_dump -U ppbe_user ppbe | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
docker compose exec -T postgres psql -U ppbe_user ppbe < backup.sql

# From compressed file
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U ppbe_user ppbe
```

## Monitoring (Optional)

### Enable Monitoring Stack

```bash
# Start with Prometheus and Grafana
docker compose --profile monitoring up -d

# Access services
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001
```

### Grafana Setup

1. Navigate to http://localhost:3001
2. Login with credentials from `.env` (default: admin/admin)
3. Datasources are auto-configured
4. Import dashboards from `/monitoring/grafana/dashboards/`

### Prometheus Queries

Example queries:
```promql
# HTTP request rate
rate(http_requests_total[5m])

# Memory usage
process_resident_memory_bytes

# Active database connections
pg_stat_database_numbackends
```

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker compose logs

# Check for port conflicts
lsof -i :5000
lsof -i :3000

# Remove old containers
docker compose down
docker system prune -a

# Rebuild from scratch
docker compose down -v
docker compose build --no-cache
docker compose up
```

### Database Connection Errors

```bash
# Verify postgres is healthy
docker compose ps postgres

# Check postgres logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U ppbe_user

# Verify credentials
docker compose exec postgres psql -U ppbe_user -d ppbe -c "\dt"
```

### Backend Not Responding

```bash
# Check backend health
curl http://localhost:5000/api/health

# View backend logs
docker compose logs -f backend

# Restart backend
docker compose restart backend

# Check environment variables
docker compose exec backend env | grep -E 'DATABASE|REDIS|JWT'
```

### Frontend Shows Connection Error

```bash
# Verify nginx config
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Test backend from frontend container
docker compose exec frontend wget -q -O- http://backend:5000/api/health

# Check nginx logs
docker compose logs frontend
```

### Build Failures

```bash
# Clean Docker cache
docker builder prune -a

# Check disk space
df -h

# Build with verbose output
docker compose build --progress=plain backend

# Check Dockerfile syntax
docker compose config
```

### Slow Performance

```bash
# Check resource usage
docker stats

# Increase Docker resources (Docker Desktop)
# Settings → Resources → Increase CPUs/Memory

# Check volume performance
docker volume inspect ppbe_postgres_data

# Use named volumes instead of bind mounts
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set secure `JWT_SECRET` (min 32 characters)
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Set strong `REDIS_PASSWORD`
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Review all environment variables
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up SSL/TLS termination
- [ ] Enable monitoring
- [ ] Configure health checks
- [ ] Set up alerts

### Recommended Configuration

```bash
# .env for production
NODE_ENV=production
JWT_SECRET=<64-char-random-string>
POSTGRES_PASSWORD=<strong-password>
REDIS_PASSWORD=<strong-password>
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

### SSL/TLS Setup

Use a reverse proxy (nginx/Caddy/Traefik) for SSL termination:

**nginx example:**
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Automated Backups

Create backup script `/usr/local/bin/backup-ppbe.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/backups/ppbe"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup database
docker compose -f /path/to/docker-compose.yml exec -T postgres \
    pg_dump -U ppbe_user ppbe | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup volumes
docker run --rm \
    -v ppbe_postgres_data:/data \
    -v "$BACKUP_DIR":/backup \
    alpine tar czf "/backup/volumes_$DATE.tar.gz" /data

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -mtime +30 -delete

echo "Backup completed: $DATE"
```

Add to crontab:
```bash
0 2 * * * /usr/local/bin/backup-ppbe.sh
```

### Health Monitoring

Set up health check endpoints:

```bash
# Create health check script
#!/bin/bash
HEALTH_URL="http://localhost:5000/api/health"

if curl -f -s "$HEALTH_URL" > /dev/null; then
    echo "OK"
    exit 0
else
    echo "FAIL"
    exit 1
fi
```

### Logging

Configure log rotation in `docker-compose.yml`:

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Security Best Practices

1. **Never commit `.env` files** - Use `.env.example` as template
2. **Use strong passwords** - Generate with `openssl rand -base64 32`
3. **Rotate secrets regularly** - Especially JWT_SECRET
4. **Keep images updated** - Run `docker compose pull` regularly
5. **Scan for vulnerabilities** - Use `docker scan ppbe-backend`
6. **Use non-root users** - Already configured in Dockerfiles
7. **Limit network exposure** - Use firewall rules
8. **Enable audit logging** - Monitor access and changes
9. **Regular backups** - Automate and test restore procedures
10. **SSL/TLS everywhere** - Use HTTPS for all external access

## Performance Tuning

### Database

```bash
# Increase max connections
POSTGRES_MAX_CONNECTIONS=200

# Tune shared buffers (25% of RAM)
POSTGRES_SHARED_BUFFERS=256MB
```

### Redis

```bash
# Set memory limit
REDIS_MAXMEMORY=256mb

# Set eviction policy
REDIS_MAXMEMORY_POLICY=allkeys-lru
```

### Node.js

```bash
# Increase Node.js heap size
NODE_OPTIONS=--max-old-space-size=4096
```

## FAQ

**Q: Can I use this in production?**  
A: Yes, but ensure you follow the Production Deployment checklist.

**Q: How do I update to a new version?**  
A: `git pull && docker compose build && docker compose up -d`

**Q: Where is data stored?**  
A: In Docker volumes. Use `docker volume ls` to list them.

**Q: How do I reset everything?**  
A: `docker compose down -v` (WARNING: Deletes all data!)

**Q: Can I use a different database?**  
A: Yes, modify `docker-compose.yml` and update `DATABASE_URL`.

**Q: What about Windows/Mac?**  
A: Use Docker Desktop. All commands work the same.

**Q: Why is the build so slow?**  
A: First build downloads all dependencies. Subsequent builds use cache.

**Q: How do I scale services?**  
A: `docker compose up --scale backend=3`

## Support

For issues and questions:
1. Check this guide and troubleshooting section
2. Review logs: `docker compose logs`
3. Check GitHub issues
4. Consult main README.md

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)
- [Redis Docker Guide](https://hub.docker.com/_/redis)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [React Production Build](https://react.dev/learn/start-a-new-react-project)
