# Multi-Tenant Data Isolation Architecture

## Overview

The Federal PPBE system implements a comprehensive multi-tenant architecture that ensures complete data isolation between different federal agencies, departments, and organizations while maintaining a single application codebase.

## Architecture Pattern

We use a **hybrid multi-tenancy model** that combines:
1. **Database-level isolation** using Row-Level Security (RLS)
2. **Application-level isolation** using tenant context
3. **API-level isolation** using tenant identification

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│                   (Tenant Context)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  Database Layer                              │
│              (Row-Level Security)                            │
├──────────────────────────────────────────────────────────────┤
│  Tenant A Data  │  Tenant B Data  │  Tenant C Data          │
└──────────────────────────────────────────────────────────────┘
```

## Tenant Identification

### 1. Tenant ID Structure

Each tenant is identified by a UUID:

```typescript
interface Tenant {
  id: string; // UUID
  code: string; // Human-readable code (e.g., 'DOD', 'DHS')
  name: string; // Full name (e.g., 'Department of Defense')
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'inactive';
  config: {
    maxUsers: number;
    maxBudgets: number;
    maxStorage: number; // in GB
    features: string[];
  };
}
```

### 2. Tenant Extraction Methods

**Method 1: Subdomain-based**
```
dod.ppbe.gov → Tenant: DOD
dhs.ppbe.gov → Tenant: DHS
```

**Method 2: Header-based**
```http
X-Tenant-ID: 550e8400-e29b-41d4-a716-446655440000
```

**Method 3: Path-based**
```
/api/v1/tenants/dod/budgets
```

**Method 4: User Context**
```typescript
// Extract from authenticated user
const tenantId = req.user.tenantId;
```

## Database-Level Isolation

### Row-Level Security (RLS)

PostgreSQL Row-Level Security ensures data cannot be accessed across tenants:

```sql
-- Enable RLS on all tenant-specific tables
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policy to restrict access by tenant
CREATE POLICY tenant_isolation_policy ON budgets
  USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- Similar policies for all tenant-specific tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON programs
  USING (tenant_id = current_setting('app.current_tenant')::UUID);
```

### Setting Tenant Context

Before each request, set the tenant context:

```typescript
// Set tenant context for database session
await prisma.$executeRaw`
  SELECT set_config('app.current_tenant', ${tenantId}, false)
`;

// All subsequent queries automatically filter by tenant
const budgets = await prisma.budget.findMany();
// Only returns budgets for current tenant
```

## Application-Level Isolation

### Tenant Context Middleware

```typescript
export function tenantContext() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract tenant ID from various sources
      const tenantId = extractTenantId(req);

      if (!tenantId) {
        return res.status(400).json({
          error: 'Tenant identification required',
        });
      }

      // Validate tenant exists and is active
      const tenant = await validateTenant(tenantId);

      if (!tenant) {
        return res.status(403).json({
          error: 'Invalid or inactive tenant',
        });
      }

      // Set tenant in request context
      (req as any).tenantId = tenantId;
      (req as any).tenant = tenant;

      // Set database session context
      await setDatabaseTenantContext(tenantId);

      next();
    } catch (error) {
      console.error('Tenant context error:', error);
      res.status(500).json({ error: 'Tenant context initialization failed' });
    }
  };
}
```

### Automatic Tenant Injection

All database operations automatically include tenant ID:

```typescript
// Repository pattern with automatic tenant injection
class BudgetRepository {
  constructor(private tenantId: string) {}

  async findAll(): Promise<Budget[]> {
    // Tenant ID automatically included
    return await prisma.budget.findMany({
      where: { tenantId: this.tenantId },
    });
  }

  async create(data: CreateBudgetDTO): Promise<Budget> {
    // Tenant ID automatically injected
    return await prisma.budget.create({
      data: {
        ...data,
        tenantId: this.tenantId,
      },
    });
  }
}
```

## Tenant Hierarchy

Support for organizational hierarchies within tenants:

```sql
-- Organizations table with tenant isolation
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES organizations(id),
  tenant_id UUID NOT NULL,  -- Isolates to tenant
  code VARCHAR(50),
  name VARCHAR(255),
  level INTEGER,
  path TEXT  -- Materialized path for fast queries
);

-- Example hierarchy:
-- DOD (tenant_id: abc-123)
--   ├── Army (org_id: org-1, parent: null)
--   │   ├── Corps (org_id: org-2, parent: org-1)
--   │   └── Division (org_id: org-3, parent: org-1)
--   └── Navy (org_id: org-4, parent: null)
```

## Cache Isolation

Redis cache keys include tenant ID:

```typescript
class CacheService {
  private getTenantKey(key: string, tenantId: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  async get<T>(key: string, tenantId: string): Promise<T | null> {
    const tenantKey = this.getTenantKey(key, tenantId);
    return await this.redis.get(tenantKey);
  }

  async set(key: string, value: any, tenantId: string, ttl?: number): Promise<void> {
    const tenantKey = this.getTenantKey(key, tenantId);
    await this.redis.set(tenantKey, value, 'EX', ttl);
  }
}
```

## Queue Isolation

Background jobs include tenant context:

```typescript
// Add job with tenant context
await queueManager.addJob('reports', 'generate-report', {
  tenantId: currentTenant.id,
  reportId: 'report-123',
  // ... other data
});

// Process job with tenant context
queueManager.registerProcessor('reports', async (job) => {
  const { tenantId, reportId } = job.data;

  // Set tenant context for this job
  await setTenantContext(tenantId);

  // Process with tenant isolation
  return await generateReport(reportId);
});
```

## Cross-Tenant Operations

Some operations may need to access multiple tenants (e.g., super admin):

```typescript
// Super admin query across tenants
async function getAllTenantsStats(superAdminUser: User): Promise<TenantStats[]> {
  // Verify super admin
  if (superAdminUser.role !== 'super_admin') {
    throw new Error('Unauthorized: Super admin required');
  }

  // Bypass tenant isolation for super admin
  const stats = await prisma.$queryRaw`
    SELECT
      tenant_id,
      COUNT(*) as budget_count,
      SUM(approved_amount) as total_amount
    FROM budgets
    GROUP BY tenant_id
  `;

  return stats;
}
```

## Tenant Provisioning

### New Tenant Onboarding

```typescript
async function provisionNewTenant(data: CreateTenantDTO): Promise<Tenant> {
  // 1. Create tenant record
  const tenant = await prisma.tenant.create({
    data: {
      id: generateUUID(),
      code: data.code,
      name: data.name,
      tier: data.tier || 'basic',
      status: 'active',
      config: getDefaultConfig(data.tier),
    },
  });

  // 2. Create default organization
  await prisma.organization.create({
    data: {
      tenantId: tenant.id,
      code: data.code,
      name: data.name,
      level: 0,
      isActive: true,
    },
  });

  // 3. Create admin user
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      username: data.adminUsername,
      email: data.adminEmail,
      passwordHash: await hashPassword(data.adminPassword),
      role: 'admin',
      status: 'active',
    },
  });

  // 4. Initialize tenant-specific resources
  await initializeTenantResources(tenant.id);

  // 5. Send welcome email
  await sendTenantWelcomeEmail(tenant, data.adminEmail);

  return tenant;
}
```

## Data Backup and Recovery

### Tenant-Specific Backups

```bash
#!/bin/bash
# Backup specific tenant data

TENANT_ID="550e8400-e29b-41d4-a716-446655440000"
BACKUP_DIR="/backups/tenants/${TENANT_ID}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup tenant data
pg_dump -h localhost -U postgres -d ppbe_db \
  --table budgets \
  --table programs \
  --table fiscal_years \
  --where "tenant_id = '${TENANT_ID}'" \
  > "${BACKUP_DIR}/backup_${TIMESTAMP}.sql"
```

### Tenant Data Deletion (GDPR Compliance)

```typescript
async function deleteTenantData(tenantId: string, confirmation: string): Promise<void> {
  // Verify confirmation
  if (confirmation !== `DELETE-${tenantId}`) {
    throw new Error('Invalid confirmation');
  }

  // Log deletion request
  await auditLog.log({
    action: 'tenant_deletion_initiated',
    tenantId,
    timestamp: new Date(),
  });

  // Delete in order (respecting foreign keys)
  await prisma.$transaction([
    prisma.expenditure.deleteMany({ where: { tenantId } }),
    prisma.obligation.deleteMany({ where: { tenantId } }),
    prisma.budgetLineItem.deleteMany({ where: { tenantId } }),
    prisma.budget.deleteMany({ where: { tenantId } }),
    prisma.program.deleteMany({ where: { tenantId } }),
    prisma.approval.deleteMany({ where: { tenantId } }),
    prisma.notification.deleteMany({ where: { tenantId } }),
    prisma.auditLog.deleteMany({ where: { tenantId } }),
    prisma.user.deleteMany({ where: { tenantId } }),
    prisma.organization.deleteMany({ where: { tenantId } }),
    prisma.fiscalYear.deleteMany({ where: { tenantId } }),
    prisma.tenant.delete({ where: { id: tenantId } }),
  ]);

  // Clear tenant cache
  await cacheService.deletePattern(`tenant:${tenantId}:*`);

  // Log completion
  await auditLog.log({
    action: 'tenant_deletion_completed',
    tenantId,
    timestamp: new Date(),
  });
}
```

## Security Considerations

### 1. Tenant Validation

Always validate tenant access:

```typescript
function checkTenantAccess(user: User, requestedTenantId: string): void {
  // Super admins can access any tenant
  if (user.role === 'super_admin') {
    return;
  }

  // Regular users can only access their own tenant
  if (user.tenantId !== requestedTenantId) {
    throw new UnauthorizedError('Access denied to this tenant');
  }
}
```

### 2. Tenant Boundary Enforcement

Use TypeScript types to enforce tenant context:

```typescript
// Tenant-scoped types
type TenantScoped<T> = T & { tenantId: string };

// Ensure all queries include tenant
function findBudgets(filters: TenantScoped<BudgetFilters>): Promise<Budget[]> {
  // TypeScript enforces tenantId is present
  return prisma.budget.findMany({
    where: {
      tenantId: filters.tenantId,
      ...filters,
    },
  });
}
```

### 3. Audit Logging

Log all cross-tenant operations:

```typescript
await auditLog.log({
  action: 'cross_tenant_access',
  userId: superAdmin.id,
  sourceTenant: superAdmin.tenantId,
  targetTenant: requestedTenantId,
  reason: 'System maintenance',
  timestamp: new Date(),
});
```

## Performance Optimization

### 1. Tenant-Specific Indexes

```sql
-- Index on tenant_id for fast filtering
CREATE INDEX idx_budgets_tenant_id ON budgets(tenant_id);
CREATE INDEX idx_programs_tenant_id ON programs(tenant_id);

-- Composite indexes for common queries
CREATE INDEX idx_budgets_tenant_fy ON budgets(tenant_id, fiscal_year_id);
CREATE INDEX idx_programs_tenant_org ON programs(tenant_id, organization_id);
```

### 2. Tenant-Specific Caching

Cache frequently accessed tenant data:

```typescript
// Cache tenant configuration
const tenantConfig = await cacheService.getOrLoad(
  `tenant:${tenantId}:config`,
  () => loadTenantConfig(tenantId),
  3600 // 1 hour TTL
);
```

### 3. Connection Pooling

Use separate connection pools per tenant tier:

```typescript
const poolConfig = {
  basic: { max: 10 },
  standard: { max: 20 },
  premium: { max: 50 },
  enterprise: { max: 100 },
};

function getConnectionPool(tenant: Tenant): Pool {
  return pools[tenant.tier];
}
```

## Monitoring and Metrics

### Tenant-Specific Metrics

```typescript
// Track metrics per tenant
await metrics.record('api.requests', 1, {
  tenant: tenantId,
  endpoint: req.path,
  method: req.method,
});

await metrics.record('database.queries', 1, {
  tenant: tenantId,
  table: 'budgets',
  operation: 'select',
});
```

### Tenant Health Dashboard

Monitor tenant-specific health:

```typescript
interface TenantHealth {
  tenantId: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: {
    activeUsers: number;
    requestRate: number;
    errorRate: number;
    avgResponseTime: number;
    storageUsed: number;
    storageLimit: number;
  };
}
```

## Testing Multi-Tenancy

### Integration Tests

```typescript
describe('Multi-tenant isolation', () => {
  it('should not allow access to other tenant data', async () => {
    // Create data for tenant A
    const budgetA = await createBudget({
      tenantId: 'tenant-a',
      title: 'Budget A',
    });

    // Try to access as tenant B
    setTenantContext('tenant-b');

    const result = await budgetRepository.findById(budgetA.id);

    // Should not find budget from tenant A
    expect(result).toBeNull();
  });

  it('should enforce RLS at database level', async () => {
    // Set wrong tenant context
    await prisma.$executeRaw`
      SELECT set_config('app.current_tenant', 'wrong-tenant', false)
    `;

    // Query should return no results
    const budgets = await prisma.budget.findMany();
    expect(budgets).toHaveLength(0);
  });
});
```

## Best Practices

1. **Always include tenant context** in all operations
2. **Validate tenant access** before processing requests
3. **Use RLS** as primary defense layer
4. **Audit all operations** for compliance
5. **Test isolation** thoroughly
6. **Monitor tenant metrics** separately
7. **Plan for tenant scaling** from the start
8. **Document tenant-specific configurations**

## Related Documentation

- [Architecture Documentation](ARCHITECTURE.md)
- [Database Schema](backend/database/schema.sql)
- [API Gateway](backend/src/presentation/middleware/apiGateway.ts)
- [Security Guidelines](SECURITY.md)
