/**
 * Cache Service Implementation
 *
 * Redis-based caching layer with:
 * - Multi-level caching strategy
 * - Cache invalidation
 * - TTL management
 * - Cache warming
 */

import { createClient, RedisClientType } from 'redis';

export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  increment(key: string): Promise<number>;
  decrement(key: string): Promise<number>;
  clear(): Promise<void>;
}

export class CacheService implements ICacheService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private readonly defaultTTL: number = 3600; // 1 hour

  constructor(
    private readonly config: {
      host: string;
      port: number;
      password?: string;
      db?: number;
      keyPrefix?: string;
    }
  ) {}

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db || 0,
      });

      this.client.on('error', (err) => {
        console.error('[CacheService] Redis error:', err);
      });

      this.client.on('connect', () => {
        console.log('[CacheService] Redis connected');
      });

      this.client.on('disconnect', () => {
        console.log('[CacheService] Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('[CacheService] Redis connection established');
    } catch (error) {
      console.error('[CacheService] Failed to connect to Redis:', error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log('[CacheService] Redis disconnected');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn('[CacheService] Cache not connected, skipping get');
        return null;
      }

      const prefixedKey = this.addPrefix(key);
      const value = await this.client.get(prefixedKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('[CacheService] Error getting key:', key, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        console.warn('[CacheService] Cache not connected, skipping set');
        return;
      }

      const prefixedKey = this.addPrefix(key);
      const serialized = JSON.stringify(value);
      const expiresIn = ttl || this.defaultTTL;

      await this.client.setEx(prefixedKey, expiresIn, serialized);
    } catch (error) {
      console.error('[CacheService] Error setting key:', key, error);
    }
  }

  /**
   * Delete single key
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        return;
      }

      const prefixedKey = this.addPrefix(key);
      await this.client.del(prefixedKey);
    } catch (error) {
      console.error('[CacheService] Error deleting key:', key, error);
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        return;
      }

      const prefixedPattern = this.addPrefix(pattern);
      const keys = await this.client.keys(prefixedPattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        console.log(`[CacheService] Deleted ${keys.length} keys matching: ${pattern}`);
      }
    } catch (error) {
      console.error('[CacheService] Error deleting pattern:', pattern, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) {
        return false;
      }

      const prefixedKey = this.addPrefix(key);
      const result = await this.client.exists(prefixedKey);
      return result === 1;
    } catch (error) {
      console.error('[CacheService] Error checking existence:', key, error);
      return false;
    }
  }

  /**
   * Increment counter
   */
  async increment(key: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        return 0;
      }

      const prefixedKey = this.addPrefix(key);
      return await this.client.incr(prefixedKey);
    } catch (error) {
      console.error('[CacheService] Error incrementing key:', key, error);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decrement(key: string): Promise<number> {
    try {
      if (!this.client || !this.isConnected) {
        return 0;
      }

      const prefixedKey = this.addPrefix(key);
      return await this.client.decr(prefixedKey);
    } catch (error) {
      console.error('[CacheService] Error decrementing key:', key, error);
      return 0;
    }
  }

  /**
   * Clear all cache keys with prefix
   */
  async clear(): Promise<void> {
    try {
      if (!this.client || !this.isConnected) {
        return;
      }

      if (this.config.keyPrefix) {
        await this.deletePattern('*');
      } else {
        await this.client.flushDb();
      }

      console.log('[CacheService] Cache cleared');
    } catch (error) {
      console.error('[CacheService] Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    hits: string;
    misses: string;
  }> {
    try {
      if (!this.client || !this.isConnected) {
        return { keys: 0, memory: '0', hits: '0', misses: '0' };
      }

      const info = await this.client.info('stats');
      const keyspace = await this.client.info('keyspace');

      return {
        keys: await this.client.dbSize(),
        memory: this.parseInfo(info, 'used_memory_human'),
        hits: this.parseInfo(info, 'keyspace_hits'),
        misses: this.parseInfo(info, 'keyspace_misses'),
      };
    } catch (error) {
      console.error('[CacheService] Error getting stats:', error);
      return { keys: 0, memory: '0', hits: '0', misses: '0' };
    }
  }

  /**
   * Add key prefix
   */
  private addPrefix(key: string): string {
    return this.config.keyPrefix ? `${this.config.keyPrefix}:${key}` : key;
  }

  /**
   * Parse Redis INFO command output
   */
  private parseInfo(info: string, key: string): string {
    const regex = new RegExp(`${key}:([^\\r\\n]+)`);
    const match = info.match(regex);
    return match ? match[1] : '0';
  }
}

/**
 * Cache-aside pattern helper
 */
export class CacheAsideHelper {
  constructor(private cacheService: ICacheService) {}

  /**
   * Get from cache or load from data source
   */
  async getOrLoad<T>(
    key: string,
    loader: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try cache first
    const cached = await this.cacheService.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Load from source
    const value = await loader();

    // Store in cache
    await this.cacheService.set(key, value, ttl);

    return value;
  }

  /**
   * Invalidate cache after update
   */
  async invalidateAfterUpdate<T>(
    keys: string[],
    updater: () => Promise<T>
  ): Promise<T> {
    // Perform update
    const result = await updater();

    // Invalidate related cache keys
    await Promise.all(keys.map(key => this.cacheService.delete(key)));

    return result;
  }
}

/**
 * Singleton instance
 */
let cacheServiceInstance: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'ppbe',
    });
  }
  return cacheServiceInstance;
}
