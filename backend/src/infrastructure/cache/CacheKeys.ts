/**
 * Cache Key Constants
 *
 * Centralized cache key management to ensure consistency
 * and easy invalidation across the application.
 */

/**
 * Cache key builder
 */
export class CacheKeys {
  private static readonly PREFIX = 'ppbe';

  /**
   * Budget-related cache keys
   */
  static budget = {
    detail: (id: string) => `${CacheKeys.PREFIX}:budget:${id}`,
    list: (filters: Record<string, any>) =>
      `${CacheKeys.PREFIX}:budgets:list:${JSON.stringify(filters)}`,
    byFiscalYear: (fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:budgets:fy:${fiscalYearId}`,
    byOrganization: (orgId: string) =>
      `${CacheKeys.PREFIX}:budgets:org:${orgId}`,
    summary: (fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:budgets:summary:${fiscalYearId}`,
    pattern: () => `${CacheKeys.PREFIX}:budget*`,
  };

  /**
   * Program-related cache keys
   */
  static program = {
    detail: (id: string) => `${CacheKeys.PREFIX}:program:${id}`,
    list: (filters: Record<string, any>) =>
      `${CacheKeys.PREFIX}:programs:list:${JSON.stringify(filters)}`,
    byFiscalYear: (fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:programs:fy:${fiscalYearId}`,
    execution: (id: string) =>
      `${CacheKeys.PREFIX}:program:execution:${id}`,
    pattern: () => `${CacheKeys.PREFIX}:program*`,
  };

  /**
   * Fiscal year cache keys
   */
  static fiscalYear = {
    detail: (id: string) => `${CacheKeys.PREFIX}:fy:${id}`,
    current: () => `${CacheKeys.PREFIX}:fy:current`,
    list: () => `${CacheKeys.PREFIX}:fy:list`,
    summary: (id: string) => `${CacheKeys.PREFIX}:fy:summary:${id}`,
    pattern: () => `${CacheKeys.PREFIX}:fy*`,
  };

  /**
   * User-related cache keys
   */
  static user = {
    detail: (id: string) => `${CacheKeys.PREFIX}:user:${id}`,
    byUsername: (username: string) =>
      `${CacheKeys.PREFIX}:user:username:${username}`,
    permissions: (id: string) =>
      `${CacheKeys.PREFIX}:user:permissions:${id}`,
    session: (sessionId: string) =>
      `${CacheKeys.PREFIX}:session:${sessionId}`,
    pattern: () => `${CacheKeys.PREFIX}:user*`,
  };

  /**
   * Organization cache keys
   */
  static organization = {
    detail: (id: string) => `${CacheKeys.PREFIX}:org:${id}`,
    hierarchy: (id: string) => `${CacheKeys.PREFIX}:org:hierarchy:${id}`,
    list: () => `${CacheKeys.PREFIX}:orgs:list`,
    pattern: () => `${CacheKeys.PREFIX}:org*`,
  };

  /**
   * Approval workflow cache keys
   */
  static approval = {
    pending: (userId: string) =>
      `${CacheKeys.PREFIX}:approvals:pending:${userId}`,
    byBudget: (budgetId: string) =>
      `${CacheKeys.PREFIX}:approvals:budget:${budgetId}`,
    pattern: () => `${CacheKeys.PREFIX}:approval*`,
  };

  /**
   * Dashboard and analytics cache keys
   */
  static dashboard = {
    summary: (userId: string, fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:dashboard:summary:${userId}:${fiscalYearId}`,
    budgetByDepartment: (fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:dashboard:budget-by-dept:${fiscalYearId}`,
    executionTimeline: (fiscalYearId: string) =>
      `${CacheKeys.PREFIX}:dashboard:execution:${fiscalYearId}`,
    pattern: () => `${CacheKeys.PREFIX}:dashboard*`,
  };

  /**
   * Report cache keys
   */
  static report = {
    detail: (id: string) => `${CacheKeys.PREFIX}:report:${id}`,
    generated: (type: string, params: Record<string, any>) =>
      `${CacheKeys.PREFIX}:report:${type}:${JSON.stringify(params)}`,
    pattern: () => `${CacheKeys.PREFIX}:report*`,
  };

  /**
   * Rate limiting keys
   */
  static rateLimit = {
    api: (ip: string) => `${CacheKeys.PREFIX}:ratelimit:api:${ip}`,
    auth: (ip: string) => `${CacheKeys.PREFIX}:ratelimit:auth:${ip}`,
    pattern: () => `${CacheKeys.PREFIX}:ratelimit*`,
  };

  /**
   * Lock keys for distributed locking
   */
  static lock = {
    budget: (id: string) => `${CacheKeys.PREFIX}:lock:budget:${id}`,
    program: (id: string) => `${CacheKeys.PREFIX}:lock:program:${id}`,
    pattern: () => `${CacheKeys.PREFIX}:lock*`,
  };
}

/**
 * Cache TTL (Time To Live) constants in seconds
 */
export const CacheTTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

/**
 * Cache invalidation strategies
 */
export class CacheInvalidation {
  /**
   * Invalidate budget-related caches
   */
  static async onBudgetUpdate(
    cacheService: any,
    budgetId: string,
    fiscalYearId: string,
    organizationId: string
  ): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.budget.detail(budgetId)),
      cacheService.deletePattern(CacheKeys.budget.byFiscalYear(fiscalYearId)),
      cacheService.deletePattern(CacheKeys.budget.byOrganization(organizationId)),
      cacheService.deletePattern(CacheKeys.dashboard.pattern()),
      cacheService.delete(CacheKeys.fiscalYear.summary(fiscalYearId)),
    ]);
  }

  /**
   * Invalidate program-related caches
   */
  static async onProgramUpdate(
    cacheService: any,
    programId: string,
    fiscalYearId: string
  ): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.program.detail(programId)),
      cacheService.deletePattern(CacheKeys.program.byFiscalYear(fiscalYearId)),
      cacheService.deletePattern(CacheKeys.dashboard.pattern()),
    ]);
  }

  /**
   * Invalidate user-related caches
   */
  static async onUserUpdate(
    cacheService: any,
    userId: string,
    username: string
  ): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.user.detail(userId)),
      cacheService.delete(CacheKeys.user.byUsername(username)),
      cacheService.delete(CacheKeys.user.permissions(userId)),
    ]);
  }

  /**
   * Invalidate fiscal year caches
   */
  static async onFiscalYearUpdate(
    cacheService: any,
    fiscalYearId: string
  ): Promise<void> {
    await Promise.all([
      cacheService.delete(CacheKeys.fiscalYear.detail(fiscalYearId)),
      cacheService.delete(CacheKeys.fiscalYear.current()),
      cacheService.delete(CacheKeys.fiscalYear.list()),
      cacheService.deletePattern(CacheKeys.dashboard.pattern()),
    ]);
  }

  /**
   * Invalidate all caches (use with caution)
   */
  static async clearAll(cacheService: any): Promise<void> {
    await cacheService.clear();
  }
}
