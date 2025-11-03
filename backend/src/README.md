# Backend Architecture - Domain-Driven Design (DDD)

## Overview

This backend follows a **Domain-Driven Design (DDD)** architecture with clear separation of concerns across four main layers:

1. **Domain Layer** - Business logic and entities
2. **Application Layer** - Use cases and orchestration
3. **Infrastructure Layer** - External services and implementations
4. **Presentation Layer** - API endpoints and HTTP handling

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│           (API Routes, Middleware, Controllers)          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                  Application Layer                       │
│         (Use Cases, DTOs, Mappers, Validators)          │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                    Domain Layer                          │
│     (Entities, Value Objects, Domain Services,           │
│      Business Rules, Aggregates)                         │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│               Infrastructure Layer                       │
│    (Database, Cache, Events, Queue, External APIs)      │
└─────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/src/
├── domain/                          # Domain Layer (Business Logic)
│   ├── budgets/                     # Budget aggregate
│   │   ├── Budget.ts                # Budget entity
│   │   ├── BudgetLineItem.ts        # Line item entity
│   │   ├── BudgetRepository.ts      # Repository interface
│   │   ├── BudgetService.ts         # Domain service
│   │   └── BudgetValidation.ts      # Domain validation rules
│   ├── programs/                    # Program aggregate
│   │   ├── Program.ts
│   │   ├── ProgramRepository.ts
│   │   └── ProgramService.ts
│   ├── fiscal-years/                # Fiscal year aggregate
│   ├── organizations/               # Organization aggregate
│   ├── users/                       # User aggregate
│   ├── approvals/                   # Approval workflow
│   ├── obligations/                 # Financial obligations
│   ├── expenditures/                # Expenditure tracking
│   └── shared/                      # Shared domain concepts
│       ├── Entity.ts                # Base entity
│       ├── ValueObject.ts           # Base value object
│       ├── DomainEvent.ts           # Domain events
│       └── Result.ts                # Result pattern
│
├── application/                     # Application Layer (Use Cases)
│   ├── use-cases/                   # Application use cases
│   │   ├── budgets/
│   │   │   ├── CreateBudget.ts
│   │   │   ├── UpdateBudget.ts
│   │   │   ├── ApproveBudget.ts
│   │   │   └── GetBudgetDetails.ts
│   │   ├── programs/
│   │   ├── approvals/
│   │   └── reports/
│   ├── dtos/                        # Data Transfer Objects
│   │   ├── BudgetDTO.ts
│   │   ├── ProgramDTO.ts
│   │   └── UserDTO.ts
│   ├── mappers/                     # Entity to DTO mappers
│   │   ├── BudgetMapper.ts
│   │   └── ProgramMapper.ts
│   └── validators/                  # Input validation
│       ├── BudgetValidator.ts
│       └── ProgramValidator.ts
│
├── infrastructure/                  # Infrastructure Layer
│   ├── database/                    # Database implementations
│   │   ├── PrismaClient.ts
│   │   ├── repositories/            # Repository implementations
│   │   │   ├── PrismaBudgetRepository.ts
│   │   │   ├── PrismaProgramRepository.ts
│   │   │   └── PrismaUserRepository.ts
│   │   └── migrations/
│   ├── cache/                       # Caching layer
│   │   ├── RedisClient.ts
│   │   ├── CacheService.ts
│   │   └── CacheKeys.ts
│   ├── events/                      # Event system
│   │   ├── EventBus.ts
│   │   ├── EventHandler.ts
│   │   └── handlers/
│   │       ├── BudgetApprovedHandler.ts
│   │       └── ProgramCreatedHandler.ts
│   ├── queue/                       # Background jobs
│   │   ├── QueueManager.ts
│   │   ├── JobProcessor.ts
│   │   └── jobs/
│   │       ├── GenerateReportJob.ts
│   │       ├── SendNotificationJob.ts
│   │       └── BudgetCalculationJob.ts
│   ├── logging/                     # Logging infrastructure
│   │   ├── Logger.ts
│   │   └── LoggerConfig.ts
│   └── monitoring/                  # Monitoring and metrics
│       ├── MetricsCollector.ts
│       └── HealthCheck.ts
│
└── presentation/                    # Presentation Layer (API)
    ├── api/                         # API controllers
    │   ├── v1/                      # API version 1
    │   │   ├── budgets/
    │   │   │   └── BudgetController.ts
    │   │   ├── programs/
    │   │   │   └── ProgramController.ts
    │   │   ├── users/
    │   │   └── reports/
    │   └── v2/                      # API version 2 (future)
    ├── middleware/                  # HTTP middleware
    │   ├── authentication.ts
    │   ├── authorization.ts
    │   ├── validation.ts
    │   ├── errorHandler.ts
    │   ├── rateLimiter.ts
    │   ├── tenantContext.ts
    │   └── auditLogger.ts
    └── routes/                      # Route definitions
        ├── v1/
        │   ├── budgetRoutes.ts
        │   ├── programRoutes.ts
        │   ├── userRoutes.ts
        │   └── index.ts
        └── index.ts
```

## Layer Responsibilities

### 1. Domain Layer

**Purpose**: Contains the core business logic and rules of the PPBE system.

**Responsibilities**:
- Define domain entities (Budget, Program, FiscalYear, etc.)
- Implement business rules and validation
- Define repository interfaces (contracts)
- Define domain events
- Implement domain services for complex business logic

**Rules**:
- NO dependencies on other layers
- NO external dependencies (database, HTTP, etc.)
- Pure business logic only
- Framework-agnostic

**Example**:
```typescript
// domain/budgets/Budget.ts
export class Budget extends Entity {
  constructor(
    public readonly id: string,
    public title: string,
    public amount: number,
    public status: BudgetStatus
  ) {
    super(id);
    this.validate();
  }

  approve(approver: User): Result<void> {
    if (!approver.hasRole('approver')) {
      return Result.fail('User lacks approval authority');
    }

    if (this.status !== BudgetStatus.PENDING_APPROVAL) {
      return Result.fail('Budget is not in approvable state');
    }

    this.status = BudgetStatus.APPROVED;
    this.addDomainEvent(new BudgetApprovedEvent(this));

    return Result.ok();
  }
}
```

### 2. Application Layer

**Purpose**: Orchestrates domain logic to fulfill application use cases.

**Responsibilities**:
- Define use cases (CreateBudget, ApproveBudget, etc.)
- Coordinate between domain and infrastructure
- Handle DTOs and data transformation
- Input validation
- Transaction management

**Rules**:
- Can depend on Domain layer
- Can depend on Infrastructure interfaces (not implementations)
- NO HTTP-specific code
- NO database-specific code

**Example**:
```typescript
// application/use-cases/budgets/CreateBudget.ts
export class CreateBudgetUseCase {
  constructor(
    private budgetRepository: IBudgetRepository,
    private eventBus: IEventBus
  ) {}

  async execute(dto: CreateBudgetDTO): Promise<Result<Budget>> {
    // Validate input
    const validationResult = BudgetValidator.validate(dto);
    if (validationResult.isFailure) {
      return Result.fail(validationResult.error);
    }

    // Create domain entity
    const budget = Budget.create(dto);

    // Persist
    await this.budgetRepository.save(budget);

    // Publish events
    await this.eventBus.publishAll(budget.domainEvents);

    return Result.ok(budget);
  }
}
```

### 3. Infrastructure Layer

**Purpose**: Provides concrete implementations of infrastructure concerns.

**Responsibilities**:
- Implement repository interfaces
- Database access (Prisma)
- Caching (Redis)
- Message queues (Bull)
- External API integrations
- File storage
- Email services
- Logging and monitoring

**Rules**:
- Implements interfaces defined in Domain/Application layers
- Can depend on Domain and Application layers
- Contains all external dependencies

**Example**:
```typescript
// infrastructure/database/repositories/PrismaBudgetRepository.ts
export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Budget | null> {
    const data = await this.prisma.budget.findUnique({
      where: { id },
      include: { lineItems: true }
    });

    return data ? BudgetMapper.toDomain(data) : null;
  }

  async save(budget: Budget): Promise<void> {
    const data = BudgetMapper.toPersistence(budget);
    await this.prisma.budget.upsert({
      where: { id: budget.id },
      create: data,
      update: data
    });
  }
}
```

### 4. Presentation Layer

**Purpose**: Handles HTTP requests and responses.

**Responsibilities**:
- Define API routes
- Handle HTTP requests/responses
- Authentication and authorization
- Request validation
- Error handling
- Rate limiting
- API versioning

**Rules**:
- Can depend on Application layer
- HTTP-specific code only in this layer
- Thin layer - delegates to use cases

**Example**:
```typescript
// presentation/api/v1/budgets/BudgetController.ts
export class BudgetController {
  constructor(
    private createBudgetUseCase: CreateBudgetUseCase,
    private getBudgetUseCase: GetBudgetUseCase
  ) {}

  async create(req: Request, res: Response): Promise<void> {
    const dto = req.body;
    const result = await this.createBudgetUseCase.execute(dto);

    if (result.isFailure) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.status(201).json(BudgetMapper.toDTO(result.value));
  }
}
```

## Key Patterns Used

### 1. Repository Pattern
Abstracts data access logic.

```typescript
// Domain layer defines interface
interface IBudgetRepository {
  findById(id: string): Promise<Budget | null>;
  save(budget: Budget): Promise<void>;
  delete(id: string): Promise<void>;
}

// Infrastructure layer implements it
class PrismaBudgetRepository implements IBudgetRepository {
  // Implementation using Prisma
}
```

### 2. Result Pattern
Type-safe error handling without exceptions.

```typescript
class Result<T> {
  isSuccess: boolean;
  isFailure: boolean;
  value?: T;
  error?: string;

  static ok<U>(value?: U): Result<U> { ... }
  static fail<U>(error: string): Result<U> { ... }
}
```

### 3. Domain Events
Decoupled communication between aggregates.

```typescript
class BudgetApprovedEvent extends DomainEvent {
  constructor(public budget: Budget) {
    super();
  }
}

// Handlers in infrastructure layer
class BudgetApprovedHandler implements IEventHandler {
  async handle(event: BudgetApprovedEvent): Promise<void> {
    // Send notifications
    // Update related aggregates
    // Trigger workflows
  }
}
```

### 4. Dependency Injection
Loose coupling and testability.

```typescript
// Using a DI container
container.register('IBudgetRepository', PrismaBudgetRepository);
container.register('CreateBudgetUseCase', CreateBudgetUseCase);
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each layer has a single, well-defined purpose
2. **Testability**: Easy to unit test domain logic without infrastructure
3. **Flexibility**: Easy to swap implementations (e.g., different databases)
4. **Maintainability**: Clear structure makes code easier to understand
5. **Scalability**: Can evolve to microservices if needed
6. **Domain Focus**: Business logic is central and protected
7. **Technology Independence**: Domain layer is framework-agnostic

## Development Workflow

### Creating a New Feature

1. **Domain Layer**: Define entities, value objects, and business rules
2. **Application Layer**: Create use cases and DTOs
3. **Infrastructure Layer**: Implement repositories and external services
4. **Presentation Layer**: Create controllers and routes
5. **Tests**: Write tests for each layer

### Example: Adding "Budget Approval" Feature

```typescript
// 1. Domain Layer
class Budget {
  approve(approver: User): Result<void> {
    // Business rules
  }
}

// 2. Application Layer
class ApproveBudgetUseCase {
  execute(budgetId: string, approverId: string): Promise<Result<void>> {
    // Orchestrate approval process
  }
}

// 3. Infrastructure Layer
class PrismaBudgetRepository {
  // Already implemented, no changes needed
}

// 4. Presentation Layer
class BudgetController {
  async approve(req: Request, res: Response): Promise<void> {
    // Handle HTTP request
  }
}
```

## Anti-Patterns to Avoid

1. **Domain Logic in Controllers**: Keep controllers thin
2. **Database Logic in Domain**: Domain should be persistence-ignorant
3. **Circular Dependencies**: Maintain clear dependency direction
4. **God Objects**: Keep entities focused and cohesive
5. **Anemic Domain Model**: Entities should have behavior, not just data
6. **Infrastructure Leakage**: Don't let infrastructure concerns leak into domain

## Testing Strategy

- **Domain Layer**: Pure unit tests (no mocks needed)
- **Application Layer**: Unit tests with mocked repositories
- **Infrastructure Layer**: Integration tests with real databases
- **Presentation Layer**: API integration tests

## Additional Resources

- [Domain-Driven Design by Eric Evans](https://www.amazon.com/Domain-Driven-Design-Tackling-Complexity-Software/dp/0321125215)
- [Clean Architecture by Robert Martin](https://www.amazon.com/Clean-Architecture-Craftsmans-Software-Structure/dp/0134494164)
- [Microsoft DDD Architecture Guide](https://docs.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/)

## Migration Plan

The current `server.js` will be gradually refactored into this architecture:

1. Create domain entities from in-memory data structures
2. Extract use cases from route handlers
3. Implement repositories with Prisma
4. Move routes to presentation layer
5. Add middleware and proper error handling
6. Implement caching and event system
7. Add background job processing
