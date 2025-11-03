/**
 * Database Migration Runner
 *
 * This script manages database migrations for the Federal PPBE system.
 * It tracks applied migrations and provides up/down migration capabilities.
 *
 * Usage:
 *   node migrate.js up           - Apply all pending migrations
 *   node migrate.js down          - Rollback last migration
 *   node migrate.js status        - Show migration status
 *   node migrate.js create <name> - Create new migration file
 */

const fs = require('fs').promises;
const path = require('path');
const { Client } = require('pg');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

/**
 * Database configuration
 */
const getDbConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'ppbe_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

/**
 * Create database client
 */
const createClient = async () => {
  const client = new Client(getDbConfig());
  await client.connect();
  return client;
};

/**
 * Ensure schema_migrations table exists
 */
const ensureMigrationsTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      description TEXT,
      execution_time INTEGER
    )
  `);
};

/**
 * Get list of migration files
 */
const getMigrationFiles = async () => {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    return files
      .filter(f => f.endsWith('.sql') && f !== 'README.md')
      .sort();
  } catch (error) {
    console.error('Error reading migrations directory:', error.message);
    return [];
  }
};

/**
 * Get applied migrations from database
 */
const getAppliedMigrations = async (client) => {
  const result = await client.query(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return result.rows.map(row => row.version);
};

/**
 * Get pending migrations
 */
const getPendingMigrations = async (client) => {
  const files = await getMigrationFiles();
  const applied = await getAppliedMigrations(client);

  return files.filter(file => {
    const version = file.split('_')[0];
    return !applied.includes(version);
  });
};

/**
 * Apply a single migration
 */
const applyMigration = async (client, filename) => {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const version = filename.split('_')[0];
  const description = filename.replace('.sql', '').replace(version + '_', '').replace(/_/g, ' ');

  console.log(`Applying migration: ${filename}`);

  const startTime = Date.now();

  try {
    // Read and execute migration file
    const sql = await fs.readFile(filePath, 'utf-8');

    await client.query('BEGIN');

    // Execute migration
    await client.query(sql);

    // Record migration
    await client.query(
      `INSERT INTO schema_migrations (version, description, execution_time)
       VALUES ($1, $2, $3)
       ON CONFLICT (version) DO NOTHING`,
      [version, description, Date.now() - startTime]
    );

    await client.query('COMMIT');

    console.log(`✓ Migration ${filename} applied successfully (${Date.now() - startTime}ms)`);
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Migration ${filename} failed:`, error.message);
    return false;
  }
};

/**
 * Rollback last migration
 */
const rollbackMigration = async (client) => {
  const applied = await getAppliedMigrations(client);

  if (applied.length === 0) {
    console.log('No migrations to rollback');
    return;
  }

  const lastVersion = applied[applied.length - 1];

  console.log(`Rolling back migration: ${lastVersion}`);

  try {
    await client.query('BEGIN');

    // Delete from schema_migrations
    await client.query(
      'DELETE FROM schema_migrations WHERE version = $1',
      [lastVersion]
    );

    await client.query('COMMIT');

    console.log(`✓ Migration ${lastVersion} rolled back successfully`);
    console.log('Note: You may need to manually undo database changes');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Rollback failed:`, error.message);
  }
};

/**
 * Show migration status
 */
const showStatus = async (client) => {
  const files = await getMigrationFiles();
  const applied = await getAppliedMigrations(client);

  console.log('\n=== Migration Status ===\n');

  if (files.length === 0) {
    console.log('No migration files found');
    return;
  }

  files.forEach(file => {
    const version = file.split('_')[0];
    const status = applied.includes(version) ? '✓ Applied' : '○ Pending';
    console.log(`${status}  ${file}`);
  });

  console.log(`\nTotal: ${files.length} migrations (${applied.length} applied, ${files.length - applied.length} pending)`);
};

/**
 * Create new migration file
 */
const createMigration = async (name) => {
  if (!name) {
    console.error('Error: Migration name required');
    console.log('Usage: node migrate.js create <migration_name>');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0].replace('T', '');
  const filename = `${timestamp}_${name.replace(/\s+/g, '_')}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  const template = `-- =============================================================================
-- Migration: ${name}
-- Version: ${timestamp}
-- Description: TODO: Add description
-- Author: TODO: Add author
-- Date: ${new Date().toISOString().split('T')[0]}
-- =============================================================================

BEGIN;

-- TODO: Add your migration SQL here

-- Record this migration
INSERT INTO schema_migrations (version, description)
VALUES ('${timestamp}', '${name}')
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (Execute in reverse order if needed)
-- =============================================================================
/*
BEGIN;

-- TODO: Add rollback SQL here

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '${timestamp}';

COMMIT;
*/
`;

  try {
    await fs.writeFile(filePath, template);
    console.log(`✓ Created migration file: ${filename}`);
  } catch (error) {
    console.error('Error creating migration file:', error.message);
    process.exit(1);
  }
};

/**
 * Run migrations up
 */
const migrateUp = async () => {
  const client = await createClient();

  try {
    await ensureMigrationsTable(client);

    const pending = await getPendingMigrations(client);

    if (pending.length === 0) {
      console.log('✓ Database is up to date');
      return;
    }

    console.log(`Found ${pending.length} pending migration(s)\n`);

    for (const file of pending) {
      const success = await applyMigration(client, file);
      if (!success) {
        console.log('\nMigration failed. Stopping.');
        process.exit(1);
      }
    }

    console.log('\n✓ All migrations applied successfully');
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

/**
 * Run migrations down
 */
const migrateDown = async () => {
  const client = await createClient();

  try {
    await ensureMigrationsTable(client);
    await rollbackMigration(client);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

/**
 * Show status
 */
const status = async () => {
  const client = await createClient();

  try {
    await ensureMigrationsTable(client);
    await showStatus(client);
  } catch (error) {
    console.error('Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
};

/**
 * Main execution
 */
const main = async () => {
  const command = process.argv[2];
  const arg = process.argv[3];

  console.log('Federal PPBE Database Migration Tool\n');

  switch (command) {
    case 'up':
      await migrateUp();
      break;
    case 'down':
      await migrateDown();
      break;
    case 'status':
      await status();
      break;
    case 'create':
      await createMigration(arg);
      break;
    default:
      console.log('Usage:');
      console.log('  node migrate.js up            - Apply all pending migrations');
      console.log('  node migrate.js down          - Rollback last migration');
      console.log('  node migrate.js status        - Show migration status');
      console.log('  node migrate.js create <name> - Create new migration file');
      process.exit(1);
  }
};

// Run main function
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateUp,
  migrateDown,
  status,
  createMigration
};
