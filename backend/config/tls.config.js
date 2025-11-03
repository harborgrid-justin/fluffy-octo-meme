/**
 * TLS/HTTPS Configuration
 *
 * Implements secure HTTPS configuration for federal systems
 * Compliant with NIST SP 800-52 Rev 2 and FedRAMP requirements
 *
 * NIST Controls Addressed:
 * - SC-8: Transmission Confidentiality and Integrity
 * - SC-8(1): Cryptographic Protection
 * - SC-13: Cryptographic Protection
 * - SC-23: Session Authenticity
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * TLS Configuration
 * Based on NIST SP 800-52 Rev 2 guidelines
 */
const TLS_CONFIG = {
  // Minimum TLS version: 1.2 (NIST requirement, 1.3 preferred)
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.3', // Use latest TLS version

  // FIPS 140-2 approved cipher suites
  // Priority order: strongest first
  cipherSuites: [
    // TLS 1.3 cipher suites (AEAD only)
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',

    // TLS 1.2 cipher suites (ECDHE with forward secrecy)
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES128-GCM-SHA256',

    // Additional approved suites for compatibility
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256'
  ].join(':'),

  // Disable weak protocols and ciphers
  disabledProtocols: ['SSLv2', 'SSLv3', 'TLSv1', 'TLSv1.1'],

  // Elliptic curves for ECDHE (NIST approved)
  ecdhCurve: 'prime256v1:secp384r1:secp521r1',

  // Security options
  honorCipherOrder: true, // Server chooses cipher preference
  sessionTimeout: 300, // 5 minutes (per NIST recommendation)
  requestCert: false, // Enable for mutual TLS (mTLS)
  rejectUnauthorized: true // Reject invalid certificates
};

/**
 * Create HTTPS server options
 * @param {Object} options - Configuration options
 * @returns {Object} HTTPS server configuration
 */
function createHTTPSOptions(options = {}) {
  const {
    keyPath = process.env.TLS_KEY_PATH || path.join(__dirname, '../certs/server.key'),
    certPath = process.env.TLS_CERT_PATH || path.join(__dirname, '../certs/server.crt'),
    caPath = process.env.TLS_CA_PATH || null,
    enableMTLS = false
  } = options;

  const httpsOptions = {
    // Certificate files
    key: loadCertificate(keyPath, 'private key'),
    cert: loadCertificate(certPath, 'certificate'),

    // TLS version constraints
    minVersion: TLS_CONFIG.minVersion,
    maxVersion: TLS_CONFIG.maxVersion,

    // Cipher configuration
    ciphers: TLS_CONFIG.cipherSuites,
    ecdhCurve: TLS_CONFIG.ecdhCurve,
    honorCipherOrder: TLS_CONFIG.honorCipherOrder,

    // Session configuration
    sessionTimeout: TLS_CONFIG.sessionTimeout,
    sessionIdContext: 'ppbe-federal-system'
  };

  // Add CA certificate if provided
  if (caPath) {
    httpsOptions.ca = loadCertificate(caPath, 'CA certificate');
  }

  // Enable mutual TLS if requested
  if (enableMTLS) {
    httpsOptions.requestCert = true;
    httpsOptions.rejectUnauthorized = true;
  }

  return httpsOptions;
}

/**
 * Load certificate file
 * @param {string} filePath - Path to certificate file
 * @param {string} description - Description for error messages
 * @returns {Buffer|string} Certificate content
 */
function loadCertificate(filePath, description) {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`${description} not found at ${filePath}`);
      return generateSelfSignedCertInstructions();
    }

    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error loading ${description}:`, error.message);
    throw new Error(`Failed to load ${description}`);
  }
}

/**
 * Generate self-signed certificate instructions
 */
function generateSelfSignedCertInstructions() {
  const instructions = `
  ⚠️  TLS Certificate Not Found

  For development, generate self-signed certificates:

  mkdir -p backend/certs
  openssl req -x509 -newkey rsa:4096 -keyout backend/certs/server.key \\
    -out backend/certs/server.crt -days 365 -nodes \\
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

  For production, obtain certificates from:
  - Internal PKI (Public Key Infrastructure)
  - Government Certificate Authority
  - DigiCert Federal SSP
  - Entrust Federal SSP
  `;

  console.log(instructions);
  return null;
}

/**
 * Create HTTPS server
 * @param {Object} app - Express application
 * @param {Object} options - HTTPS options
 * @returns {Object} HTTPS server instance
 */
function createSecureServer(app, options = {}) {
  const httpsOptions = createHTTPSOptions(options);

  if (!httpsOptions.key || !httpsOptions.cert) {
    console.warn('⚠️  HTTPS certificates not configured. Falling back to HTTP.');
    console.warn('⚠️  DO NOT use HTTP in production!');
    return null;
  }

  const server = https.createServer(httpsOptions, app);

  // Server error handling
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${options.port || 443} is already in use`);
    } else if (error.code === 'EACCES') {
      console.error(`Permission denied to bind to port ${options.port || 443}`);
      console.error('Hint: Ports below 1024 require root/administrator privileges');
    } else {
      console.error('HTTPS server error:', error);
    }
  });

  // TLS error handling
  server.on('tlsClientError', (error, socket) => {
    console.error('TLS client error:', {
      message: error.message,
      code: error.code,
      remoteAddress: socket.remoteAddress
    });
    socket.end();
  });

  return server;
}

/**
 * HTTPS redirect middleware
 * Redirects HTTP requests to HTTPS in production
 */
function requireHTTPS(req, res, next) {
  // Skip in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already HTTPS
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.hostname}${req.url}`;
  res.redirect(301, httpsUrl);
}

/**
 * Security headers for HTTPS
 */
function httpsSecurityHeaders(req, res, next) {
  // Strict-Transport-Security (HSTS)
  // Force HTTPS for 1 year, include subdomains
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Expect-CT (Certificate Transparency)
  res.setHeader(
    'Expect-CT',
    'max-age=86400, enforce'
  );

  next();
}

/**
 * Certificate validation middleware
 * Validates client certificates for mutual TLS
 */
function validateClientCertificate(req, res, next) {
  const cert = req.socket.getPeerCertificate();

  if (!cert || !Object.keys(cert).length) {
    return res.status(401).json({
      error: 'Client certificate required',
      code: 'NO_CLIENT_CERT'
    });
  }

  // Verify certificate is valid
  if (!req.client.authorized) {
    return res.status(401).json({
      error: 'Invalid client certificate',
      reason: req.socket.authorizationError,
      code: 'INVALID_CLIENT_CERT'
    });
  }

  // Store certificate info in request
  req.clientCert = {
    subject: cert.subject,
    issuer: cert.issuer,
    valid_from: cert.valid_from,
    valid_to: cert.valid_to,
    fingerprint: cert.fingerprint
  };

  next();
}

/**
 * Generate certificate signing request (CSR)
 * Helper function for certificate management
 */
function generateCSRInstructions() {
  return `
  Generate Certificate Signing Request (CSR):

  openssl req -new -newkey rsa:4096 -nodes \\
    -keyout server.key -out server.csr \\
    -subj "/C=US/ST=State/L=City/O=Agency/OU=Department/CN=ppbe.agency.gov"

  Submit server.csr to your Certificate Authority
  `;
}

/**
 * TLS/SSL testing and validation
 */
const TLS_TESTING = {
  // Online testing tools
  tools: [
    'SSL Labs (Qualys): https://www.ssllabs.com/ssltest/',
    'Mozilla Observatory: https://observatory.mozilla.org/',
    'Security Headers: https://securityheaders.com/'
  ],

  // Command-line testing
  commands: [
    'openssl s_client -connect localhost:443 -tls1_2',
    'openssl s_client -connect localhost:443 -tls1_3',
    'nmap --script ssl-enum-ciphers -p 443 localhost'
  ],

  // Expected results
  requirements: {
    grade: 'A+ (SSL Labs)',
    protocols: 'TLS 1.2, TLS 1.3 only',
    ciphers: 'Strong ciphers with forward secrecy',
    certificate: 'Valid, not expired, trusted CA',
    hsts: 'Enabled with appropriate max-age'
  }
};

/**
 * Production TLS checklist
 */
const PRODUCTION_CHECKLIST = [
  '✓ Valid certificate from trusted CA',
  '✓ TLS 1.2 minimum, TLS 1.3 preferred',
  '✓ Strong cipher suites only',
  '✓ Forward secrecy enabled (ECDHE/DHE)',
  '✓ HSTS header configured',
  '✓ Certificate auto-renewal configured',
  '✓ Proper certificate chain',
  '✓ No mixed content warnings',
  '✓ OCSP stapling enabled',
  '✓ Certificate pinning (optional, advanced)',
  '✓ Regular security scans scheduled'
];

module.exports = {
  TLS_CONFIG,
  createHTTPSOptions,
  createSecureServer,
  requireHTTPS,
  httpsSecurityHeaders,
  validateClientCertificate,
  generateSelfSignedCertInstructions,
  generateCSRInstructions,
  TLS_TESTING,
  PRODUCTION_CHECKLIST
};
