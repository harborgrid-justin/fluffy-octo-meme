# Caching Strategy

## Overview

This directory implements a comprehensive caching layer using Redis for the Federal PPBE system. The caching strategy improves performance, reduces database load, and provides better scalability.

## Architecture

```
┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│ Application  │ ──────> │ Cache Service │ ──────> │    Redis     │
│    Layer     │         │  (Abstraction)│         │   (Storage)  │
└──────────────┘         └───────────────┘         └──────────────┘
```

## Components

### 1. Cache Service (`CacheService.ts`)
Main caching abstraction with Redis implementation.

Features:
- Get/Set/Delete operations
- Pattern-based deletion
- TTL management
- Connection pooling
- Error handling
- Statistics and monitoring

### 2. Cache Keys (`CacheKeys.ts`)
Centralized cache key management.

Features:
- Consistent key naming
- Key generation helpers
- Pattern matching support
- Invalidation strategies

### 3. Cache-Aside Helper
Helper for cache-aside pattern implementation.

## Caching Patterns

### 1. Cache-Aside (Lazy Loading)

Most common pattern - load data on demand.

```typescript
async getBudget(id: string): Promise<Budget> {
  const cacheKey = CacheKeys.budget.detail(id);

  // Try cache first
  const cached = await cacheService.get<Budget>(cacheKey);
  if (cached) {
    return cached;
  }

  // Load from database
  const budget = await budgetRepository.findById(id);

  // Store in cache
  await cacheService.set(cacheKey, budget, CacheTTL.LONG);

  return budget;
}
```

### 2. Write-Through

Update cache immediately on write.

```typescript
async updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget> {
  // Update database
  const budget = await budgetRepository.update(id, data);

  // Update cache
  const cacheKey = CacheKeys.budget.detail(id);
  await cacheService.set(cacheKey, budget, CacheTTL.LONG);

  return budget;
}
```

### 3. Write-Behind (Write-Back)

Update cache immediately, database asynchronously.

```typescript
async updateBudget(id: string, data: UpdateBudgetDTO): Promise<void> {
  const cacheKey = CacheKeys.budget.detail(id);

  // Update cache immediately
  await cacheService.set(cacheKey, data, CacheTTL.LONG);

  // Queue database update for later
  await queueService.addJob('update-budget', { id, data });
}
```

### 4. Cache Invalidation

Remove stale data from cache.

```typescript
async approveBudget(id: string): Promise<void> {
  // Update database
  await budgetRepository.approve(id);

  // Invalidate related caches
  await CacheInvalidation.onBudgetUpdate(
    cacheService,
    id,
    budget.fiscalYearId,
    budget.organizationId
  );
}
```

## Cache Hierarchy

### Level 1: Entity Cache (TTL: 1 hour)
Individual entities by ID:
- `ppbe:budget:{id}`
- `ppbe:program:{id}`
- `ppbe:user:{id}`

### Level 2: List Cache (TTL: 30 minutes)
Filtered lists and queries:
- `ppbe:budgets:list:{filters}`
- `ppbe:budgets:fy:{fiscalYearId}`
- `ppbe:programs:org:{organizationId}`

### Level 3: Aggregate Cache (TTL: 5 minutes)
Computed aggregates and summaries:
- `ppbe:dashboard:summary:{userId}:{fiscalYearId}`
- `ppbe:fy:summary:{fiscalYearId}`

### Level 4: Session Cache (TTL: 24 hours)
User sessions and temporary data:
- `ppbe:session:{sessionId}`
- `ppbe:user:permissions:{userId}`

## Cache Invalidation Strategy

### Event-Based Invalidation

Use domain events to trigger cache invalidation:

```typescript
// In event handler
class BudgetApprovedHandler {
  async handle(event: BudgetApprovedEvent): Promise<void> {
    await CacheInvalidation.onBudgetUpdate(
      cacheService,
      event.budgetId,
      event.fiscalYearId,
      event.organizationId
    );
  }
}
```

### Time-Based Invalidation (TTL)

Set appropriate TTL based on data volatility:

```typescript
// Frequently changing data - short TTL
await cacheService.set(key, value, CacheTTL.SHORT); // 5 minutes

// Reference data - long TTL
await cacheService.set(key, value, CacheTTL.DAY); // 24 hours
```

### Manual Invalidation

Explicit invalidation after updates:

```typescript
async updateBudget(id: string, data: UpdateBudgetDTO): Promise<Budget> {
  const budget = await budgetRepository.update(id, data);

  // Invalidate specific key
  await cacheService.delete(CacheKeys.budget.detail(id));

  // Invalidate related patterns
  await cacheService.deletePattern(CacheKeys.budget.byFiscalYear('*'));

  return budget;
}
```

## Cache Key Naming Convention

```
{prefix}:{entity}:{identifier}:{suffix}
```

Examples:
- `ppbe:budget:123e4567-e89b-12d3-a456-426614174000`
- `ppbe:budgets:list:{"fy":"2025","status":"approved"}`
- `ppbe:user:session:abc123xyz`
- `ppbe:dashboard:summary:user123:fy2025`

## Best Practices

### 1. Always Set TTL
```typescript
// Good
await cacheService.set(key, value, 3600);

// Bad - might fill up Redis
await cacheService.set(key, value);
```

### 2. Use Cache Keys Constants
```typescript
// Good
const key = CacheKeys.budget.detail(id);

// Bad - inconsistent keys
const key = `budget-${id}`;
```

### 3. Handle Cache Failures Gracefully
```typescript
try {
  const cached = await cacheService.get(key);
  if (cached) return cached;
} catch (error) {
  // Log but don't fail - fall back to database
  console.error('Cache error:', error);
}

// Always have database fallback
return await repository.findById(id);
```

### 4. Invalidate Proactively
```typescript
// After any data modification
await updateBudget(id, data);
await cacheService.delete(CacheKeys.budget.detail(id));
```

### 5. Cache Expensive Operations
```typescript
// Cache complex queries
const cacheKey = CacheKeys.dashboard.summary(userId, fiscalYearId);
const cached = await cacheService.get(cacheKey);
if (cached) return cached;

// Expensive computation
const summary = await calculateDashboardSummary(userId, fiscalYearId);

await cacheService.set(cacheKey, summary, CacheTTL.SHORT);
return summary;
```

## Monitoring

### Key Metrics

1. **Hit Rate**: Cache hits / Total requests
2. **Miss Rate**: Cache misses / Total requests
3. **Eviction Rate**: Keys evicted / Total keys
4. **Memory Usage**: Current memory / Max memory
5. **Response Time**: Cache operation latency

### Get Statistics

```typescript
const stats = await cacheService.getStats();
console.log(`
  Total Keys: ${stats.keys}
  Memory Used: ${stats.memory}
  Cache Hits: ${stats.hits}
  Cache Misses: ${stats.misses}
  Hit Rate: ${(stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)}%
`);
```

## Configuration

### Environment Variables

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password
REDIS_DB=0
REDIS_KEY_PREFIX=ppbe
REDIS_MAX_RETRIES=3
REDIS_RETRY_DELAY=1000
```

### Redis Configuration

```redis
# redis.conf
maxmemory 2gb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

## Testing

### Unit Tests

```typescript
describe('CacheService', () => {
  it('should set and get value', async () => {
    await cacheService.set('test-key', { foo: 'bar' });
    const result = await cacheService.get('test-key');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should respect TTL', async () => {
    await cacheService.set('test-key', 'value', 1); // 1 second
    await sleep(1100);
    const result = await cacheService.get('test-key');
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
describe('Budget Caching', () => {
  it('should cache budget after first load', async () => {
    const budget = await budgetService.getBudget('123');
    const cached = await cacheService.get(CacheKeys.budget.detail('123'));
    expect(cached).toEqual(budget);
  });

  it('should invalidate cache after update', async () => {
    await budgetService.updateBudget('123', { title: 'Updated' });
    const cached = await cacheService.get(CacheKeys.budget.detail('123'));
    expect(cached).toBeNull();
  });
});
```

## Troubleshooting

### Issue: High Memory Usage
- Review TTL settings
- Implement LRU eviction policy
- Increase Redis memory limit
- Reduce cached data size

### Issue: Low Hit Rate
- Review cache key naming
- Check TTL settings
- Verify invalidation logic
- Profile cache access patterns

### Issue: Cache Stampede
- Use distributed locking
- Implement cache warming
- Use probabilistic early expiration

## Future Enhancements

1. **Multi-tier Caching**: Add in-memory L1 cache
2. **Cache Warming**: Pre-populate cache on startup
3. **Smart TTL**: Dynamic TTL based on access patterns
4. **Cache Compression**: Compress large cached objects
5. **Distributed Locking**: Prevent cache stampede
6. **Cache Analytics**: Detailed cache usage analytics

## Related Documentation

- [Event-Driven Architecture](../events/README.md)
- [Background Jobs](../queue/README.md)
- [Database Layer](../database/README.md)
