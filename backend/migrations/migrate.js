#!/usr/bin/env node
// DEVOPS-006: Database Migration Runner
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

const MIGRATIONS_DIR = __dirname;
const MIGRATION_TABLE = 'schema_migrations';

// Database connection configuration
const config = {
  connectionString: process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER || 'ppbe_user'}:${process.env.POSTGRES_PASSWORD || 'changeme'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'ppbe'}`,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

class MigrationRunner {
  constructor() {
    this.client = new Client(config);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to database');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('Disconnected from database');
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await this.client.query(query);
      console.log(`Migration table '${MIGRATION_TABLE}' ensured`);
    } catch (error) {
      console.error('Error creating migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations() {
    try {
      const result = await this.client.query(
        `SELECT name FROM ${MIGRATION_TABLE} ORDER BY id`
      );
      return result.rows.map(row => row.name);
    } catch (error) {
      console.error('Error getting executed migrations:', error);
      throw error;
    }
  }

  async getMigrationFiles() {
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();
    return files;
  }

  async executeMigration(filename) {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
      console.log(`Executing migration: ${filename}`);

      await this.client.query('BEGIN');

      // Execute the migration SQL
      await this.client.query(sql);

      // Record the migration
      await this.client.query(
        `INSERT INTO ${MIGRATION_TABLE} (name) VALUES ($1)`,
        [filename]
      );

      await this.client.query('COMMIT');

      console.log(`Successfully executed: ${filename}`);
      return true;
    } catch (error) {
      await this.client.query('ROLLBACK');
      console.error(`Error executing migration ${filename}:`, error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      await this.createMigrationsTable();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations');
        return;
      }

      console.log(`Found ${pendingMigrations.length} pending migration(s)`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('All migrations completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async rollback(steps = 1) {
    try {
      const executedMigrations = await this.getExecutedMigrations();

      if (executedMigrations.length === 0) {
        console.log('No migrations to rollback');
        return;
      }

      const toRollback = executedMigrations.slice(-steps);

      console.log(`Rolling back ${toRollback.length} migration(s)`);

      for (const migration of toRollback.reverse()) {
        console.log(`Rolling back: ${migration}`);

        await this.client.query(
          `DELETE FROM ${MIGRATION_TABLE} WHERE name = $1`,
          [migration]
        );

        console.log(`Rolled back: ${migration}`);
      }

      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async status() {
    try {
      await this.createMigrationsTable();

      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();

      console.log('\nMigration Status:');
      console.log('================\n');

      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✓ Executed' : '✗ Pending';
        console.log(`${status}: ${file}`);
      });

      console.log(`\nTotal: ${migrationFiles.length} migrations`);
      console.log(`Executed: ${executedMigrations.length}`);
      console.log(`Pending: ${migrationFiles.length - executedMigrations.length}\n`);
    } catch (error) {
      console.error('Error getting migration status:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2] || 'migrate';
  const runner = new MigrationRunner();

  try {
    await runner.connect();

    switch (command) {
      case 'migrate':
      case 'up':
        await runner.runMigrations();
        break;

      case 'rollback':
      case 'down':
        const steps = parseInt(process.argv[3]) || 1;
        await runner.rollback(steps);
        break;

      case 'status':
        await runner.status();
        break;

      default:
        console.log('Usage:');
        console.log('  node migrate.js migrate   - Run pending migrations');
        console.log('  node migrate.js rollback [steps] - Rollback migrations');
        console.log('  node migrate.js status    - Show migration status');
        process.exit(1);
    }

    await runner.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await runner.disconnect();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationRunner;
