/**
 * Input Sanitization Middleware
 *
 * Comprehensive input validation and sanitization to prevent injection attacks
 * Implements defense-in-depth security strategy
 *
 * NIST Controls Addressed:
 * - SI-10: Information Input Validation
 * - SI-11: Error Handling
 * - SC-5: Denial of Service Protection
 */

const mongoSanitize = require('express-mongo-sanitize');

/**
 * Sanitization Configuration
 */
const SANITIZATION_CONFIG = {
  // Maximum input sizes to prevent DoS
  maxStringLength: 10000,
  maxArrayLength: 1000,
  maxObjectDepth: 10,

  // Characters to strip or escape
  dangerousPatterns: [
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc)
    /<iframe[^>]*>.*?<\/iframe>/gi, // Iframes
    /<object[^>]*>.*?<\/object>/gi, // Objects
    /<embed[^>]*>/gi // Embeds
  ],

  // SQL keywords to monitor (not block, just log)
  sqlKeywords: [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
    'ALTER', 'EXEC', 'EXECUTE', 'UNION', '--', ';--', 'xp_'
  ],

  // NoSQL injection patterns
  noSqlPatterns: [
    '$where', '$ne', '$gt', '$lt', '$gte', '$lte',
    '$in', '$nin', '$regex', '$exists', '$type'
  ]
};

/**
 * Sanitize string input
 * @param {string} input - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(input) {
  if (typeof input !== 'string') {
    return input;
  }

  let sanitized = input;

  // Remove dangerous patterns
  for (const pattern of SANITIZATION_CONFIG.dangerousPatterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  // Trim whitespace
  sanitized = sanitized.trim();

  // Limit length
  if (sanitized.length > SANITIZATION_CONFIG.maxStringLength) {
    sanitized = sanitized.substring(0, SANITIZATION_CONFIG.maxStringLength);
  }

  return sanitized;
}

/**
 * Sanitize object recursively
 * @param {*} obj - Object to sanitize
 * @param {number} depth - Current depth
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj, depth = 0) {
  // Prevent deep recursion attacks
  if (depth > SANITIZATION_CONFIG.maxObjectDepth) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  // Handle null/undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    // Limit array length
    const limitedArray = obj.slice(0, SANITIZATION_CONFIG.maxArrayLength);
    return limitedArray.map(item => sanitizeObject(item, depth + 1));
  }

  // Handle objects
  if (typeof obj === 'object') {
    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeString(key);

      // Skip NoSQL operators at root level
      if (depth === 0 && sanitizedKey.startsWith('$')) {
        console.warn('NoSQL operator detected in input:', sanitizedKey);
        continue;
      }

      // Recursively sanitize value
      sanitized[sanitizedKey] = sanitizeObject(value, depth + 1);
    }

    return sanitized;
  }

  // Handle strings
  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  // Return other types as-is (numbers, booleans)
  return obj;
}

/**
 * Check for SQL injection patterns
 * @param {string} input - Input to check
 * @returns {boolean} True if suspicious patterns found
 */
function containsSQLInjection(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const upperInput = input.toUpperCase();

  // Check for SQL keywords in suspicious contexts
  for (const keyword of SANITIZATION_CONFIG.sqlKeywords) {
    if (upperInput.includes(keyword)) {
      // Additional context check
      if (upperInput.includes(keyword + ' ') || upperInput.includes(' ' + keyword)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check for NoSQL injection patterns
 * @param {*} input - Input to check
 * @returns {boolean} True if suspicious patterns found
 */
function containsNoSQLInjection(input) {
  if (typeof input === 'object' && input !== null) {
    const keys = Object.keys(input);
    for (const key of keys) {
      if (SANITIZATION_CONFIG.noSqlPatterns.some(pattern => key.includes(pattern))) {
        return true;
      }
    }
  }

  if (typeof input === 'string') {
    return SANITIZATION_CONFIG.noSqlPatterns.some(pattern =>
      input.includes(pattern)
    );
  }

  return false;
}

/**
 * Main sanitization middleware
 * Sanitizes all incoming request data
 */
function sanitizeInput(req, res, next) {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    res.status(400).json({
      error: 'Invalid input data',
      code: 'SANITIZATION_ERROR'
    });
  }
}

/**
 * SQL injection detection middleware
 * Logs and blocks suspicious SQL patterns
 */
function detectSQLInjection(req, res, next) {
  const inputs = [
    ...Object.values(req.body || {}),
    ...Object.values(req.query || {}),
    ...Object.values(req.params || {})
  ];

  for (const input of inputs) {
    if (containsSQLInjection(String(input))) {
      console.error('SQL Injection attempt detected:', {
        ip: req.ip,
        user: req.user?.username,
        path: req.path,
        method: req.method,
        input: String(input).substring(0, 100)
      });

      return res.status(400).json({
        error: 'Invalid input detected',
        code: 'SUSPICIOUS_INPUT'
      });
    }
  }

  next();
}

/**
 * NoSQL injection detection middleware
 */
function detectNoSQLInjection(req, res, next) {
  if (containsNoSQLInjection(req.body)) {
    console.error('NoSQL Injection attempt detected:', {
      ip: req.ip,
      user: req.user?.username,
      path: req.path,
      method: req.method
    });

    return res.status(400).json({
      error: 'Invalid input detected',
      code: 'SUSPICIOUS_INPUT'
    });
  }

  next();
}

/**
 * MongoDB sanitization middleware
 * Uses express-mongo-sanitize to remove $ and . from user input
 */
const mongoDBSanitize = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with underscore
  onSanitize: ({ req, key }) => {
    console.warn('MongoDB injection attempt detected:', {
      ip: req.ip,
      key: key,
      path: req.path
    });
  }
});

/**
 * Content-Type validation middleware
 * Ensures request has expected content type
 */
function validateContentType(expectedTypes = ['application/json']) {
  return (req, res, next) => {
    // Skip for GET/DELETE requests (no body expected)
    if (['GET', 'DELETE', 'HEAD'].includes(req.method)) {
      return next();
    }

    const contentType = req.get('Content-Type');

    if (!contentType) {
      return res.status(400).json({
        error: 'Content-Type header required',
        code: 'MISSING_CONTENT_TYPE'
      });
    }

    const isValid = expectedTypes.some(type =>
      contentType.toLowerCase().includes(type.toLowerCase())
    );

    if (!isValid) {
      return res.status(415).json({
        error: 'Unsupported Content-Type',
        expected: expectedTypes,
        received: contentType,
        code: 'INVALID_CONTENT_TYPE'
      });
    }

    next();
  };
}

/**
 * Request size limiter
 * Prevents large payload attacks
 */
function limitRequestSize(maxSizeKB = 100) {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length') || '0', 10);
    const maxSizeBytes = maxSizeKB * 1024;

    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        error: 'Request payload too large',
        maxSize: `${maxSizeKB}KB`,
        received: `${Math.round(contentLength / 1024)}KB`,
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    next();
  };
}

/**
 * Parameter pollution prevention
 * Ensures parameters appear only once
 */
const hpp = require('hpp');

const parameterPollutionProtection = hpp({
  whitelist: ['fiscalYear', 'status', 'department', 'sort'], // Allow arrays for these
  checkQuery: true,
  checkBody: true
});

/**
 * Escape HTML entities
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHTML(str) {
  if (typeof str !== 'string') {
    return str;
  }

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char]);
}

/**
 * Deep escape HTML in objects
 * @param {*} obj - Object to escape
 * @returns {*} Escaped object
 */
function escapeHTMLDeep(obj) {
  if (typeof obj === 'string') {
    return escapeHTML(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(escapeHTMLDeep);
  }

  if (typeof obj === 'object' && obj !== null) {
    const escaped = {};
    for (const [key, value] of Object.entries(obj)) {
      escaped[key] = escapeHTMLDeep(value);
    }
    return escaped;
  }

  return obj;
}

/**
 * HTML escape middleware
 * Escapes HTML entities in output (use for HTML responses)
 */
function escapeHTMLOutput(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Only escape if sending HTML-rendered content
    if (req.get('Accept')?.includes('text/html')) {
      data = escapeHTMLDeep(data);
    }
    return originalJson(data);
  };

  next();
}

/**
 * Whitelist input fields
 * Only allow specified fields in request body
 */
function whitelistFields(allowedFields = []) {
  return (req, res, next) => {
    if (!req.body) {
      return next();
    }

    const sanitized = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    }

    req.body = sanitized;
    next();
  };
}

/**
 * Comprehensive input validation middleware chain
 * Combines all sanitization techniques
 */
function comprehensiveSanitization() {
  return [
    mongoDBSanitize,
    sanitizeInput,
    detectSQLInjection,
    detectNoSQLInjection,
    parameterPollutionProtection
  ];
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeInput,
  detectSQLInjection,
  detectNoSQLInjection,
  mongoDBSanitize,
  validateContentType,
  limitRequestSize,
  parameterPollutionProtection,
  escapeHTML,
  escapeHTMLDeep,
  escapeHTMLOutput,
  whitelistFields,
  comprehensiveSanitization,
  SANITIZATION_CONFIG
};
