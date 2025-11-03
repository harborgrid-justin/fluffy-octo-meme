/**
 * API Gateway Middleware
 *
 * Implements API Gateway pattern with:
 * - Request routing and versioning
 * - Rate limiting
 * - Authentication/Authorization
 * - Request/Response transformation
 * - Logging and monitoring
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * API Version Router
 *
 * Routes requests to appropriate API version based on header or path
 */
export function apiVersionRouter() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Extract API version from header
    const versionHeader = req.headers['api-version'] as string;

    // Extract API version from path (e.g., /api/v1/...)
    const pathVersion = req.path.match(/^\/api\/(v\d+)\//)?[1];

    // Determine final version (header takes precedence)
    const apiVersion = versionHeader || pathVersion || 'v1';

    // Store version in request for later use
    (req as any).apiVersion = apiVersion;

    // Add version to response headers
    res.setHeader('X-API-Version', apiVersion);

    next();
  };
}

/**
 * Rate Limiter Factory
 *
 * Creates rate limiters for different API tiers
 */
export class RateLimiterFactory {
  /**
   * Global rate limiter - applies to all requests
   */
  static global() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per window
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP, please try again later.',
          retryAfter: res.getHeader('Retry-After'),
        });
      },
    });
  }

  /**
   * Authentication rate limiter - stricter limits for auth endpoints
   */
  static auth() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit to 5 login attempts
      skipSuccessfulRequests: true, // Don't count successful logins
      message: {
        error: 'Too many authentication attempts',
        retryAfter: '15 minutes',
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  /**
   * Tier-based rate limiter
   */
  static tiered() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;

      // Determine rate limit based on user tier/role
      let maxRequests = 100; // Default for basic users
      let windowMs = 15 * 60 * 1000; // 15 minutes

      if (user) {
        switch (user.role) {
          case 'super_admin':
          case 'admin':
            maxRequests = 10000; // High limit for admins
            break;
          case 'budget_analyst':
          case 'program_manager':
            maxRequests = 1000; // Medium limit for power users
            break;
          default:
            maxRequests = 100; // Low limit for regular users
        }
      }

      // Apply rate limit
      const limiter = rateLimit({
        windowMs,
        max: maxRequests,
        message: {
          error: 'Rate limit exceeded for your tier',
          tier: user?.role || 'guest',
          limit: maxRequests,
        },
        standardHeaders: true,
        legacyHeaders: false,
      });

      return limiter(req, res, next);
    };
  }

  /**
   * Tenant-based rate limiter
   */
  static tenant() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const tenantId = (req as any).tenantId;

      if (!tenantId) {
        return next();
      }

      // TODO: Get tenant's rate limit from database or cache
      const tenantLimit = await getTenantRateLimit(tenantId);

      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: tenantLimit.maxRequests,
        message: {
          error: 'Tenant rate limit exceeded',
          tenant: tenantId,
          limit: tenantLimit.maxRequests,
        },
        keyGenerator: (req) => tenantId, // Use tenant ID as key
        standardHeaders: true,
        legacyHeaders: false,
      });

      return limiter(req, res, next);
    };
  }

  /**
   * Endpoint-specific rate limiter
   */
  static endpoint(maxRequests: number, windowMs: number = 60000) {
    return rateLimit({
      windowMs,
      max: maxRequests,
      message: {
        error: 'Endpoint rate limit exceeded',
        limit: maxRequests,
        window: `${windowMs / 1000} seconds`,
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
}

/**
 * Request Transformation Middleware
 *
 * Transform and validate incoming requests
 */
export function requestTransformer() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add request ID
    const requestId = req.headers['x-request-id'] as string || generateRequestId();
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Add timestamp
    (req as any).timestamp = new Date();

    // Parse tenant from subdomain or header
    const tenantId = extractTenantId(req);
    if (tenantId) {
      (req as any).tenantId = tenantId;
    }

    // Log request
    console.log(`[API Gateway] ${req.method} ${req.path} - ${requestId}`);

    next();
  };
}

/**
 * Response Transformation Middleware
 *
 * Transform outgoing responses
 */
export function responseTransformer() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data: any) {
      const requestId = (req as any).requestId;
      const timestamp = (req as any).timestamp;

      // Wrap response in standard format
      const response = {
        success: res.statusCode < 400,
        data: res.statusCode < 400 ? data : undefined,
        error: res.statusCode >= 400 ? data : undefined,
        meta: {
          requestId,
          timestamp: timestamp?.toISOString(),
          apiVersion: (req as any).apiVersion || 'v1',
          responseTime: timestamp ? Date.now() - timestamp.getTime() : undefined,
        },
      };

      return originalJson(response);
    };

    next();
  };
}

/**
 * API Gateway Error Handler
 *
 * Centralized error handling for API Gateway
 */
export function apiGatewayErrorHandler() {
  return (err: any, req: Request, res: Response, next: NextFunction) => {
    const requestId = (req as any).requestId;

    console.error(`[API Gateway] Error - ${requestId}:`, err);

    // Determine status code
    const statusCode = err.statusCode || err.status || 500;

    // Send error response
    res.status(statusCode).json({
      error: {
        message: err.message || 'Internal server error',
        code: err.code || 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  };
}

/**
 * CORS Configuration
 *
 * Configure CORS for API Gateway
 */
export function corsConfig() {
  return {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Check if origin is allowed
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Tenant-ID',
      'API-Version',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-API-Version',
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'Retry-After',
    ],
  };
}

/**
 * Health Check Endpoint
 */
export function healthCheck() {
  return (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.API_VERSION || '1.0.0',
    });
  };
}

// Helper functions

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function extractTenantId(req: Request): string | undefined {
  // Try to extract tenant from header
  const headerTenant = req.headers['x-tenant-id'] as string;
  if (headerTenant) return headerTenant;

  // Try to extract from subdomain
  const host = req.headers.host;
  if (host) {
    const subdomain = host.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain;
    }
  }

  // Try to extract from user context (if authenticated)
  const user = (req as any).user;
  if (user?.tenantId) {
    return user.tenantId;
  }

  return undefined;
}

async function getTenantRateLimit(tenantId: string): Promise<{ maxRequests: number }> {
  // TODO: Get tenant configuration from database/cache
  // For now, return default
  return { maxRequests: 1000 };
}

/**
 * Circuit Breaker Pattern
 *
 * Prevents cascading failures
 */
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}
