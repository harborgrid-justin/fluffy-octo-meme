# Federal PPBE System - Architecture Documentation

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [System Architecture](#system-architecture)
4. [Layer Architecture](#layer-architecture)
5. [Key Architectural Patterns](#key-architectural-patterns)
6. [Infrastructure Components](#infrastructure-components)
7. [Data Architecture](#data-architecture)
8. [Security Architecture](#security-architecture)
9. [Scalability and Performance](#scalability-and-performance)
10. [Deployment Architecture](#deployment-architecture)
11. [Disaster Recovery](#disaster-recovery)
12. [Technology Stack](#technology-stack)

---

## System Overview

The Federal PPBE (Planning, Programming, Budgeting, and Execution) system is a comprehensive, production-grade application designed to manage the entire budget lifecycle for federal agencies. The system supports multi-tenant operations, ensuring complete data isolation between different agencies and departments.

### Key Features

- **Multi-tenant architecture** with complete data isolation
- **Domain-driven design** for maintainable, scalable codebase
- **Event-driven architecture** for reactive, decoupled components
- **Distributed caching** for high performance
- **Background job processing** for async operations
- **API Gateway pattern** with rate limiting and versioning
- **Comprehensive audit logging** for compliance
- **Role-based access control** (RBAC)
- **Real-time notifications**
- **Advanced reporting and analytics**

---

## Architecture Principles

### 1. Domain-Driven Design (DDD)

The application follows DDD principles:
- **Ubiquitous Language**: Business terminology used throughout code
- **Bounded Contexts**: Clear boundaries between domains
- **Aggregates**: Consistency boundaries for transactions
- **Domain Events**: Communication between aggregates
- **Entities and Value Objects**: Rich domain models

### 2. Clean Architecture

Separation of concerns with clear dependencies:
- **Domain Layer**: Business logic (no dependencies)
- **Application Layer**: Use cases and orchestration
- **Infrastructure Layer**: External concerns (database, cache, etc.)
- **Presentation Layer**: API and UI

### 3. SOLID Principles

- **Single Responsibility**: Each module has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable
- **Interface Segregation**: Many specific interfaces vs one general
- **Dependency Inversion**: Depend on abstractions, not concretions

### 4. Microservices-Ready

Architecture designed for future microservices evolution:
- Clear service boundaries
- Domain-based decomposition
- Event-driven communication
- Independent deployability

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Load Balancer                            │
│                       (NGINX / AWS ALB)                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                        API Gateway                               │
│        (Rate Limiting, Auth, Versioning, Routing)               │
└───────┬──────────────┬──────────────┬──────────────┬───────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐
│   Budget     │ │ Program  │ │  User    │ │   Approval     │
│   Service    │ │ Service  │ │ Service  │ │   Service      │
└──────┬───────┘ └────┬─────┘ └────┬─────┘ └────────┬───────┘
       │              │             │                 │
       └──────────────┴─────────────┴─────────────────┘
                              │
       ┌──────────────────────┴────────────────────────┐
       │                                                │
       ▼                                                ▼
┌──────────────┐                              ┌─────────────────┐
│  PostgreSQL  │                              │      Redis      │
│  (Primary)   │◄────Replication────────────►│  (Cache/Queue)  │
└──────────────┘                              └─────────────────┘
       │
       ▼
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
└──────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)                   │
│        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│        │ Budget UI    │  │ Program UI   │  │ Dashboard UI │    │
│        └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API
┌─────────────────────────────▼───────────────────────────────────┐
│                    Backend (Node.js/Express)                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Presentation Layer (API)                       │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Controllers  │  │  Middleware  │  │    Routes    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │            Application Layer (Use Cases)                    │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  Use Cases   │  │     DTOs     │  │   Mappers    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │              Domain Layer (Business Logic)                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │   Entities   │  │   Services   │  │    Events    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └────────────────────────┬────────────────────────────────────┘ │
│  ┌────────────────────────▼────────────────────────────────────┐ │
│  │          Infrastructure Layer (External Services)           │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │  Database    │  │    Cache     │  │     Queue    │    │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer Architecture

### 1. Presentation Layer

**Location**: `backend/src/presentation/`

**Responsibilities**:
- HTTP request/response handling
- Authentication and authorization
- Input validation
- API versioning
- Rate limiting
- Error handling

**Key Components**:
- API Controllers
- Middleware (auth, validation, logging)
- Route definitions
- API Gateway

### 2. Application Layer

**Location**: `backend/src/application/`

**Responsibilities**:
- Use case orchestration
- Transaction management
- DTO transformation
- Input validation
- Cross-cutting concerns

**Key Components**:
- Use cases (business workflows)
- DTOs (Data Transfer Objects)
- Mappers (domain ↔ DTO)
- Validators

### 3. Domain Layer

**Location**: `backend/src/domain/`

**Responsibilities**:
- Business rules and logic
- Domain entities
- Domain events
- Repository interfaces
- Domain services

**Key Components**:
- Entities (Budget, Program, User, etc.)
- Value Objects
- Domain Events
- Repository Interfaces
- Business Rules

### 4. Infrastructure Layer

**Location**: `backend/src/infrastructure/`

**Responsibilities**:
- External service integrations
- Database access
- Caching
- Message queues
- File storage
- Email services

**Key Components**:
- Repository implementations
- Database clients (Prisma)
- Cache service (Redis)
- Queue service (Bull)
- Event bus
- External API clients

---

## Key Architectural Patterns

### 1. Repository Pattern

Abstracts data access logic:

```typescript
// Domain layer defines interface
interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  findAll(filters: BudgetFilters): Promise<Budget[]>;
  save(budget: Budget): Promise<void>;
  delete(id: string): Promise<void>;
}

// Infrastructure layer implements
class PrismaBudgetRepository implements IBudgetRepository {
  // Implementation using Prisma
}
```

### 2. Unit of Work Pattern

Manages transactions across multiple repositories:

```typescript
class UnitOfWork {
  async execute<T>(work: () => Promise<T>): Promise<T> {
    return await prisma.$transaction(async () => {
      return await work();
    });
  }
}
```

### 3. CQRS (Command Query Responsibility Segregation)

Separates read and write operations:

```typescript
// Command - modifies state
class CreateBudgetCommand {
  async execute(dto: CreateBudgetDTO): Promise<Budget> {
    const budget = Budget.create(dto);
    await this.repository.save(budget);
    await this.eventBus.publish(new BudgetCreatedEvent(budget));
    return budget;
  }
}

// Query - reads state
class GetBudgetQuery {
  async execute(id: string): Promise<BudgetDTO> {
    const budget = await this.repository.findById(id);
    return BudgetMapper.toDTO(budget);
  }
}
```

### 4. Event Sourcing

Store all changes as events (future enhancement):

```typescript
class Budget {
  private events: DomainEvent[] = [];

  approve(approver: User): void {
    // Business logic
    this.status = 'approved';

    // Record event
    this.events.push(new BudgetApprovedEvent(this, approver));
  }

  static fromEvents(events: DomainEvent[]): Budget {
    const budget = new Budget();
    events.forEach(event => budget.apply(event));
    return budget;
  }
}
```

### 5. Saga Pattern

Manage distributed transactions (future enhancement):

```typescript
class BudgetApprovalSaga {
  async execute(budgetId: string): Promise<void> {
    try {
      // Step 1: Approve budget
      await this.budgetService.approve(budgetId);

      // Step 2: Update fiscal year
      await this.fiscalYearService.updateAllocation(budgetId);

      // Step 3: Send notifications
      await this.notificationService.notifyApproval(budgetId);
    } catch (error) {
      // Compensate (rollback)
      await this.compensate(budgetId);
      throw error;
    }
  }
}
```

---

## Infrastructure Components

### 1. Database Layer

**Technology**: PostgreSQL 14+

**Features**:
- ACID transactions
- Row-level security (RLS) for multi-tenancy
- JSON/JSONB support for flexible data
- Full-text search
- Triggers and stored procedures
- Replication for read scaling

**Schema Design**:
- Normalized to 3NF
- Proper indexing strategy
- Foreign key constraints
- Check constraints for data integrity
- Audit trail tables

**File**: `backend/database/schema.sql`

### 2. Caching Layer

**Technology**: Redis 7+

**Use Cases**:
- Session storage
- Query result caching
- Rate limiting counters
- Distributed locks
- Real-time data

**Caching Strategies**:
- **Cache-Aside**: Load on demand
- **Write-Through**: Update cache on write
- **Write-Behind**: Async cache updates
- **Cache Invalidation**: Event-driven

**File**: `backend/src/infrastructure/cache/CacheService.ts`

### 3. Message Queue

**Technology**: Bull/BullMQ (Redis-backed)

**Use Cases**:
- Background job processing
- Report generation
- Email notifications
- Data imports/exports
- Scheduled tasks

**Queue Types**:
- Critical (high priority)
- Standard (normal priority)
- Bulk (low priority)

**File**: `backend/src/infrastructure/queue/QueueManager.ts`

### 4. Event Bus

**Technology**: Custom EventEmitter-based

**Use Cases**:
- Domain event publishing
- Cross-aggregate communication
- Async workflow triggering
- Audit logging
- Real-time notifications

**File**: `backend/src/infrastructure/events/EventBus.ts`

---

## Data Architecture

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Tenant     │────────►│Organization  │◄────────│    User     │
└─────────────┘         └──────┬───────┘         └──────┬──────┘
                               │                         │
                               │                         │
                        ┌──────▼───────┐         ┌──────▼──────┐
                        │ Fiscal Year  │         │  Approval   │
                        └──────┬───────┘         └─────────────┘
                               │
                        ┌──────▼───────┐
                        │   Program    │
                        └──────┬───────┘
                               │
                        ┌──────▼───────┐
                        │   Budget     │
                        └──────┬───────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          ┌──────▼───────┐           ┌──────▼────────┐
          │Budget Line   │           │  Obligation   │
          │   Items      │           └───────┬───────┘
          └──────────────┘                   │
                                      ┌──────▼────────┐
                                      │ Expenditure   │
                                      └───────────────┘
```

### Data Flow

```
User Request
     │
     ▼
API Gateway (Authentication, Rate Limiting)
     │
     ▼
Controller (Request Validation)
     │
     ▼
Use Case (Business Logic)
     │
     ├────►Repository (Cache Check)
     │           │
     │           ├─ Cache Hit ──► Return Cached Data
     │           │
     │           └─ Cache Miss
     │                  │
     │                  ▼
     │           Database Query
     │                  │
     │                  ▼
     │           Update Cache
     │                  │
     │◄─────────────────┘
     │
     ▼
Domain Event Publishing
     │
     ▼
Event Handlers (Side Effects)
     │
     ▼
Response to User
```

---

## Security Architecture

### 1. Authentication

**Strategy**: JWT (JSON Web Tokens)

```typescript
// Token structure
{
  userId: string;
  username: string;
  role: string;
  tenantId: string;
  exp: number; // Expiration
  iat: number; // Issued at
}
```

**Features**:
- Access tokens (short-lived, 15 minutes)
- Refresh tokens (long-lived, 7 days)
- Token rotation on refresh
- Secure HTTP-only cookies
- CSRF protection

### 2. Authorization

**Strategy**: Role-Based Access Control (RBAC)

**Roles**:
- `super_admin`: Full system access
- `admin`: Organization-level admin
- `budget_analyst`: Budget management
- `program_manager`: Program management
- `approver`: Approval authority
- `auditor`: Read-only access
- `user`: Basic access

**Permissions**:
```typescript
const permissions = {
  'budget:create': ['admin', 'budget_analyst'],
  'budget:read': ['admin', 'budget_analyst', 'auditor', 'user'],
  'budget:update': ['admin', 'budget_analyst'],
  'budget:delete': ['admin'],
  'budget:approve': ['approver', 'admin'],
};
```

### 3. Multi-Tenant Security

**Isolation Levels**:
1. **Database Level**: Row-Level Security (RLS)
2. **Application Level**: Tenant context injection
3. **API Level**: Tenant identification and validation
4. **Cache Level**: Tenant-prefixed keys
5. **Queue Level**: Tenant context in jobs

See: `MULTI-TENANT-ARCHITECTURE.md`

### 4. Data Encryption

**At Rest**:
- Database encryption (PostgreSQL TDE)
- Encrypted file storage
- Encrypted backups

**In Transit**:
- TLS 1.3 for all connections
- Certificate pinning
- Perfect forward secrecy

### 5. Audit Logging

**Logged Events**:
- All data modifications
- Authentication attempts
- Authorization failures
- Admin actions
- Cross-tenant access

**Audit Record**:
```typescript
{
  id: string;
  tenantId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: object;
  newValues: object;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}
```

---

## Scalability and Performance

### 1. Horizontal Scaling

**Application Servers**:
- Stateless application design
- Load balancer distribution
- Auto-scaling based on CPU/memory
- Health check endpoints

**Database**:
- Read replicas for read scaling
- Connection pooling
- Query optimization
- Proper indexing

### 2. Caching Strategy

**Multi-Level Cache**:
1. **L1 Cache**: In-memory (application)
2. **L2 Cache**: Redis (distributed)
3. **L3 Cache**: CDN (static assets)

**Cache Hierarchy**:
```
Request
  │
  ▼
L1 Cache (Memory) ──Hit──► Return
  │ Miss
  ▼
L2 Cache (Redis) ──Hit──► Update L1 ──► Return
  │ Miss
  ▼
Database ──► Update L2 & L1 ──► Return
```

### 3. Performance Optimization

**Database**:
- Proper indexing
- Query optimization
- Connection pooling
- Prepared statements
- Batch operations

**API**:
- Response compression (gzip)
- Pagination for large datasets
- Field selection (GraphQL-style)
- ETags for caching
- Rate limiting

**Frontend**:
- Code splitting
- Lazy loading
- Service workers
- Asset optimization
- CDN distribution

### 4. Monitoring

**Metrics**:
- Request rate and latency
- Error rate
- Database query performance
- Cache hit ratio
- Queue depth
- Memory and CPU usage

**Tools**:
- Prometheus (metrics collection)
- Grafana (visualization)
- ELK Stack (logging)
- Sentry (error tracking)

---

## Deployment Architecture

### 1. Container Architecture

**Docker Containers**:
```
├── backend
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend
│   ├── Dockerfile
│   └── nginx.conf
├── database
│   └── Dockerfile
└── redis
    └── redis.conf
```

### 2. Orchestration

**Kubernetes** (Production):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ppbe-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ppbe-backend
  template:
    spec:
      containers:
      - name: backend
        image: ppbe-backend:latest
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

### 3. CI/CD Pipeline

```
Code Push
    │
    ▼
GitHub Actions
    │
    ├──► Lint & Format
    ├──► Unit Tests
    ├──► Integration Tests
    ├──► Security Scan
    ├──► Build Docker Image
    │
    ▼
Push to Registry
    │
    ▼
Deploy to Environment
    │
    ├──► Development (auto)
    ├──► Staging (auto)
    └──► Production (manual approval)
```

### 4. Environment Strategy

**Development**:
- Local Docker Compose
- Hot reload enabled
- Debug logging
- Test data

**Staging**:
- Kubernetes cluster
- Production-like data
- Performance testing
- UAT environment

**Production**:
- Kubernetes cluster (HA)
- Multiple availability zones
- Auto-scaling enabled
- Blue-green deployment

---

## Disaster Recovery

### 1. Backup Strategy

**Database Backups**:
- Full backup: Daily (retained 30 days)
- Incremental: Hourly (retained 7 days)
- Point-in-time recovery: 30 days
- Off-site replication: AWS S3 Glacier

**Application Backups**:
- Docker images: Tagged and versioned
- Configuration: Version controlled
- Secrets: Encrypted in vault

### 2. Recovery Procedures

**Recovery Time Objectives (RTO)**:
- Critical systems: 1 hour
- Non-critical systems: 4 hours

**Recovery Point Objectives (RPO)**:
- Transactional data: 15 minutes
- Analytical data: 1 hour

### 3. High Availability

**Architecture**:
- Multi-AZ deployment
- Load balancer failover
- Database replication
- Redis Sentinel (HA)
- Regular failover testing

**Failure Scenarios**:
1. Single server failure → Load balancer redirects
2. Database failure → Failover to replica
3. Redis failure → Degraded mode (no cache)
4. AZ failure → Traffic routes to other AZ

---

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 18+ | JavaScript runtime |
| Framework | Express 5 | Web framework |
| Language | TypeScript 5 | Type safety |
| ORM | Prisma 5 | Database access |
| Database | PostgreSQL 14+ | Primary database |
| Cache | Redis 7+ | Caching and sessions |
| Queue | Bull/BullMQ | Background jobs |
| Auth | JWT | Authentication |
| Validation | Zod | Schema validation |
| Testing | Vitest, Jest | Unit/Integration tests |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 | UI framework |
| Language | TypeScript 5 | Type safety |
| Build Tool | Vite 4 | Fast build tool |
| State Management | Zustand/Redux | Global state |
| UI Library | Tailwind CSS | Styling |
| HTTP Client | Axios | API requests |
| Testing | Vitest, React Testing Library | Component tests |

### Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Containerization | Docker | Application containers |
| Orchestration | Kubernetes | Container orchestration |
| Load Balancer | NGINX / AWS ALB | Traffic distribution |
| CI/CD | GitHub Actions | Automation pipeline |
| Monitoring | Prometheus + Grafana | Metrics and dashboards |
| Logging | ELK Stack | Centralized logging |
| Error Tracking | Sentry | Error monitoring |

---

## Conclusion

This architecture provides a solid foundation for a production-grade federal PPBE system. The design emphasizes:

- **Scalability**: Horizontal scaling capabilities
- **Maintainability**: Clean separation of concerns
- **Security**: Multi-layered security approach
- **Performance**: Comprehensive caching strategy
- **Reliability**: High availability and disaster recovery
- **Flexibility**: Easy to extend and modify

### Next Steps

1. Implement remaining use cases
2. Add comprehensive test coverage
3. Set up monitoring and alerting
4. Perform security audit
5. Conduct load testing
6. Create operational runbooks
7. Train operations team

### Related Documentation

- [Multi-Tenant Architecture](MULTI-TENANT-ARCHITECTURE.md)
- [Domain-Driven Design Guide](backend/src/README.md)
- [API Documentation](API.md) (to be created)
- [Security Guidelines](SECURITY.md)
- [Deployment Guide](DEPLOYMENT.md)
- [User Guide](USER_GUIDE.md)
