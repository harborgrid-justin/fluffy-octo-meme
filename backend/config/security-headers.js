/**
 * Security Headers Configuration
 *
 * Implements comprehensive HTTP security headers using Helmet.js
 * Compliant with OWASP and federal security requirements
 *
 * NIST Controls Addressed:
 * - SC-8: Transmission Confidentiality and Integrity
 * - SC-23: Session Authenticity
 * - SI-10: Information Input Validation
 * - SI-11: Error Handling
 */

const helmet = require('helmet');

/**
 * Production Security Headers Configuration
 * Strictest security settings for federal systems
 */
const PRODUCTION_CONFIG = {
  // Content Security Policy (CSP)
  // Prevents XSS, injection attacks, and unauthorized resource loading
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        // Add hashes for inline scripts in production
        // "'sha256-...'"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'" // Required for some CSS frameworks
      ],
      imgSrc: [
        "'self'",
        'data:', // Allow data URLs for images
        'https:' // Allow HTTPS images
      ],
      fontSrc: [
        "'self'",
        'https:',
        'data:'
      ],
      connectSrc: [
        "'self'",
        // Add API endpoints here
        // 'https://api.ppbe.gov'
      ],
      frameSrc: ["'none'"], // Prevent iframe embedding
      objectSrc: ["'none'"], // Prevent plugin execution
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      childSrc: ["'none'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"], // Prevent clickjacking
      baseUri: ["'self'"],
      upgradeInsecureRequests: [], // Force HTTPS
      blockAllMixedContent: [] // No mixed HTTP/HTTPS content
    },
    reportOnly: false, // Enforce in production
    useDefaults: false
  },

  // Cross-Origin policies
  crossOriginEmbedderPolicy: { policy: 'require-corp' },
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },

  // DNS prefetch control
  dnsPrefetchControl: { allow: false },

  // Expect-CT (Certificate Transparency)
  expectCt: {
    maxAge: 86400, // 24 hours
    enforce: true
  },

  // Frame options (clickjacking protection)
  frameguard: { action: 'deny' },

  // Hide powered-by header
  hidePoweredBy: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // IE no-open (prevent downloads from opening)
  ieNoOpen: true,

  // No-sniff (prevent MIME type sniffing)
  noSniff: true,

  // Origin-Agent-Cluster
  originAgentCluster: true,

  // Permitted cross-domain policies
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },

  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

  // XSS filter (legacy browsers)
  xssFilter: true
};

/**
 * Development Security Headers Configuration
 * Relaxed settings for local development
 */
const DEVELOPMENT_CONFIG = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Allow inline for dev tools
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
      fontSrc: ["'self'", 'https:', 'data:'],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      baseUri: ["'self'"]
    },
    reportOnly: true // Report-only in development
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  dnsPrefetchControl: { allow: true },
  expectCt: false,
  frameguard: { action: 'sameorigin' },
  hidePoweredBy: true,
  hsts: false, // No HSTS in development (using HTTP)
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: false,
  permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  xssFilter: false
};

/**
 * Get Helmet configuration based on environment
 */
function getHelmetConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
}

/**
 * Initialize Helmet middleware with configuration
 */
function initializeHelmet() {
  const config = getHelmetConfig();
  return helmet(config);
}

/**
 * Custom security headers middleware
 * Additional headers beyond Helmet
 */
function customSecurityHeaders(req, res, next) {
  // Permissions Policy (formerly Feature-Policy)
  // Disable unnecessary browser features
  res.setHeader(
    'Permissions-Policy',
    [
      'geolocation=()',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'encrypted-media=()',
      'picture-in-picture=()'
    ].join(', ')
  );

  // X-Permitted-Cross-Domain-Policies
  // Adobe Flash and PDF security
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Clear-Site-Data (on logout)
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  // Cache-Control for sensitive pages
  if (req.path.includes('/api/')) {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  // X-Request-ID for request tracing
  if (!req.headers['x-request-id']) {
    const crypto = require('crypto');
    req.id = crypto.randomBytes(16).toString('hex');
    res.setHeader('X-Request-ID', req.id);
  }

  next();
}

/**
 * Security headers for API responses
 */
function apiSecurityHeaders(req, res, next) {
  // Ensure JSON content type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // No caching for API responses
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  // CORS security headers (if CORS is needed)
  if (process.env.CORS_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
    res.setHeader('Access-Control-Max-Age', '600'); // 10 minutes
  }

  next();
}

/**
 * Remove sensitive headers from responses
 */
function removeSensitiveHeaders(req, res, next) {
  // Remove headers that leak information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  next();
}

/**
 * Content-Type validation
 * Ensure proper content type is set
 */
function enforceContentType(req, res, next) {
  // Override send to ensure Content-Type
  const originalSend = res.send.bind(res);

  res.send = function (data) {
    if (!res.get('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return originalSend(data);
  };

  next();
}

/**
 * Security audit logging
 */
function securityAuditLog(req, res, next) {
  const startTime = Date.now();

  // Log after response
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    // Log security-relevant requests
    if (req.path.includes('/api/auth') || req.path.includes('/api/admin')) {
      console.log('Security Audit:', {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: req.user?.username || 'anonymous'
      });
    }
  });

  next();
}

/**
 * Comprehensive security headers middleware chain
 */
function comprehensiveSecurityHeaders() {
  return [
    initializeHelmet(),
    customSecurityHeaders,
    removeSensitiveHeaders,
    enforceContentType,
    securityAuditLog
  ];
}

/**
 * Security headers testing
 * Check if all required headers are present
 */
function validateSecurityHeaders(headers) {
  const requiredHeaders = [
    'Content-Security-Policy',
    'X-Content-Type-Options',
    'X-Frame-Options',
    'Strict-Transport-Security',
    'Referrer-Policy',
    'Permissions-Policy'
  ];

  const missing = [];
  const present = [];

  for (const header of requiredHeaders) {
    const headerLower = header.toLowerCase();
    const exists = Object.keys(headers).some(h => h.toLowerCase() === headerLower);

    if (exists) {
      present.push(header);
    } else {
      missing.push(header);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
    score: `${present.length}/${requiredHeaders.length}`
  };
}

/**
 * Security headers report
 */
function generateSecurityReport(req, res) {
  const headers = res.getHeaders();
  const validation = validateSecurityHeaders(headers);

  res.json({
    environment: process.env.NODE_ENV,
    validation,
    headers: {
      'Content-Security-Policy': headers['content-security-policy'] || 'Not Set',
      'X-Content-Type-Options': headers['x-content-type-options'] || 'Not Set',
      'X-Frame-Options': headers['x-frame-options'] || 'Not Set',
      'Strict-Transport-Security': headers['strict-transport-security'] || 'Not Set',
      'Referrer-Policy': headers['referrer-policy'] || 'Not Set',
      'Permissions-Policy': headers['permissions-policy'] || 'Not Set',
      'X-XSS-Protection': headers['x-xss-protection'] || 'Not Set'
    },
    recommendations: [
      'Test headers using securityheaders.com',
      'Test CSP using csp-evaluator.withgoogle.com',
      'Enable HSTS preloading: hstspreload.org',
      'Monitor with security scanning tools',
      'Regular security header audits'
    ]
  });
}

/**
 * Security headers documentation
 */
const SECURITY_HEADERS_GUIDE = {
  'Content-Security-Policy': 'Prevents XSS by controlling resource loading',
  'Strict-Transport-Security': 'Forces HTTPS connections',
  'X-Content-Type-Options': 'Prevents MIME type sniffing',
  'X-Frame-Options': 'Prevents clickjacking attacks',
  'X-XSS-Protection': 'Legacy XSS protection for old browsers',
  'Referrer-Policy': 'Controls referrer information',
  'Permissions-Policy': 'Disables unnecessary browser features',
  'Cross-Origin-*': 'Isolates document from cross-origin resources'
};

/**
 * Testing endpoints
 */
const TESTING_TOOLS = [
  {
    name: 'Security Headers',
    url: 'https://securityheaders.com',
    description: 'Scan your site for security headers'
  },
  {
    name: 'Mozilla Observatory',
    url: 'https://observatory.mozilla.org',
    description: 'Comprehensive security scan'
  },
  {
    name: 'CSP Evaluator',
    url: 'https://csp-evaluator.withgoogle.com',
    description: 'Evaluate Content Security Policy'
  },
  {
    name: 'HSTS Preload',
    url: 'https://hstspreload.org',
    description: 'Submit domain for HSTS preload list'
  }
];

module.exports = {
  initializeHelmet,
  getHelmetConfig,
  customSecurityHeaders,
  apiSecurityHeaders,
  removeSensitiveHeaders,
  enforceContentType,
  securityAuditLog,
  comprehensiveSecurityHeaders,
  validateSecurityHeaders,
  generateSecurityReport,
  PRODUCTION_CONFIG,
  DEVELOPMENT_CONFIG,
  SECURITY_HEADERS_GUIDE,
  TESTING_TOOLS
};
