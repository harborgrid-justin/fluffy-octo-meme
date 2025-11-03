# PPBE Backend - TypeScript API

Production-grade TypeScript backend for the federal Planning, Programming, Budgeting, and Execution (PPBE) Management System.

## Features Implemented

This backend implements **25 production-grade features** (BE-001 through BE-025):

### Core Features
1. **BE-001**: User Management API (CRUD with roles)
2. **BE-002**: Authentication Service (JWT + refresh tokens)
3. **BE-003**: Authorization Service (RBAC implementation)
4. **BE-004**: Budget Allocation API (complete CRUD)
5. **BE-005**: Budget Line Item Management API
6. **BE-006**: Fiscal Year Management API
7. **BE-007**: Program Element Management API
8. **BE-008**: Organization Hierarchy API

### Workflow & Approval
9. **BE-009**: Approval Workflow Engine
10. **BE-010**: Multi-level Approval Routing

### Audit & Documentation
11. **BE-011**: Audit Logging Service
12. **BE-012**: Document Upload/Attachment Service
13. **BE-013**: Report Generation Service
14. **BE-014**: Export Service (Excel, PDF, CSV)

### Version Control & Collaboration
15. **BE-015**: Budget Version Control/History
16. **BE-016**: Comment/Collaboration Service
17. **BE-017**: Notification Service
18. **BE-018**: Search and Filtering Service

### Financial Tracking
19. **BE-019**: Obligation Tracking API
20. **BE-020**: Expenditure Tracking API
21. **BE-021**: Budget vs Actual Variance API

### Validation & Control
22. **BE-022**: Appropriation Validation Service
23. **BE-023**: Fund Availability Checking

### Data Management
24. **BE-024**: Bulk Import/Export Service
25. **BE-025**: Data Validation Service (Zod schemas)

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.x
- **Validation**: Zod 3.x
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, bcryptjs, rate-limiting
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier

## Project Structure

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic (25 features)
│   ├── middleware/        # Auth, validation, error handling
│   ├── routes/            # API route definitions
│   ├── types/             # TypeScript type definitions
│   ├── validation/        # Zod schemas
│   ├── docs/              # OpenAPI specification
│   └── server.ts          # Main application entry
├── dist/                  # Compiled JavaScript (generated)
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
└── API_DOCUMENTATION.md   # Complete API documentation
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` with your configuration (especially JWT secrets for production)

### Development

Run in development mode with hot reload:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Build

Compile TypeScript to JavaScript:
```bash
npm run build
```

### Production

Start the production server:
```bash
npm start
```

### Other Scripts

```bash
npm run watch         # Watch mode compilation
npm run typecheck     # Type checking without compilation
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
npm test              # Run tests
npm run test:coverage # Run tests with coverage
```

## Default Credentials

The system initializes with three default users:

| Username | Password    | Role            |
|----------|-------------|-----------------|
| admin    | admin123    | Administrator   |
| analyst  | analyst123  | Budget Analyst  |
| manager  | manager123  | Program Manager |

**IMPORTANT**: Change these passwords immediately in production!

## API Documentation

Complete API documentation is available in:
- `API_DOCUMENTATION.md` - Detailed endpoint documentation
- `src/docs/openapi.json` - OpenAPI 3.0 specification

### Quick Start

1. **Login**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

2. **Get Budgets**:
```bash
curl http://localhost:5000/api/budgets \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Architecture

### Layered Architecture

1. **Routes Layer** (`src/routes/`)
   - Defines API endpoints
   - Applies middleware (auth, validation, audit)
   - Maps to controllers

2. **Controllers Layer** (`src/controllers/`)
   - Handles HTTP requests/responses
   - Delegates to services
   - Formats API responses

3. **Services Layer** (`src/services/`)
   - Contains business logic
   - Implements 25 core features
   - Data access and manipulation

4. **Middleware Layer** (`src/middleware/`)
   - Authentication (JWT)
   - Authorization (RBAC)
   - Request validation (Zod)
   - Error handling
   - Audit logging

5. **Data Layer** (`src/services/dataStore.ts`)
   - In-memory storage (development)
   - Ready for database integration

### Security Features

- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived session management
- **RBAC**: Role-based access control on all endpoints
- **Rate Limiting**: DDoS protection
- **Helmet.js**: Security headers
- **Bcrypt**: Password hashing
- **Zod Validation**: Request data validation
- **Audit Logging**: Complete activity tracking
- **CORS**: Configurable cross-origin access

### Key Design Patterns

- **Repository Pattern**: Data access abstraction
- **Service Pattern**: Business logic encapsulation
- **Factory Pattern**: Object creation
- **Middleware Pattern**: Request processing pipeline
- **Observer Pattern**: Event-driven notifications

## Environment Variables

See `.env.example` for all available configuration options.

Critical variables for production:
- `NODE_ENV=production`
- `JWT_SECRET` - Strong random secret
- `JWT_REFRESH_SECRET` - Different strong random secret
- `CORS_ORIGIN` - Your frontend URL
- `PORT` - Server port

## Production Deployment

### Checklist

- [ ] Change all default passwords
- [ ] Set strong JWT secrets
- [ ] Configure CORS_ORIGIN
- [ ] Replace in-memory storage with database
- [ ] Set up file storage for documents
- [ ] Configure SSL/TLS
- [ ] Set up reverse proxy (nginx)
- [ ] Enable monitoring and logging
- [ ] Configure backups
- [ ] Set up CI/CD pipeline

### Database Integration

The current implementation uses in-memory storage. For production:

1. Install database driver (e.g., pg for PostgreSQL)
2. Replace `dataStore.ts` with database repository
3. Run migrations
4. Update connection configuration

### Recommended Stack

- **Database**: PostgreSQL
- **Cache**: Redis
- **File Storage**: S3 or similar
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK Stack
- **Container**: Docker
- **Orchestration**: Kubernetes

## Testing

The backend includes a comprehensive test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run with UI
npm run test:ui
```

## API Rate Limits

- General API: 100 requests per 15 minutes per IP
- Authentication: 5 requests per 15 minutes per IP

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error"
    }
  ]
}
```

## Logging

Development: Console logging
Production: Configure Winston for file/stream logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

ISC

## Support

For issues or questions:
- Create a GitHub issue
- Contact: support@ppbe.gov

## Roadmap

- [ ] Database integration (PostgreSQL)
- [ ] Redis caching
- [ ] WebSocket support for real-time updates
- [ ] GraphQL API
- [ ] Advanced analytics
- [ ] Machine learning integration
- [ ] Mobile API optimizations
- [ ] Multi-tenancy support
