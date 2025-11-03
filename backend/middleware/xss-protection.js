/**
 * XSS (Cross-Site Scripting) Protection Middleware
 *
 * Implements comprehensive XSS prevention strategies
 * Compliant with OWASP XSS Prevention Cheat Sheet
 *
 * NIST Controls Addressed:
 * - SI-10: Information Input Validation
 * - SI-11: Error Handling
 * - SC-8: Transmission Confidentiality
 */

/**
 * XSS Configuration
 */
const XSS_CONFIG = {
  // Dangerous HTML tags to remove
  dangerousTags: [
    'script', 'iframe', 'object', 'embed', 'applet',
    'meta', 'link', 'style', 'form', 'input', 'button',
    'textarea', 'select', 'option', 'base'
  ],

  // Dangerous attributes to remove
  dangerousAttributes: [
    'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
    'onkeydown', 'onkeyup', 'onkeypress', 'onfocus', 'onblur',
    'onchange', 'onsubmit', 'onreset', 'ondblclick', 'oncontextmenu',
    'oninput', 'onwheel', 'ondrag', 'ondrop', 'oncopy', 'onpaste',
    'onanimationstart', 'ontransitionend'
  ],

  // Dangerous protocols in URLs
  dangerousProtocols: [
    'javascript:', 'data:', 'vbscript:', 'file:', 'about:'
  ],

  // Maximum string length for content
  maxContentLength: 100000
};

/**
 * HTML Entity Encoding Map
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Encode HTML entities
 * @param {string} str - String to encode
 * @returns {string} Encoded string
 */
function encodeHTMLEntities(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Decode HTML entities (for specific use cases)
 * @param {string} str - String to decode
 * @returns {string} Decoded string
 */
function decodeHTMLEntities(str) {
  if (typeof str !== 'string') {
    return str;
  }

  const reverseMap = Object.entries(HTML_ENTITIES).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});

  let decoded = str;
  for (const [entity, char] of Object.entries(reverseMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  return decoded;
}

/**
 * Remove dangerous HTML tags
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function removeDangerousTags(html) {
  if (typeof html !== 'string') {
    return html;
  }

  let sanitized = html;

  // Remove script tags and content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove other dangerous tags
  for (const tag of XSS_CONFIG.dangerousTags) {
    const pattern = new RegExp(`<${tag}\\b[^<]*(?:(?!<\\/${tag}>)<[^<]*)*<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(pattern, '');

    // Also remove self-closing versions
    const selfClosingPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingPattern, '');
  }

  return sanitized;
}

/**
 * Remove dangerous attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function removeDangerousAttributes(html) {
  if (typeof html !== 'string') {
    return html;
  }

  let sanitized = html;

  // Remove event handlers
  for (const attr of XSS_CONFIG.dangerousAttributes) {
    const pattern = new RegExp(`${attr}\\s*=\\s*["'][^"']*["']`, 'gi');
    sanitized = sanitized.replace(pattern, '');

    // Also match without quotes
    const patternNoQuotes = new RegExp(`${attr}\\s*=\\s*[^\\s>]*`, 'gi');
    sanitized = sanitized.replace(patternNoQuotes, '');
  }

  return sanitized;
}

/**
 * Sanitize URLs in attributes
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeURLs(html) {
  if (typeof html !== 'string') {
    return html;
  }

  let sanitized = html;

  // Find all href and src attributes
  const urlPattern = /(href|src)\s*=\s*["']([^"']+)["']/gi;

  sanitized = sanitized.replace(urlPattern, (match, attr, url) => {
    // Check for dangerous protocols
    const lowerURL = url.toLowerCase().trim();

    for (const protocol of XSS_CONFIG.dangerousProtocols) {
      if (lowerURL.startsWith(protocol)) {
        return ''; // Remove the attribute entirely
      }
    }

    return match;
  });

  return sanitized;
}

/**
 * Comprehensive HTML sanitization
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML
 */
function sanitizeHTML(html) {
  if (typeof html !== 'string') {
    return html;
  }

  if (html.length > XSS_CONFIG.maxContentLength) {
    html = html.substring(0, XSS_CONFIG.maxContentLength);
  }

  let sanitized = html;

  // Remove dangerous tags
  sanitized = removeDangerousTags(sanitized);

  // Remove dangerous attributes
  sanitized = removeDangerousAttributes(sanitized);

  // Sanitize URLs
  sanitized = sanitizeURLs(sanitized);

  // Encode remaining HTML entities for maximum safety
  // Uncomment if you want to encode everything
  // sanitized = encodeHTMLEntities(sanitized);

  return sanitized;
}

/**
 * Deep XSS sanitization for objects
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObjectXSS(obj, depth = 0) {
  const MAX_DEPTH = 10;

  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeHTML(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectXSS(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObjectXSS(value, depth + 1);
    }
    return sanitized;
  }

  return obj;
}

/**
 * XSS protection middleware for incoming requests
 */
function xssProtectionInput(req, res, next) {
  try {
    // Sanitize body
    if (req.body) {
      req.body = sanitizeObjectXSS(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObjectXSS(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
      req.params = sanitizeObjectXSS(req.params);
    }

    next();
  } catch (error) {
    console.error('XSS protection error:', error);
    res.status(400).json({
      error: 'Invalid input data',
      code: 'XSS_PROTECTION_ERROR'
    });
  }
}

/**
 * XSS protection middleware for outgoing responses
 */
function xssProtectionOutput(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    // Only sanitize if sending to browser (has Accept header)
    const acceptsHTML = req.get('Accept')?.includes('text/html');

    if (acceptsHTML) {
      data = sanitizeObjectXSS(data);
    }

    return originalJson(data);
  };

  next();
}

/**
 * Content Security Policy (CSP) header
 * Primary defense against XSS
 */
function contentSecurityPolicy(options = {}) {
  const defaultDirectives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // unsafe-inline needed for some CSS
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https:', 'data:'],
    connectSrc: ["'self'"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"],
    workerSrc: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'none'"],
    baseUri: ["'self'"],
    upgradeInsecureRequests: []
  };

  const directives = { ...defaultDirectives, ...options };

  return (req, res, next) => {
    const cspString = Object.entries(directives)
      .map(([key, values]) => {
        const directive = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return values.length > 0 ? `${directive} ${values.join(' ')}` : directive;
      })
      .join('; ');

    res.setHeader('Content-Security-Policy', cspString);

    // Also set report-only for testing
    if (process.env.NODE_ENV !== 'production') {
      res.setHeader('Content-Security-Policy-Report-Only', cspString);
    }

    next();
  };
}

/**
 * X-XSS-Protection header
 * Legacy browser XSS protection
 */
function xssProtectionHeader(req, res, next) {
  // Modern browsers: disable (rely on CSP instead)
  // Older browsers: enable with block mode
  res.setHeader('X-XSS-Protection', '0');
  next();
}

/**
 * X-Content-Type-Options header
 * Prevent MIME type sniffing
 */
function noSniff(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/**
 * Detect XSS patterns in input
 * @param {string} input - Input to check
 * @returns {boolean} True if XSS pattern detected
 */
function detectXSSPattern(input) {
  if (typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /eval\(/gi,
    /expression\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * XSS detection middleware
 * Logs and blocks suspicious patterns
 */
function detectXSS(req, res, next) {
  const inputs = [
    JSON.stringify(req.body || {}),
    JSON.stringify(req.query || {}),
    JSON.stringify(req.params || {})
  ];

  for (const input of inputs) {
    if (detectXSSPattern(input)) {
      console.error('XSS attempt detected:', {
        ip: req.ip,
        user: req.user?.username,
        path: req.path,
        method: req.method,
        input: input.substring(0, 200)
      });

      return res.status(400).json({
        error: 'Potentially malicious input detected',
        code: 'XSS_DETECTED'
      });
    }
  }

  next();
}

/**
 * Safe rendering helpers for templates
 */
const SafeRender = {
  /**
   * Escape for HTML context
   */
  html: encodeHTMLEntities,

  /**
   * Escape for HTML attribute context
   */
  attr: (str) => {
    return encodeHTMLEntities(String(str)).replace(/'/g, '&#x27;').replace(/"/g, '&quot;');
  },

  /**
   * Escape for JavaScript context
   */
  js: (str) => {
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/</g, '\\x3C')
      .replace(/>/g, '\\x3E');
  },

  /**
   * Escape for URL context
   */
  url: (str) => {
    return encodeURIComponent(String(str));
  },

  /**
   * Escape for CSS context
   */
  css: (str) => {
    return String(str).replace(/[^a-zA-Z0-9\s-_]/g, '\\$&');
  }
};

/**
 * Comprehensive XSS protection middleware chain
 */
function comprehensiveXSSProtection() {
  return [
    detectXSS,
    xssProtectionInput,
    contentSecurityPolicy(),
    xssProtectionHeader,
    noSniff
  ];
}

/**
 * XSS testing helpers
 */
const XSS_TEST_VECTORS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')">',
  '<body onload=alert("XSS")>',
  '<input type="text" value="x" onfocus=alert("XSS")>',
  '<a href="javascript:alert(\'XSS\')">Click</a>',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>'
];

module.exports = {
  encodeHTMLEntities,
  decodeHTMLEntities,
  sanitizeHTML,
  sanitizeObjectXSS,
  xssProtectionInput,
  xssProtectionOutput,
  contentSecurityPolicy,
  xssProtectionHeader,
  noSniff,
  detectXSS,
  detectXSSPattern,
  SafeRender,
  comprehensiveXSSProtection,
  XSS_CONFIG,
  XSS_TEST_VECTORS
};
