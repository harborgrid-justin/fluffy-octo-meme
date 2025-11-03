# Deployment Guide

## Production Deployment Checklist

### Pre-Deployment

1. **Environment Variables**
   - Create `.env` file in backend directory
   - Set strong JWT_SECRET (minimum 32 characters)
   - Set NODE_ENV=production
   - Configure PORT if different from 5000

2. **Security Configuration**
   - Update CORS settings in `backend/server.js` to only allow production frontend URL
   - Ensure all sensitive data is in environment variables
   - Review and update Helmet security headers if needed

3. **Database Setup** (if migrating from in-memory storage)
   - Set up PostgreSQL, MongoDB, or preferred database
   - Update server.js to use database instead of in-memory arrays
   - Create migration scripts for initial schema

### Backend Deployment

#### Option 1: Traditional Server (Linux)

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Clone and setup
git clone <repository-url>
cd fluffy-octo-meme/backend
npm install --production

# 3. Create .env file
cat > .env << EOF
PORT=5000
JWT_SECRET=your-production-secret-key-here
NODE_ENV=production
EOF

# 4. Install PM2 for process management
sudo npm install -g pm2

# 5. Start application
pm2 start server.js --name ppbe-backend

# 6. Setup PM2 to start on boot
pm2 startup
pm2 save

# 7. Setup nginx reverse proxy (optional but recommended)
sudo apt-get install nginx
```

Nginx configuration (`/etc/nginx/sites-available/ppbe`):
```nginx
server {
    listen 80;
    server_name your-domain.gov;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ppbe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Option 2: Docker Deployment

Create `backend/Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t ppbe-backend ./backend
docker run -d -p 5000:5000 \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  --name ppbe-backend \
  ppbe-backend
```

#### Option 3: AWS Elastic Beanstalk

```bash
# Install EB CLI
pip install awsebcli

# Initialize
cd backend
eb init -p node.js ppbe-backend

# Create environment and deploy
eb create ppbe-production
eb deploy
```

### Frontend Deployment

#### Build Production Bundle

```bash
cd frontend
npm run build
```

This creates a `dist` folder with optimized production files.

#### Option 1: Static File Server (nginx)

```bash
# Copy build files to nginx directory
sudo cp -r dist/* /var/www/html/ppbe/

# Nginx configuration
sudo nano /etc/nginx/sites-available/ppbe-frontend
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.gov;
    root /var/www/html/ppbe;
    index index.html;

    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Option 2: AWS S3 + CloudFront

```bash
# Install AWS CLI
pip install awscli

# Create S3 bucket
aws s3 mb s3://ppbe-frontend

# Upload files
aws s3 sync dist/ s3://ppbe-frontend --delete

# Configure bucket for website hosting
aws s3 website s3://ppbe-frontend \
  --index-document index.html \
  --error-document index.html

# Create CloudFront distribution (via AWS Console)
# Point origin to S3 bucket
# Configure custom error pages to return index.html for 404s
```

#### Option 3: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd frontend
npm run build
netlify deploy --prod --dir=dist
```

#### Option 4: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel --prod
```

### SSL/TLS Configuration

#### Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.gov

# Auto-renewal is setup automatically
# Test renewal
sudo certbot renew --dry-run
```

### Monitoring and Logging

#### PM2 Monitoring

```bash
# View logs
pm2 logs ppbe-backend

# Monitor resources
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate
```

#### Application Monitoring

Consider implementing:
- **New Relic** for application performance monitoring
- **Sentry** for error tracking
- **CloudWatch** if on AWS
- **Azure Monitor** if on Azure

### Database Migration (Production Ready)

Replace in-memory storage with a database. Example with PostgreSQL:

1. Install PostgreSQL:
```bash
sudo apt-get install postgresql postgresql-contrib
```

2. Create database:
```bash
sudo -u postgres createdb ppbe
sudo -u postgres createuser ppbeuser
```

3. Update `backend/server.js` to use `pg` or an ORM like Sequelize/TypeORM

4. Example with pg:
```javascript
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: 5432,
});
```

### Backup Strategy

1. **Database Backups**:
```bash
# Daily automated backups
crontab -e
# Add: 0 2 * * * pg_dump ppbe > /backups/ppbe_$(date +\%Y\%m\%d).sql
```

2. **Application Backups**:
```bash
# Backup application files
tar -czf ppbe-backup-$(date +%Y%m%d).tar.gz /path/to/application
```

### Security Hardening

1. **Firewall Configuration**:
```bash
sudo ufw enable
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
```

2. **Rate Limiting** (nginx):
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20;
    proxy_pass http://localhost:5000;
}
```

3. **Security Headers** (already included via Helmet)

### Health Checks

Create health check endpoints:
- Backend: `GET /api/health` (already implemented)
- Configure load balancer health checks
- Set up uptime monitoring (UptimeRobot, Pingdom)

### Scaling Considerations

#### Horizontal Scaling

1. Use a load balancer (nginx, AWS ALB, HAProxy)
2. Run multiple backend instances
3. Use Redis for session storage (if sessions are used)
4. Use a shared database

Example nginx load balancing:
```nginx
upstream backend {
    server 10.0.0.1:5000;
    server 10.0.0.2:5000;
    server 10.0.0.3:5000;
}

server {
    location /api {
        proxy_pass http://backend;
    }
}
```

#### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis, Memcached)

### Disaster Recovery

1. Document all configuration
2. Keep infrastructure as code (Terraform, CloudFormation)
3. Regular backup testing
4. Documented recovery procedures
5. Offsite backup storage

### Compliance

For federal deployment:

1. **FISMA Compliance**
   - Complete security assessment
   - Obtain ATO (Authority to Operate)
   - Implement continuous monitoring

2. **FedRAMP** (if cloud-hosted)
   - Use FedRAMP authorized cloud providers
   - Follow FedRAMP security controls

3. **Access Controls**
   - Implement MFA for admin access
   - Regular access reviews
   - Audit logging

4. **Data Protection**
   - Encrypt data at rest
   - Encrypt data in transit (TLS 1.2+)
   - Regular security patching

### Post-Deployment

1. Verify all functionality works
2. Run security scans
3. Load testing
4. Monitor error rates and performance
5. Set up alerting for critical issues
6. Document deployment process
7. Train operations team

### Rollback Procedure

If deployment issues occur:

```bash
# Using PM2
pm2 reload ppbe-backend --update-env

# Or revert to previous version
git checkout <previous-version>
npm install
pm2 restart ppbe-backend

# Frontend rollback
aws s3 sync s3://ppbe-frontend-backup s3://ppbe-frontend
# Or redeploy previous version
```

### Support Contacts

Document:
- On-call engineers
- Escalation procedures
- Vendor support contacts
- Emergency procedures

## Quick Start for Development

```bash
# Backend
cd backend
npm install
npm start

# Frontend (in new terminal)
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000
Default credentials: admin / admin123
