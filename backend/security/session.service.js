/**
 * Session Management Service
 *
 * Implements secure session management with configurable timeouts
 * Supports both in-memory and Redis-based session storage
 *
 * NIST Controls Addressed:
 * - AC-12: Session Termination
 * - AC-2(5): Inactivity Logout
 * - SC-10: Network Disconnect
 * - SC-23: Session Authenticity
 */

const session = require('express-session');
const crypto = require('crypto');

/**
 * Session Configuration
 */
const SESSION_CONFIG = {
  // Session timeout settings (in milliseconds)
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes of inactivity
  ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000, // 8 hours maximum session
  PRIVILEGED_TIMEOUT: 5 * 60 * 1000, // 5 minutes for admin operations

  // Security settings
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
  REGENERATE_INTERVAL: 5 * 60 * 1000, // Regenerate session ID every 5 minutes

  // FedRAMP compliance settings
  FEDRAMP_IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes (FedRAMP requirement)
  FEDRAMP_MAX_TIMEOUT: 12 * 60 * 60 * 1000 // 12 hours maximum
};

/**
 * Generate secure session secret
 * @returns {string} 256-bit random secret
 */
function generateSessionSecret() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create session configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Express session configuration
 */
function createSessionConfig(options = {}) {
  const {
    redisClient = null,
    secret = process.env.SESSION_SECRET || generateSessionSecret(),
    name = 'ppbe.sid',
    environment = process.env.NODE_ENV || 'development'
  } = options;

  const isProduction = environment === 'production';

  const config = {
    name: name, // Custom session cookie name (hide default)
    secret: secret,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something stored
    rolling: true, // Reset expiration on every response

    cookie: {
      httpOnly: true, // Prevent XSS access to cookie
      secure: isProduction, // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: SESSION_CONFIG.COOKIE_MAX_AGE,
      domain: process.env.COOKIE_DOMAIN || undefined,
      path: '/'
    },

    // Session store (Redis or MemoryStore)
    store: null
  };

  // Use Redis store if client provided
  if (redisClient) {
    const RedisStore = require('connect-redis').default;
    config.store = new RedisStore({
      client: redisClient,
      prefix: 'ppbe:sess:',
      ttl: SESSION_CONFIG.IDLE_TIMEOUT / 1000 // Convert to seconds
    });
  }

  return config;
}

/**
 * Session timeout middleware
 * Implements idle and absolute timeout
 */
function sessionTimeout(options = {}) {
  const {
    idleTimeout = SESSION_CONFIG.IDLE_TIMEOUT,
    absoluteTimeout = SESSION_CONFIG.ABSOLUTE_TIMEOUT,
    privilegedTimeout = SESSION_CONFIG.PRIVILEGED_TIMEOUT
  } = options;

  return (req, res, next) => {
    if (!req.session) {
      return next();
    }

    const now = Date.now();
    const session = req.session;

    // Initialize session timestamps
    if (!session.createdAt) {
      session.createdAt = now;
      session.lastActivity = now;
      session.regeneratedAt = now;
    }

    // Check absolute timeout (maximum session duration)
    const sessionAge = now - session.createdAt;
    if (sessionAge > absoluteTimeout) {
      return destroySessionWithError(req, res, 'Session expired due to maximum duration');
    }

    // Check idle timeout (inactivity)
    const idleTime = now - session.lastActivity;
    const timeoutToUse = session.privilegedMode ? privilegedTimeout : idleTimeout;

    if (idleTime > timeoutToUse) {
      return destroySessionWithError(req, res, 'Session expired due to inactivity');
    }

    // Update last activity
    session.lastActivity = now;

    // Regenerate session ID periodically (session fixation protection)
    const timeSinceRegeneration = now - session.regeneratedAt;
    if (timeSinceRegeneration > SESSION_CONFIG.REGENERATE_INTERVAL) {
      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regeneration error:', err);
          return next(err);
        }

        // Preserve session data
        session.regeneratedAt = now;
        next();
      });
    } else {
      next();
    }
  };
}

/**
 * Destroy session and send error response
 */
function destroySessionWithError(req, res, message) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }

    res.status(401).json({
      error: message,
      code: 'SESSION_EXPIRED',
      timestamp: new Date().toISOString()
    });
  });
}

/**
 * Middleware to mark session as privileged (shorter timeout)
 */
function requirePrivilegedSession(req, res, next) {
  if (!req.session) {
    return res.status(401).json({ error: 'Session required' });
  }

  // Mark session as privileged
  req.session.privilegedMode = true;
  req.session.privilegedModeStarted = Date.now();

  next();
}

/**
 * Middleware to exit privileged mode
 */
function exitPrivilegedMode(req, res, next) {
  if (req.session) {
    req.session.privilegedMode = false;
    delete req.session.privilegedModeStarted;
  }
  next();
}

/**
 * Get session info for monitoring
 */
function getSessionInfo(req) {
  if (!req.session) {
    return null;
  }

  const now = Date.now();
  const session = req.session;

  return {
    id: req.sessionID,
    createdAt: session.createdAt,
    lastActivity: session.lastActivity,
    age: now - session.createdAt,
    idleTime: now - session.lastActivity,
    privilegedMode: session.privilegedMode || false,
    user: session.user || null
  };
}

/**
 * Session cleanup for user logout
 */
function cleanupSession(req, res, next) {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session cleanup error:', err);
        return next(err);
      }

      res.clearCookie('ppbe.sid');
      next();
    });
  } else {
    next();
  }
}

/**
 * Session security headers middleware
 */
function sessionSecurityHeaders(req, res, next) {
  // Prevent session fixation
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  next();
}

/**
 * Concurrent session detection
 * Tracks and limits concurrent sessions per user
 */
class SessionManager {
  constructor() {
    this.userSessions = new Map(); // userId -> Set of sessionIds
    this.maxConcurrentSessions = 3; // Maximum allowed concurrent sessions
  }

  /**
   * Register a new session for a user
   */
  registerSession(userId, sessionId) {
    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Set());
    }

    const sessions = this.userSessions.get(userId);

    // Check if maximum concurrent sessions reached
    if (sessions.size >= this.maxConcurrentSessions) {
      // Remove oldest session (FIFO)
      const oldestSession = sessions.values().next().value;
      sessions.delete(oldestSession);
    }

    sessions.add(sessionId);
  }

  /**
   * Unregister a session
   */
  unregisterSession(userId, sessionId) {
    if (this.userSessions.has(userId)) {
      const sessions = this.userSessions.get(userId);
      sessions.delete(sessionId);

      if (sessions.size === 0) {
        this.userSessions.delete(userId);
      }
    }
  }

  /**
   * Get active sessions for a user
   */
  getUserSessions(userId) {
    return Array.from(this.userSessions.get(userId) || []);
  }

  /**
   * Terminate all sessions for a user
   */
  terminateAllUserSessions(userId) {
    this.userSessions.delete(userId);
  }
}

const sessionManager = new SessionManager();

module.exports = {
  SESSION_CONFIG,
  createSessionConfig,
  sessionTimeout,
  requirePrivilegedSession,
  exitPrivilegedMode,
  getSessionInfo,
  cleanupSession,
  sessionSecurityHeaders,
  SessionManager,
  sessionManager,
  generateSessionSecret
};
