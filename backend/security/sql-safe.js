/**
 * SQL Injection Prevention Utilities
 *
 * Provides parameterized query helpers and SQL-safe operations
 * Implements prepared statements and input validation for SQL databases
 *
 * NIST Controls Addressed:
 * - SI-10: Information Input Validation
 * - SC-4: Information in Shared Resources
 */

/**
 * SQL Query Builder with Parameterized Queries
 * Prevents SQL injection by using placeholders and parameter binding
 */
class SQLQueryBuilder {
  constructor(dbType = 'postgresql') {
    this.dbType = dbType; // postgresql, mysql, sqlite
    this.parameterIndex = 1;
    this.parameters = [];
    this.query = '';
  }

  /**
   * Get parameter placeholder based on database type
   */
  getPlaceholder() {
    switch (this.dbType) {
      case 'postgresql':
        return `$${this.parameterIndex++}`;
      case 'mysql':
        return '?';
      case 'sqlite':
        return '?';
      default:
        return '?';
    }
  }

  /**
   * Safely add parameter
   * @param {*} value - Parameter value
   * @returns {string} Placeholder
   */
  addParameter(value) {
    this.parameters.push(value);
    return this.getPlaceholder();
  }

  /**
   * Build SELECT query
   */
  select(table, columns = ['*'], conditions = {}) {
    this.query = `SELECT ${columns.join(', ')} FROM ${this.sanitizeIdentifier(table)}`;

    if (Object.keys(conditions).length > 0) {
      this.query += ' WHERE ';
      const whereClauses = [];

      for (const [column, value] of Object.entries(conditions)) {
        const placeholder = this.addParameter(value);
        whereClauses.push(`${this.sanitizeIdentifier(column)} = ${placeholder}`);
      }

      this.query += whereClauses.join(' AND ');
    }

    return this;
  }

  /**
   * Build INSERT query
   */
  insert(table, data) {
    const columns = Object.keys(data);
    const placeholders = columns.map(() => this.getPlaceholder());

    this.query = `INSERT INTO ${this.sanitizeIdentifier(table)} (${columns.map(c => this.sanitizeIdentifier(c)).join(', ')}) VALUES (${placeholders.join(', ')})`;

    this.parameters.push(...Object.values(data));

    return this;
  }

  /**
   * Build UPDATE query
   */
  update(table, data, conditions = {}) {
    const setClauses = [];

    for (const [column, value] of Object.entries(data)) {
      const placeholder = this.addParameter(value);
      setClauses.push(`${this.sanitizeIdentifier(column)} = ${placeholder}`);
    }

    this.query = `UPDATE ${this.sanitizeIdentifier(table)} SET ${setClauses.join(', ')}`;

    if (Object.keys(conditions).length > 0) {
      this.query += ' WHERE ';
      const whereClauses = [];

      for (const [column, value] of Object.entries(conditions)) {
        const placeholder = this.addParameter(value);
        whereClauses.push(`${this.sanitizeIdentifier(column)} = ${placeholder}`);
      }

      this.query += whereClauses.join(' AND ');
    }

    return this;
  }

  /**
   * Build DELETE query
   */
  delete(table, conditions = {}) {
    this.query = `DELETE FROM ${this.sanitizeIdentifier(table)}`;

    if (Object.keys(conditions).length > 0) {
      this.query += ' WHERE ';
      const whereClauses = [];

      for (const [column, value] of Object.entries(conditions)) {
        const placeholder = this.addParameter(value);
        whereClauses.push(`${this.sanitizeIdentifier(column)} = ${placeholder}`);
      }

      this.query += whereClauses.join(' AND ');
    }

    return this;
  }

  /**
   * Add WHERE clause
   */
  where(conditions) {
    if (Object.keys(conditions).length === 0) {
      return this;
    }

    this.query += ' WHERE ';
    const whereClauses = [];

    for (const [column, value] of Object.entries(conditions)) {
      const placeholder = this.addParameter(value);
      whereClauses.push(`${this.sanitizeIdentifier(column)} = ${placeholder}`);
    }

    this.query += whereClauses.join(' AND ');

    return this;
  }

  /**
   * Add ORDER BY clause
   */
  orderBy(column, direction = 'ASC') {
    const safeDirection = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    this.query += ` ORDER BY ${this.sanitizeIdentifier(column)} ${safeDirection}`;
    return this;
  }

  /**
   * Add LIMIT clause
   */
  limit(count) {
    const safeCount = Math.max(0, parseInt(count, 10));
    this.query += ` LIMIT ${safeCount}`;
    return this;
  }

  /**
   * Add OFFSET clause
   */
  offset(count) {
    const safeCount = Math.max(0, parseInt(count, 10));
    this.query += ` OFFSET ${safeCount}`;
    return this;
  }

  /**
   * Sanitize table/column identifiers
   * Prevents injection through identifiers
   */
  sanitizeIdentifier(identifier) {
    // Only allow alphanumeric and underscore
    const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, '');

    // Prevent SQL keywords as identifiers (basic check)
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER'];
    if (sqlKeywords.includes(sanitized.toUpperCase())) {
      throw new Error(`Invalid identifier: ${identifier}`);
    }

    // Quote identifier based on database type
    switch (this.dbType) {
      case 'postgresql':
        return `"${sanitized}"`;
      case 'mysql':
        return `\`${sanitized}\``;
      case 'sqlite':
        return `"${sanitized}"`;
      default:
        return `"${sanitized}"`;
    }
  }

  /**
   * Build and return query with parameters
   */
  build() {
    return {
      query: this.query,
      parameters: this.parameters
    };
  }

  /**
   * Reset builder
   */
  reset() {
    this.query = '';
    this.parameters = [];
    this.parameterIndex = 1;
    return this;
  }
}

/**
 * PostgreSQL Query Helper
 * Wrapper for node-postgres (pg) with built-in security
 */
class PostgreSQLHelper {
  constructor(pool) {
    this.pool = pool; // pg.Pool instance
  }

  /**
   * Execute parameterized query
   */
  async query(text, params = []) {
    try {
      const result = await this.pool.query(text, params);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', {
        error: error.message,
        query: text,
        // Don't log parameters (may contain sensitive data)
      });
      throw new Error('Database operation failed');
    }
  }

  /**
   * Find records
   */
  async find(table, conditions = {}, options = {}) {
    const builder = new SQLQueryBuilder('postgresql');
    builder.select(table, options.columns || ['*'], conditions);

    if (options.orderBy) {
      builder.orderBy(options.orderBy, options.orderDirection);
    }

    if (options.limit) {
      builder.limit(options.limit);
    }

    if (options.offset) {
      builder.offset(options.offset);
    }

    const { query, parameters } = builder.build();
    return await this.query(query, parameters);
  }

  /**
   * Find one record
   */
  async findOne(table, conditions = {}) {
    const results = await this.find(table, conditions, { limit: 1 });
    return results[0] || null;
  }

  /**
   * Insert record
   */
  async insert(table, data) {
    const builder = new SQLQueryBuilder('postgresql');
    builder.insert(table, data);
    builder.query += ' RETURNING *';

    const { query, parameters } = builder.build();
    const results = await this.query(query, parameters);
    return results[0];
  }

  /**
   * Update records
   */
  async update(table, data, conditions = {}) {
    const builder = new SQLQueryBuilder('postgresql');
    builder.update(table, data, conditions);
    builder.query += ' RETURNING *';

    const { query, parameters } = builder.build();
    return await this.query(query, parameters);
  }

  /**
   * Delete records
   */
  async delete(table, conditions = {}) {
    if (Object.keys(conditions).length === 0) {
      throw new Error('DELETE requires WHERE conditions');
    }

    const builder = new SQLQueryBuilder('postgresql');
    builder.delete(table, conditions);

    const { query, parameters } = builder.build();
    return await this.query(query, parameters);
  }

  /**
   * Execute in transaction
   */
  async transaction(callback) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

/**
 * Input validation for SQL operations
 */
const SQLValidation = {
  /**
   * Validate table name
   */
  isValidTableName(tableName) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName);
  },

  /**
   * Validate column name
   */
  isValidColumnName(columnName) {
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(columnName);
  },

  /**
   * Validate ORDER BY direction
   */
  isValidSortDirection(direction) {
    return ['ASC', 'DESC'].includes(direction.toUpperCase());
  },

  /**
   * Sanitize LIKE pattern
   */
  sanitizeLikePattern(pattern) {
    // Escape special characters in LIKE patterns
    return pattern.replace(/[%_\\]/g, '\\$&');
  },

  /**
   * Validate pagination parameters
   */
  validatePagination(limit, offset) {
    const safeLimit = Math.min(Math.max(1, parseInt(limit, 10) || 10), 1000);
    const safeOffset = Math.max(0, parseInt(offset, 10) || 0);

    return { limit: safeLimit, offset: safeOffset };
  }
};

/**
 * ORM-like interface for safe database operations
 */
class SafeModel {
  constructor(tableName, schema, dbHelper) {
    this.tableName = tableName;
    this.schema = schema;
    this.db = dbHelper;
  }

  /**
   * Validate data against schema
   */
  validate(data) {
    const errors = [];

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null)) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
        }

        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rules.maxLength}`);
        }

        if (rules.min && typeof value === 'number' && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }

        if (rules.max && typeof value === 'number' && value > rules.max) {
          errors.push(`${field} must be at most ${rules.max}`);
        }

        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Find records
   */
  async find(conditions = {}, options = {}) {
    return await this.db.find(this.tableName, conditions, options);
  }

  /**
   * Find by ID
   */
  async findById(id) {
    return await this.db.findOne(this.tableName, { id });
  }

  /**
   * Create record
   */
  async create(data) {
    const validation = this.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.db.insert(this.tableName, data);
  }

  /**
   * Update record
   */
  async update(id, data) {
    const validation = this.validate(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return await this.db.update(this.tableName, data, { id });
  }

  /**
   * Delete record
   */
  async delete(id) {
    return await this.db.delete(this.tableName, { id });
  }
}

/**
 * Example usage and best practices
 */
const USAGE_EXAMPLES = {
  postgresql: `
    // PostgreSQL with parameterized queries
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = new PostgreSQLHelper(pool);

    // Safe SELECT
    const users = await db.find('users', { active: true });

    // Safe INSERT
    const newUser = await db.insert('users', {
      username: 'john',
      email: 'john@example.com'
    });

    // Safe UPDATE
    await db.update('users', { active: false }, { id: 123 });

    // Safe DELETE
    await db.delete('users', { id: 123 });
  `,

  queryBuilder: `
    // Using query builder
    const builder = new SQLQueryBuilder('postgresql');

    const { query, parameters } = builder
      .select('users', ['id', 'username', 'email'], { active: true })
      .orderBy('created_at', 'DESC')
      .limit(10)
      .build();

    // Execute with pg
    const result = await pool.query(query, parameters);
  `,

  model: `
    // Using safe model
    const userSchema = {
      username: { type: 'string', required: true, maxLength: 50 },
      email: { type: 'string', required: true, pattern: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/ },
      age: { type: 'number', min: 0, max: 150 }
    };

    const UserModel = new SafeModel('users', userSchema, db);

    const user = await UserModel.create({
      username: 'john',
      email: 'john@example.com',
      age: 30
    });
  `
};

module.exports = {
  SQLQueryBuilder,
  PostgreSQLHelper,
  SQLValidation,
  SafeModel,
  USAGE_EXAMPLES
};
