# Event-Driven Architecture

## Overview

This directory contains the event-driven architecture implementation for the Federal PPBE system. Events are used to decouple components and enable reactive, scalable architecture.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Domain    │ ──────> │  Event Bus   │ ──────> │  Handlers   │
│  (Emitter)  │ Publish │  (Mediator)  │Subscribe│ (Consumers) │
└─────────────┘         └──────────────┘         └─────────────┘
```

## Components

### 1. Event Bus (`EventBus.ts`)
Central event dispatcher that routes domain events to registered handlers.

Features:
- Synchronous and asynchronous event handling
- Multiple handlers per event type
- Error handling and logging
- Event replay capability

### 2. Event Handlers (`handlers/`)
Specialized handlers that react to specific domain events.

Examples:
- `BudgetApprovedHandler.ts` - Handles budget approval side effects
- `ProgramCreatedHandler.ts` - Handles new program creation
- `UserRegisteredHandler.ts` - Handles new user registration

### 3. Domain Events (defined in domain layer)
Events represent significant occurrences in the domain.

Examples:
- `BudgetApprovedEvent`
- `BudgetRejectedEvent`
- `ProgramCreatedEvent`
- `ObligationRecordedEvent`

## Event Flow

1. **Domain Event Creation**
   ```typescript
   // In domain entity
   class Budget extends Entity {
     approve(approver: User): Result<void> {
       // Business logic
       this.status = BudgetStatus.APPROVED;

       // Create and add event
       this.addDomainEvent(new BudgetApprovedEvent(this));

       return Result.ok();
     }
   }
   ```

2. **Event Publishing**
   ```typescript
   // In application use case
   class ApproveBudgetUseCase {
     async execute(budgetId: string, approverId: string): Promise<Result<void>> {
       const budget = await this.budgetRepository.findById(budgetId);
       const approver = await this.userRepository.findById(approverId);

       const result = budget.approve(approver);

       await this.budgetRepository.save(budget);

       // Publish all domain events
       await this.eventBus.publishAll(budget.domainEvents);
       budget.clearEvents();

       return result;
     }
   }
   ```

3. **Event Handling**
   ```typescript
   // Handler reacts to event
   class BudgetApprovedHandler implements IDomainEventHandler<BudgetApprovedEvent> {
     async handle(event: BudgetApprovedEvent): Promise<void> {
       // Send notifications
       // Update related aggregates
       // Trigger workflows
       // Generate reports
     }
   }
   ```

## Event Types

### Business Events
Events that represent business occurrences:
- Budget lifecycle events (created, approved, rejected, executed)
- Program lifecycle events
- Approval workflow events
- Financial transaction events

### Integration Events
Events for cross-system integration:
- External system notifications
- Data synchronization events
- Report generation triggers

### System Events
Technical/infrastructure events:
- User authentication events
- Cache invalidation events
- Background job events

## Handler Registration

Handlers are registered at application startup:

```typescript
// In application bootstrap
const eventBus = getEventBus();

// Register handlers
eventBus.subscribe('BudgetApproved', new BudgetApprovedHandler(
  notificationService,
  auditLogService,
  fiscalYearRepository
));

eventBus.subscribe('ProgramCreated', new ProgramCreatedHandler(
  notificationService
));
```

## Best Practices

### 1. Event Naming
- Use past tense (e.g., `BudgetApproved`, not `BudgetApprove`)
- Be specific and descriptive
- Include context in event name

### 2. Event Data
- Include only essential data in events
- Events should be immutable
- Include timestamp and event ID
- Include aggregate ID for traceability

### 3. Handler Implementation
- Handlers should be idempotent (safe to execute multiple times)
- Keep handlers focused on single responsibility
- Handle errors gracefully
- Log all handler executions
- Avoid long-running operations (use background jobs instead)

### 4. Asynchronous Processing
- Use async handlers for non-critical operations
- Use sync handlers for critical validations
- Consider eventual consistency implications

### 5. Error Handling
- Log all handler errors
- Implement retry logic for transient failures
- Use dead letter queue for persistent failures
- Monitor handler execution metrics

## Event Sourcing (Future Enhancement)

For complete event sourcing:

```typescript
// Event store
interface IEventStore {
  append(streamId: string, events: DomainEvent[]): Promise<void>;
  getStream(streamId: string): Promise<DomainEvent[]>;
  getAllEvents(): Promise<DomainEvent[]>;
}

// Rebuild aggregate from events
class Budget {
  static fromHistory(events: DomainEvent[]): Budget {
    const budget = new Budget();
    events.forEach(event => budget.apply(event));
    return budget;
  }

  private apply(event: DomainEvent): void {
    // Apply event to rebuild state
  }
}
```

## Testing

### Unit Testing Handlers

```typescript
describe('BudgetApprovedHandler', () => {
  it('should send notification when budget is approved', async () => {
    const handler = new BudgetApprovedHandler(
      mockNotificationService,
      mockAuditLogService
    );

    const event = new BudgetApprovedEvent(
      'budget-123',
      'FY2025 Budget',
      1000000,
      'user-456',
      'fy-2025'
    );

    await handler.handle(event);

    expect(mockNotificationService.send).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe('Event Bus Integration', () => {
  it('should publish event and trigger handlers', async () => {
    const eventBus = new EventBus(false); // Synchronous for testing
    const handler = new BudgetApprovedHandler();

    eventBus.subscribe('BudgetApproved', handler);

    const event = new BudgetApprovedEvent(...);
    await eventBus.publish(event);

    // Verify handler was called and side effects occurred
  });
});
```

## Monitoring

Key metrics to monitor:
- Event publish rate
- Handler execution time
- Handler failure rate
- Event queue depth
- Dead letter queue size

## Future Enhancements

1. **Event Store**: Persist all events for audit and replay
2. **Event Replay**: Replay events for debugging or state reconstruction
3. **Event Versioning**: Handle event schema evolution
4. **Saga Pattern**: Implement distributed transactions
5. **CQRS**: Separate read and write models
6. **Event Streaming**: Integrate with Kafka or RabbitMQ for distributed events

## Related Documentation

- [Domain-Driven Design](../../../domain/README.md)
- [Background Jobs](../queue/README.md)
- [Caching Strategy](../cache/README.md)
