# Database Migration System

## Overview

This directory contains database migration files for the Federal PPBE system. Migrations are used to version control database schema changes and ensure consistent database state across environments.

## Migration File Naming Convention

Migration files follow this naming pattern:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Example: `20251103120000_create_initial_schema.sql`

## Migration Structure

Each migration file should contain:
1. **UP Migration**: SQL statements to apply the change
2. **DOWN Migration**: SQL statements to rollback the change (in comments)

## Running Migrations

### Using the Migration Script

```bash
# Run all pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Check migration status
npm run migrate:status

# Create a new migration
npm run migrate:create <migration_name>
```

### Manual Migration

```bash
# Apply migration
psql -U postgres -d ppbe_db -f migrations/YYYYMMDDHHMMSS_migration_name.sql

# Rollback migration
psql -U postgres -d ppbe_db -f migrations/rollback/YYYYMMDDHHMMSS_migration_name.sql
```

## Migration Best Practices

1. **Atomic Changes**: Each migration should contain one logical change
2. **Idempotent**: Migrations should be safe to run multiple times
3. **Backwards Compatible**: When possible, use multi-step migrations for breaking changes
4. **Test Rollbacks**: Always test the DOWN migration before deploying
5. **Data Migrations**: Separate data migrations from schema migrations
6. **Performance**: Consider impact on large tables (use batching for data migrations)

## Migration Checklist

Before creating a migration:
- [ ] Have you tested the migration on a development database?
- [ ] Have you created a rollback script?
- [ ] Have you documented any manual steps required?
- [ ] Will this migration lock tables for an extended period?
- [ ] Have you considered the impact on existing data?
- [ ] Is the migration idempotent?

## Migration Order

1. **001_create_initial_schema.sql** - Initial database schema
2. **002_create_indexes.sql** - Additional performance indexes
3. **003_seed_initial_data.sql** - Initial seed data
4. Future migrations...

## Environment-Specific Considerations

### Development
- Migrations run automatically on startup
- Can use destructive migrations (DROP, TRUNCATE)

### Staging
- Migrations reviewed before application
- Test with production-like data volume

### Production
- Migrations reviewed and approved
- Scheduled during maintenance windows
- Backup created before migration
- Monitored for performance impact

## Emergency Rollback Procedure

If a migration causes issues in production:

1. **Immediate Action**:
   ```bash
   npm run migrate:down
   ```

2. **Verify Rollback**:
   ```bash
   npm run migrate:status
   ```

3. **Restart Application** (if needed)

4. **Incident Report**: Document what went wrong and why

## Migration Tracking

Migrations are tracked in the `schema_migrations` table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    execution_time INTEGER
);
```

## Common Migration Patterns

### Adding a Column
```sql
-- UP
ALTER TABLE table_name
ADD COLUMN column_name data_type;

-- DOWN (in comments)
-- ALTER TABLE table_name DROP COLUMN column_name;
```

### Renaming a Column
```sql
-- UP
ALTER TABLE table_name
RENAME COLUMN old_name TO new_name;

-- DOWN (in comments)
-- ALTER TABLE table_name RENAME COLUMN new_name TO old_name;
```

### Creating an Index
```sql
-- UP
CREATE INDEX CONCURRENTLY idx_name ON table_name(column_name);

-- DOWN (in comments)
-- DROP INDEX CONCURRENTLY idx_name;
```

### Data Migration
```sql
-- UP
UPDATE table_name
SET new_column = old_column
WHERE condition;

-- Always include WHERE clause to prevent full table locks
```

## Troubleshooting

### Migration Fails Midway
1. Check the error message
2. Verify database connection
3. Check for table locks
4. Review migration logs

### Migration Applied But Not Recorded
```sql
-- Manually record migration
INSERT INTO schema_migrations (version, description)
VALUES ('YYYYMMDDHHMMSS', 'migration description');
```

### Need to Skip a Migration
```sql
-- Mark migration as applied without running
INSERT INTO schema_migrations (version, description)
VALUES ('YYYYMMDDHHMMSS', 'skipped - reason');
```

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Migration Best Practices](https://docs.example.com/migrations)
- Project Wiki: Database Changes
