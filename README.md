# Federal PPBE Management System

A production-ready US federal government Planning, Programming, Budgeting, and Execution (PPBE) management and administration system with full GUI.

## Overview

This comprehensive application provides federal agencies with a complete solution for managing the PPBE cycle, including:

- **Planning**: Define strategic objectives and program initiatives
- **Programming**: Allocate resources and prioritize programs
- **Budgeting**: Create, track, and manage budget allocations
- **Execution**: Monitor spending and track program execution

## Features

### Backend (Node.js/Express)
- RESTful API with comprehensive PPBE endpoints
- JWT-based authentication and authorization
- Secure password hashing with bcrypt
- Input validation and sanitization
- CORS and Helmet security middleware
- Role-based access control
- In-memory data storage (easily adaptable to database)

### Frontend (React)
- Modern, responsive UI design following US Web Design System principles
- Dashboard with real-time metrics and analytics
- Budget management interface
- Program planning and tracking
- Execution monitoring and reporting
- Intuitive data filtering and search
- Modal-based forms for data entry
- Professional color scheme and styling

## Technology Stack

**Backend:**
- Node.js
- Express.js
- JSON Web Tokens (JWT)
- bcryptjs for password hashing
- Helmet for security headers
- express-validator for input validation

**Frontend:**
- React 19
- React Router for navigation
- Axios for API calls
- Vite for fast development and building
- Modern CSS with custom properties

## Getting Started

### Prerequisites

**Option 1: Docker (Recommended)**
- Docker Engine 20.10 or higher
- Docker Compose v2.0 or higher

**Option 2: Local Development**
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL 16 (optional, for local database)
- Redis 7 (optional, for caching)

### Quick Start with Docker

The fastest way to get started is using Docker Compose:

1. Clone the repository:
```bash
git clone <repository-url>
cd fluffy-octo-meme
```

2. Copy the environment file and configure it:
```bash
cp .env.example .env
# Edit .env and set secure passwords for JWT_SECRET, POSTGRES_PASSWORD, and REDIS_PASSWORD
```

3. Start all services:
```bash
docker compose up
```

That's it! The application will be available at:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Database:** PostgreSQL on localhost:5432
- **Cache:** Redis on localhost:6379

To stop all services:
```bash
docker compose down
```

To stop and remove all data (volumes):
```bash
docker compose down -v
```

### Docker Development with Hot Reload

For development with hot reload support:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

This enables:
- Backend hot reload with ts-node-dev
- Frontend hot reload with Vite HMR
- Volume mounting for source code changes
- Node.js debugger on port 9229

### Local Installation (Without Docker)

1. Clone the repository:
```bash
git clone <repository-url>
cd fluffy-octo-meme
```

2. Install backend dependencies:
```bash
cd backend
npm install
npm run build
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the Application Locally

#### Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:5000`

#### Start the Frontend Application

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

### Default Login Credentials

- **Username:** admin
- **Password:** admin123

**⚠️ IMPORTANT:** Change these credentials in a production environment!

## API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login with username and password
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### POST /api/auth/register
Register a new user
```json
{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.gov",
  "department": "Defense",
  "role": "user"
}
```

### Budget Management Endpoints

- `GET /api/budgets` - Get all budgets (with optional filters)
- `POST /api/budgets` - Create a new budget
- `GET /api/budgets/:id` - Get a specific budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget

### Program Management Endpoints

- `GET /api/programs` - Get all programs (with optional filters)
- `POST /api/programs` - Create a new program
- `GET /api/programs/:id` - Get a specific program
- `PUT /api/programs/:id` - Update a program
- `DELETE /api/programs/:id` - Delete a program

### Execution Tracking Endpoints

- `GET /api/execution` - Get all execution records (with optional filters)
- `POST /api/execution` - Create a new execution record
- `GET /api/execution/:id` - Get a specific execution record
- `PUT /api/execution/:id` - Update an execution record

### Dashboard Endpoints

- `GET /api/dashboard/summary` - Get dashboard summary statistics
- `GET /api/dashboard/budget-by-department` - Get budget breakdown by department
- `GET /api/dashboard/execution-timeline` - Get execution timeline data

### Fiscal Year Endpoints

- `GET /api/fiscal-years` - Get all fiscal years

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Security Features

### Production Considerations

1. **Environment Variables**: Use `.env` files to manage sensitive configuration
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with production values
   ```

2. **JWT Secret**: Change the JWT_SECRET in production to a strong, random value

3. **HTTPS**: Deploy behind a reverse proxy (nginx/Apache) with SSL/TLS

4. **Database**: Replace in-memory storage with a production database (PostgreSQL, MongoDB)

5. **Input Validation**: All inputs are validated using express-validator

6. **Password Security**: Passwords are hashed using bcryptjs before storage

7. **CORS**: Configure CORS to only allow requests from trusted domains

8. **Helmet**: Security headers are automatically applied

## Docker Configuration

### Services Overview

The Docker setup includes the following services:

| Service | Description | Port | Image/Build |
|---------|-------------|------|-------------|
| **postgres** | PostgreSQL 16 database | 5432 | postgres:16-alpine |
| **redis** | Redis 7 cache | 6379 | redis:7-alpine |
| **backend** | Node.js/TypeScript API | 5000 | Built from ./backend |
| **frontend** | React app with nginx | 3000 (mapped to 80) | Built from ./frontend |
| **prometheus** | Metrics collection | 9090 | prom/prometheus (optional) |
| **grafana** | Monitoring dashboard | 3001 | grafana/grafana (optional) |

### Environment Variables

All environment variables are documented in `.env.example`. Key variables to configure:

#### Required Variables
```bash
# Security - MUST CHANGE IN PRODUCTION
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
POSTGRES_PASSWORD=changeme-use-strong-password
REDIS_PASSWORD=changeme-use-strong-password

# Application
NODE_ENV=production
PORT=5000
```

#### Optional Variables
```bash
# Database
POSTGRES_DB=ppbe
POSTGRES_USER=ppbe_user
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# Ports
BACKEND_PORT=5000
FRONTEND_PORT=3000

# Monitoring (for monitoring profile)
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
GRAFANA_USER=admin
GRAFANA_PASSWORD=admin-change-in-production
```

### Docker Commands

#### Basic Operations

```bash
# Start all services
docker compose up

# Start in detached mode (background)
docker compose up -d

# View logs
docker compose logs -f

# View logs for specific service
docker compose logs -f backend

# Stop all services
docker compose down

# Stop and remove volumes (deletes all data)
docker compose down -v

# Rebuild images
docker compose build

# Rebuild and start
docker compose up --build
```

#### Development Mode

```bash
# Start with hot reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Rebuild dev containers
docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# View dev logs
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

#### Monitoring (Optional)

Start with Prometheus and Grafana monitoring:

```bash
docker compose --profile monitoring up
```

This adds:
- Prometheus metrics at http://localhost:9090
- Grafana dashboards at http://localhost:3001

### Service Health Checks

All services include health checks:

```bash
# Check service health status
docker compose ps

# Inspect specific service health
docker inspect ppbe-backend --format='{{json .State.Health}}'
```

### Network Configuration

Services communicate over a dedicated bridge network (`ppbe-network`):
- Subnet: 172.20.0.0/16
- DNS: Services can reach each other by service name (e.g., `http://backend:5000`)

### Volume Mounts

Persistent data is stored in Docker volumes:

| Volume | Purpose | Service |
|--------|---------|---------|
| postgres_data | Database data | postgres |
| redis_data | Cache data | redis |
| backend_logs | Application logs | backend |
| prometheus_data | Metrics data | prometheus |
| grafana_data | Dashboard data | grafana |

View volumes:
```bash
docker volume ls
```

Backup a volume:
```bash
docker run --rm -v ppbe_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data
```

### Troubleshooting

#### Database Connection Issues

If backend can't connect to database:

```bash
# Check if postgres is healthy
docker compose ps postgres

# View postgres logs
docker compose logs postgres

# Verify credentials match in .env
docker compose exec postgres psql -U ppbe_user -d ppbe -c "\dt"
```

#### Frontend Can't Reach Backend

The frontend uses nginx proxy to forward API requests to the backend:

```bash
# Check nginx configuration
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Verify backend is responding
docker compose exec frontend wget -q -O- http://backend:5000/api/health
```

#### Build Failures

```bash
# Clean build cache
docker compose build --no-cache

# Remove old images
docker image prune -a

# Check build logs
docker compose build backend 2>&1 | tee build.log
```

#### Port Conflicts

If ports are already in use:

```bash
# Find process using port
lsof -i :5000

# Change port in .env
echo "BACKEND_PORT=5001" >> .env

# Restart services
docker compose up -d
```

### Production Deployment

For production deployment with Docker:

1. **Set secure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   # Use strong, random passwords
   # Set NODE_ENV=production
   ```

2. **Use production compose file:**
   ```bash
   docker compose -f docker-compose.yml up -d
   ```

3. **Enable monitoring:**
   ```bash
   docker compose --profile monitoring up -d
   ```

4. **Set up automated backups:**
   ```bash
   # Add to crontab for daily backups
   0 2 * * * cd /path/to/fluffy-octo-meme && docker compose exec -T postgres pg_dump -U ppbe_user ppbe > backup-$(date +\%Y\%m\%d).sql
   ```

5. **Configure reverse proxy** (nginx/Apache) with SSL/TLS in front of the frontend container

6. **Monitor logs and metrics:**
   ```bash
   docker compose logs -f --tail=100
   ```

## Project Structure

```
fluffy-octo-meme/
├── backend/
│   ├── server.js              # Main server file
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Header.jsx
│   │   │   └── Navigation.jsx
│   │   ├── pages/            # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Programs.jsx
│   │   │   └── Execution.jsx
│   │   ├── services/         # API services
│   │   │   └── api.js
│   │   ├── App.jsx           # Main App component
│   │   ├── main.jsx          # Entry point
│   │   └── styles.css        # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

## User Guide

### Dashboard
The dashboard provides an at-a-glance view of:
- Total budget across all programs
- Number of active programs
- Budget execution percentage
- Pending approvals
- Budget breakdown by department

### Budget Management
Create and manage budget allocations:
1. Click "New Budget" to create a budget entry
2. Fill in required fields (title, fiscal year, department, amount)
3. Set budget category and status
4. Use filters to find specific budgets

### Program Planning
Define and track federal programs:
1. Click "New Program" to create a program
2. Enter program details including budget allocation
3. Set priority level and status
4. Track program objectives and milestones

### Execution Tracking
Monitor program spending and execution:
1. Click "New Record" to log execution activity
2. Link record to a specific program
3. Enter amount spent and execution date
4. Update status (on-track, at-risk, delayed, completed)

## Deployment

### Backend Deployment

1. Set environment variables for production
2. Build and deploy to your server or cloud platform
3. Ensure Node.js is installed on the server
4. Run with process manager (PM2, systemd)

```bash
# Example with PM2
npm install -g pm2
pm2 start server.js --name ppbe-backend
```

### Frontend Deployment

1. Build the production bundle:
```bash
cd frontend
npm run build
```

2. Deploy the `dist` folder to your web server or CDN
3. Configure web server to serve `index.html` for all routes (SPA routing)

### Recommended Deployment Platforms
- AWS (EC2, Elastic Beanstalk, S3 + CloudFront)
- Azure App Service
- Google Cloud Platform
- Heroku
- DigitalOcean

## Support and Maintenance

### Troubleshooting

**Backend won't start:**
- Check that port 5000 is available
- Verify all dependencies are installed
- Check Node.js version

**Frontend can't connect to backend:**
- Ensure backend is running
- Check API URL in `frontend/src/services/api.js`
- Verify CORS settings

**Login fails:**
- Verify default credentials (admin/admin123)
- Check JWT_SECRET is set
- Check browser console for errors

## Contributing

This is a production-ready federal government application. Any modifications should:
1. Maintain security standards
2. Follow existing code patterns
3. Include appropriate documentation
4. Pass security reviews

## License

ISC

## Compliance

This system is designed with federal government requirements in mind:
- Security best practices
- Role-based access control
- Audit trails (via createdBy/updatedAt fields)
- Input validation
- Secure authentication

**Note:** Before deploying in a federal environment, ensure compliance with:
- FISMA (Federal Information Security Management Act)
- NIST security standards
- Agency-specific security requirements
- FedRAMP authorization (if cloud-hosted)