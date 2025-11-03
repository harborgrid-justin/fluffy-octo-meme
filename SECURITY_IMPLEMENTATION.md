# Security Implementation Guide

## Federal PPBE Management System - Security Features

This guide provides detailed instructions for implementing, configuring, and using the 10 production-grade security features.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Feature Usage](#feature-usage)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

---

## Quick Start

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- OpenSSL (for certificate generation)
- Redis (optional, for production session storage)

### Installation

```bash
# Install dependencies
cd backend
npm install

# Generate security keys
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"

# Configure environment
cp .env.example .env
# Edit .env with generated keys
```

### Start Secure Server

```bash
# Development
npm run dev

# Production (with HTTPS)
npm start
```

---

## Installation

### Step 1: Install Security Dependencies

All security dependencies are already included in package.json:

```json
{
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "speakeasy": "latest",
    "qrcode": "latest",
    "express-session": "latest",
    "connect-redis": "latest",
    "redis": "latest",
    "express-mongo-sanitize": "latest",
    "hpp": "latest",
    "cookie-parser": "latest",
    "helmet": "^8.1.0",
    "express-rate-limit": "^8.2.1"
  }
}
```

Run: `npm install`

### Step 2: Generate Certificates (for HTTPS)

#### Development (Self-Signed)

```bash
mkdir -p backend/certs
cd backend/certs

# Generate private key
openssl genrsa -out server.key 4096

# Generate certificate (valid 365 days)
openssl req -x509 -new -nodes -key server.key \
  -sha256 -days 365 -out server.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Production (Certificate Authority)

```bash
# Generate CSR (Certificate Signing Request)
openssl req -new -newkey rsa:4096 -nodes \
  -keyout server.key -out server.csr \
  -subj "/C=US/ST=State/L=City/O=Agency/OU=IT/CN=ppbe.agency.gov"

# Submit server.csr to your Certificate Authority
# Receive: server.crt and ca.crt
```

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# Required: Generate these with crypto.randomBytes
JWT_SECRET=<64-char-hex-string>
SESSION_SECRET=<64-char-hex-string>
ENCRYPTION_KEY=<base64-string>

# TLS Configuration
TLS_KEY_PATH=./certs/server.key
TLS_CERT_PATH=./certs/server.crt

# Enable HTTPS
ENABLE_HTTPS=true
```

---

## Configuration

### Security Feature Toggles

```bash
# .env
ENABLE_MFA=true          # Multi-Factor Authentication
ENABLE_CSRF=true         # CSRF Protection
ENABLE_HTTPS=true        # HTTPS/TLS
```

### Session Configuration

```bash
SESSION_TIMEOUT_MINUTES=15    # Idle timeout
SESSION_MAX_AGE_HOURS=8       # Absolute timeout
```

### Password Policy

Edit `/backend/middleware/password-policy.js`:

```javascript
const PASSWORD_POLICY = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxRepeatingChars: 3,
  passwordHistoryCount: 12,
  passwordExpirationDays: 90,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30
};
```

### Encryption Configuration

```javascript
// Default: AES-256-GCM (FIPS 140-2 approved)
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  iterations: 100000
};
```

### CSRF Configuration

```javascript
const CSRF_CONFIG = {
  tokenLength: 32,
  tokenLifetime: 3600000, // 1 hour
  cookieName: 'XSRF-TOKEN',
  headerName: 'X-CSRF-Token',
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE']
};
```

---

## Feature Usage

### 1. Multi-Factor Authentication (MFA)

#### Setup MFA for a User

```javascript
// 1. User initiates MFA setup
POST /api/auth/mfa/setup
Authorization: Bearer <user_token>

Response:
{
  "secret": "BASE32SECRET",
  "qrCode": "data:image/png;base64,...",
  "message": "Scan QR code with authenticator app"
}

// 2. User scans QR code with Google Authenticator/Authy

// 3. User verifies with TOTP token
POST /api/auth/mfa/verify
Authorization: Bearer <user_token>
{
  "token": "123456"
}

Response:
{
  "message": "MFA enabled successfully",
  "backupCodes": ["XXXX-XXXX", "YYYY-YYYY", ...]
}
```

#### Login with MFA

```javascript
// 1. Standard login
POST /api/auth/login
{
  "username": "user",
  "password": "password"
}

Response (if MFA enabled):
{
  "message": "MFA verification required",
  "tempToken": "<5-minute-temp-token>",
  "mfaRequired": true
}

// 2. Validate MFA token
POST /api/auth/mfa/validate
{
  "token": "123456",
  "tempToken": "<temp-token>"
}

Response:
{
  "message": "MFA verification successful",
  "token": "<full-access-token>",
  "user": { ... }
}
```

### 2. Session Management

Sessions are automatically managed. Configuration:

```javascript
// Session timeout occurs after:
// - 15 minutes of inactivity (idle timeout)
// - 8 hours total (absolute timeout)

// Session ID regenerates every 5 minutes
// Concurrent sessions limited to 3 per user
```

### 3. Password Policy

Enforced automatically on registration and password change:

```javascript
POST /api/auth/register
{
  "username": "newuser",
  "password": "SecureP@ssw0rd123",
  "email": "user@agency.gov"
}

// Password must meet:
// - 12+ characters
// - Uppercase letter
// - Lowercase letter
// - Number
// - Special character
// - Not in common passwords list
// - Not contain username/email
```

### 4. Data Encryption

#### Encrypt Sensitive Data

```javascript
const { encryptionService } = require('./security/encryption.service');

// Encrypt string
const encrypted = encryptionService.encrypt('sensitive data');

// Decrypt string
const decrypted = encryptionService.decrypt(encrypted);

// Encrypt object fields
const user = {
  username: 'john',
  ssn: '123-45-6789',
  email: 'john@example.com'
};

const encrypted = encryptionService.encryptFields(
  user,
  ['ssn'] // Fields to encrypt
);
```

#### Database Integration

```javascript
const { databaseEncryption } = require('./security/encryption.service');

// Before saving to database
const dataToStore = databaseEncryption.prepareForStorage(data, 'user');

// After retrieving from database
const decryptedData = databaseEncryption.prepareFromStorage(data, 'user');
```

### 5. TLS/HTTPS

#### Enable HTTPS

```bash
# .env
ENABLE_HTTPS=true
TLS_KEY_PATH=./certs/server.key
TLS_CERT_PATH=./certs/server.crt
```

Server will start on:
- Port 443 (HTTPS)
- Port 5000 (HTTP, redirects to HTTPS in production)

### 6. Input Sanitization

Automatically applied to all requests:

```javascript
// All input is sanitized:
// - HTML tags removed
// - Script injections blocked
// - NoSQL operators filtered
// - SQL keywords detected
// - Parameter pollution prevented

// No additional code required
```

### 7. SQL Injection Prevention

#### Using Query Builder

```javascript
const { SQLQueryBuilder } = require('./security/sql-safe');

const builder = new SQLQueryBuilder('postgresql');

// Safe SELECT
const { query, parameters } = builder
  .select('users', ['id', 'username'], { active: true })
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

// Execute with pg
const result = await pool.query(query, parameters);
```

#### Using PostgreSQL Helper

```javascript
const { PostgreSQLHelper } = require('./security/sql-safe');

const db = new PostgreSQLHelper(pool);

// Find records
const users = await db.find('users', { active: true });

// Insert record
const newUser = await db.insert('users', {
  username: 'john',
  email: 'john@example.com'
});

// Update record
await db.update('users', { active: false }, { id: 123 });
```

### 8. XSS Protection

Automatically applied:

```javascript
// Input sanitization
// - Script tags removed
// - Event handlers stripped
// - Dangerous URLs sanitized

// Output encoding
const { SafeRender } = require('./middleware/xss-protection');

// In templates:
const safe = SafeRender.html(userInput);
const safeAttr = SafeRender.attr(userInput);
const safeJs = SafeRender.js(userInput);
```

### 9. CSRF Protection

#### Frontend Implementation

```javascript
// Get CSRF token
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

// Include in requests
fetch('/api/budgets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

#### Get Fresh Token

```javascript
GET /api/csrf-token

Response:
{
  "csrfToken": "abc123...",
  "headerName": "X-CSRF-Token",
  "cookieName": "XSRF-TOKEN"
}
```

### 10. Security Headers

Automatically applied by Helmet.js:

```http
Content-Security-Policy: default-src 'self'; ...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

Test headers:
```bash
curl -I http://localhost:5000/api/health
```

---

## Testing

### Test Suite

```bash
# Run security tests
npm test

# Security audit
npm audit

# Check for vulnerabilities
npm audit fix
```

### Manual Testing

#### Test MFA

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecureP@ss123","email":"test@example.com"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"SecureP@ss123"}'

# 3. Setup MFA (use token from login)
curl -X POST http://localhost:5000/api/auth/mfa/setup \
  -H "Authorization: Bearer <token>"
```

#### Test CSRF Protection

```bash
# Request without CSRF token (should fail)
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Budget"}'

# Expected: 403 CSRF token missing
```

#### Test Password Policy

```bash
# Weak password (should fail)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test2","password":"weak","email":"test2@example.com"}'

# Expected: 400 Password does not meet requirements
```

#### Test Rate Limiting

```bash
# Send 6+ requests rapidly
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done

# Expected: 429 Too many requests
```

---

## Troubleshooting

### Common Issues

#### 1. Session Expires Too Quickly

```bash
# Increase timeout in .env
SESSION_TIMEOUT_MINUTES=30
SESSION_MAX_AGE_HOURS=12
```

#### 2. CSRF Token Errors

```javascript
// Ensure cookie-parser is before CSRF middleware
app.use(cookieParser());
app.use(session(...));
app.use(csrfProtection);

// Frontend: Include token in requests
headers: {
  'X-CSRF-Token': csrfToken
}
```

#### 3. MFA QR Code Not Scanning

```javascript
// Use manual entry instead
// Display the secret key: user.mfaTempSecret
// User enters manually in authenticator app
```

#### 4. TLS Certificate Errors

```bash
# Verify certificate
openssl x509 -in certs/server.crt -text -noout

# Check certificate and key match
openssl x509 -noout -modulus -in certs/server.crt | openssl md5
openssl rsa -noout -modulus -in certs/server.key | openssl md5
```

#### 5. Encryption Key Errors

```bash
# Regenerate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Update .env
ENCRYPTION_KEY=<new-key>

# Note: Existing encrypted data will be unreadable
```

---

## Best Practices

### Development

1. **Never commit secrets**
   ```bash
   # Add to .gitignore
   .env
   *.key
   *.crt
   ```

2. **Use environment variables**
   ```javascript
   const secret = process.env.JWT_SECRET || 'default-dev-secret';
   ```

3. **Test security features**
   - Write unit tests for each security module
   - Use security testing tools (OWASP ZAP, Burp Suite)

### Production

1. **Use strong secrets**
   ```bash
   # Generate with crypto
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ```

2. **Enable all security features**
   ```bash
   ENABLE_MFA=true
   ENABLE_CSRF=true
   ENABLE_HTTPS=true
   NODE_ENV=production
   ```

3. **Monitor security events**
   - Set up alerting for failed logins
   - Monitor for injection attempts
   - Track session anomalies

4. **Regular updates**
   ```bash
   # Weekly
   npm audit
   npm update

   # Monthly
   npm audit fix
   ```

5. **Use Redis for sessions**
   ```bash
   # Install Redis
   REDIS_URL=redis://localhost:6379
   ```

6. **Implement rate limiting**
   - Adjust limits based on traffic
   - Monitor for abuse patterns
   - Consider distributed rate limiting (Redis)

7. **Backup encryption keys**
   - Store keys in secure key management system
   - AWS KMS, Azure Key Vault, HashiCorp Vault
   - Never store keys in code repository

### Security Checklist

- [ ] All secrets in environment variables
- [ ] HTTPS enabled in production
- [ ] MFA enforced for admin roles
- [ ] Password policy enforced
- [ ] Session timeouts configured
- [ ] CSRF protection enabled
- [ ] Input sanitization active
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Audit logging implemented
- [ ] Regular security updates
- [ ] Vulnerability scanning automated
- [ ] Incident response plan documented

---

## Additional Resources

### Documentation

- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [FedRAMP Requirements](https://www.fedramp.gov/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)

### Tools

- **npm audit**: Vulnerability scanning
- **OWASP ZAP**: Web application security scanner
- **Burp Suite**: Security testing
- **ssllabs.com**: TLS configuration testing
- **securityheaders.com**: Security headers analysis

### Support

- **Security Issues**: security@agency.gov
- **General Support**: support@agency.gov
- **Documentation**: https://docs.ppbe.agency.gov

---

## License

This security implementation follows federal security standards and is designed for government use.
