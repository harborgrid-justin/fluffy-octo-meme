/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Implements modern CSRF protection using synchronizer tokens
 * and Double Submit Cookie pattern
 *
 * NIST Controls Addressed:
 * - SC-8: Transmission Confidentiality and Integrity
 * - SC-23: Session Authenticity
 * - SI-10: Information Input Validation
 */

const crypto = require('crypto');

/**
 * CSRF Configuration
 */
const CSRF_CONFIG = {
  // Token settings
  tokenLength: 32, // bytes
  tokenLifetime: 3600000, // 1 hour in milliseconds
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-CSRF-Token',

  // Cookie options
  cookieOptions: {
    httpOnly: false, // Must be false so JavaScript can read it
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict', // Prevent CSRF by design
    path: '/',
    maxAge: 3600000 // 1 hour
  },

  // Methods to protect (state-changing operations)
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  // Paths to exclude from CSRF protection
  excludePaths: [
    '/api/auth/login',
    '/api/auth/register',
    '/api/health'
  ]
};

/**
 * CSRF Token Store
 * In-memory storage (use Redis in production for scalability)
 */
class CSRFTokenStore {
  constructor() {
    this.tokens = new Map(); // token -> { userId, createdAt, sessionId }
  }

  /**
   * Generate a new CSRF token
   */
  generateToken() {
    return crypto.randomBytes(CSRF_CONFIG.tokenLength).toString('hex');
  }

  /**
   * Store token
   */
  storeToken(token, userId, sessionId) {
    this.tokens.set(token, {
      userId,
      sessionId,
      createdAt: Date.now()
    });

    // Clean up expired tokens
    this.cleanupExpiredTokens();
  }

  /**
   * Validate token
   */
  validateToken(token, userId, sessionId) {
    const tokenData = this.tokens.get(token);

    if (!tokenData) {
      return false;
    }

    // Check if token is expired
    const age = Date.now() - tokenData.createdAt;
    if (age > CSRF_CONFIG.tokenLifetime) {
      this.tokens.delete(token);
      return false;
    }

    // Verify token belongs to this user and session
    if (tokenData.userId !== userId || tokenData.sessionId !== sessionId) {
      return false;
    }

    return true;
  }

  /**
   * Remove token
   */
  removeToken(token) {
    this.tokens.delete(token);
  }

  /**
   * Remove all tokens for a user
   */
  removeUserTokens(userId) {
    for (const [token, data] of this.tokens.entries()) {
      if (data.userId === userId) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Clean up expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();

    for (const [token, data] of this.tokens.entries()) {
      const age = now - data.createdAt;
      if (age > CSRF_CONFIG.tokenLifetime) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Get token count for monitoring
   */
  getTokenCount() {
    return this.tokens.size;
  }
}

const csrfTokenStore = new CSRFTokenStore();

// Run cleanup every 5 minutes
setInterval(() => {
  csrfTokenStore.cleanupExpiredTokens();
}, 5 * 60 * 1000);

/**
 * Generate and set CSRF token
 * Creates a new token and stores it in cookie and session
 */
function generateCSRFToken(req, res, next) {
  // Skip if no session
  if (!req.session) {
    return next();
  }

  // Generate new token
  const token = csrfTokenStore.generateToken();

  // Store in session
  req.session.csrfToken = token;

  // Store in token store
  const userId = req.user?.id || req.session.id;
  const sessionId = req.sessionID || req.session.id;
  csrfTokenStore.storeToken(token, userId, sessionId);

  // Set cookie for client to read
  res.cookie(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);

  // Attach to response for API calls
  res.locals.csrfToken = token;

  next();
}

/**
 * Verify CSRF token
 * Validates token from header or body against stored token
 */
function verifyCSRFToken(req, res, next) {
  // Skip for non-protected methods
  if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
    return next();
  }

  // Skip for excluded paths
  if (CSRF_CONFIG.excludePaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Skip if no session (unauthenticated requests)
  if (!req.session) {
    return next();
  }

  // Get token from header, body, or query
  const token = req.get(CSRF_CONFIG.headerName) ||
                req.body?._csrf ||
                req.query?._csrf;

  if (!token) {
    console.error('CSRF token missing:', {
      ip: req.ip,
      user: req.user?.username,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'CSRF token missing',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  // Validate token
  const userId = req.user?.id || req.session.id;
  const sessionId = req.sessionID || req.session.id;

  const isValid = csrfTokenStore.validateToken(token, userId, sessionId);

  if (!isValid) {
    console.error('CSRF token invalid:', {
      ip: req.ip,
      user: req.user?.username,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'Invalid or expired CSRF token',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
}

/**
 * CSRF protection middleware (combined)
 * Generates token for GET requests, validates for state-changing operations
 */
function csrfProtection(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    // Generate token for safe methods
    return generateCSRFToken(req, res, next);
  } else {
    // Verify token for state-changing methods
    return verifyCSRFToken(req, res, next);
  }
}

/**
 * Get CSRF token endpoint
 * Allows clients to request a fresh CSRF token
 */
function getCSRFToken(req, res) {
  const token = csrfTokenStore.generateToken();

  if (req.session) {
    req.session.csrfToken = token;
  }

  const userId = req.user?.id || req.session?.id || 'anonymous';
  const sessionId = req.sessionID || req.session?.id || 'anonymous';
  csrfTokenStore.storeToken(token, userId, sessionId);

  res.cookie(CSRF_CONFIG.cookieName, token, CSRF_CONFIG.cookieOptions);

  res.json({
    csrfToken: token,
    headerName: CSRF_CONFIG.headerName,
    cookieName: CSRF_CONFIG.cookieName
  });
}

/**
 * Refresh CSRF token
 * Generates a new token and invalidates the old one
 */
function refreshCSRFToken(req, res, next) {
  // Remove old token
  if (req.session?.csrfToken) {
    csrfTokenStore.removeToken(req.session.csrfToken);
  }

  // Generate new token
  generateCSRFToken(req, res, next);
}

/**
 * Clear CSRF tokens on logout
 */
function clearCSRFTokens(req, res, next) {
  const userId = req.user?.id || req.session?.id;

  if (userId) {
    csrfTokenStore.removeUserTokens(userId);
  }

  if (req.session?.csrfToken) {
    csrfTokenStore.removeToken(req.session.csrfToken);
  }

  res.clearCookie(CSRF_CONFIG.cookieName);

  next();
}

/**
 * Double Submit Cookie Pattern
 * Alternative CSRF protection method
 */
class DoubleSubmitCookie {
  constructor() {
    this.cookieName = 'csrf-token';
    this.headerName = 'X-CSRF-Token';
  }

  /**
   * Generate token and set cookie
   */
  generate(req, res, next) {
    const token = crypto.randomBytes(32).toString('hex');

    res.cookie(this.cookieName, token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 3600000
    });

    next();
  }

  /**
   * Verify token matches cookie
   */
  verify(req, res, next) {
    // Skip for safe methods
    if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
      return next();
    }

    const cookieToken = req.cookies?.[this.cookieName];
    const headerToken = req.get(this.headerName);

    if (!cookieToken || !headerToken) {
      return res.status(403).json({
        error: 'CSRF token missing',
        code: 'CSRF_TOKEN_MISSING'
      });
    }

    // Use timing-safe comparison
    if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
      return res.status(403).json({
        error: 'CSRF token mismatch',
        code: 'CSRF_TOKEN_MISMATCH'
      });
    }

    next();
  }

  /**
   * Combined middleware
   */
  middleware() {
    return [
      (req, res, next) => this.generate(req, res, next),
      (req, res, next) => this.verify(req, res, next)
    ];
  }
}

/**
 * SameSite Cookie attribute
 * Modern CSRF protection built into browsers
 */
function enforceSameSite(req, res, next) {
  // Ensure all cookies have SameSite attribute
  const originalCookie = res.cookie.bind(res);

  res.cookie = function (name, value, options = {}) {
    const secureOptions = {
      ...options,
      sameSite: options.sameSite || 'strict',
      secure: options.secure !== false && process.env.NODE_ENV === 'production'
    };

    return originalCookie(name, value, secureOptions);
  };

  next();
}

/**
 * Origin verification
 * Additional CSRF protection layer
 */
function verifyOrigin(req, res, next) {
  // Skip for safe methods
  if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
    return next();
  }

  const origin = req.get('Origin') || req.get('Referer');

  if (!origin) {
    console.warn('Origin/Referer header missing:', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    // Don't block if origin is missing (some legitimate clients don't send it)
    // But log for monitoring
    return next();
  }

  // Extract hostname from origin
  const originHost = new URL(origin).hostname;
  const expectedHost = req.hostname;

  if (originHost !== expectedHost) {
    console.error('Origin mismatch detected:', {
      ip: req.ip,
      expected: expectedHost,
      received: originHost,
      path: req.path,
      method: req.method
    });

    return res.status(403).json({
      error: 'Origin verification failed',
      code: 'ORIGIN_MISMATCH'
    });
  }

  next();
}

/**
 * Custom request header verification
 * Require custom header for AJAX requests
 */
function requireCustomHeader(headerName = 'X-Requested-With') {
  return (req, res, next) => {
    // Skip for safe methods
    if (!CSRF_CONFIG.protectedMethods.includes(req.method)) {
      return next();
    }

    const headerValue = req.get(headerName);

    if (!headerValue) {
      return res.status(403).json({
        error: 'Custom header required',
        code: 'CUSTOM_HEADER_MISSING'
      });
    }

    next();
  };
}

/**
 * Comprehensive CSRF protection
 * Combines multiple CSRF defense techniques
 */
function comprehensiveCSRFProtection() {
  return [
    enforceSameSite,
    csrfProtection,
    verifyOrigin
  ];
}

/**
 * CSRF protection for API documentation
 */
const CSRF_USAGE_GUIDE = {
  clientSetup: `
    // Frontend: Get CSRF token from cookie or API
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    // Include in all state-changing requests
    fetch('/api/resource', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify(data)
    });
  `,

  tokenRefresh: `
    // Get fresh CSRF token
    GET /api/csrf-token

    Response:
    {
      "csrfToken": "abc123...",
      "headerName": "X-CSRF-Token",
      "cookieName": "XSRF-TOKEN"
    }
  `,

  testingExemption: `
    // For testing, you can exempt specific routes
    CSRF_CONFIG.excludePaths.push('/api/test');
  `
};

module.exports = {
  csrfProtection,
  generateCSRFToken,
  verifyCSRFToken,
  getCSRFToken,
  refreshCSRFToken,
  clearCSRFTokens,
  DoubleSubmitCookie,
  enforceSameSite,
  verifyOrigin,
  requireCustomHeader,
  comprehensiveCSRFProtection,
  csrfTokenStore,
  CSRF_CONFIG,
  CSRF_USAGE_GUIDE
};
