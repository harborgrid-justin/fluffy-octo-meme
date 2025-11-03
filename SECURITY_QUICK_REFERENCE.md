# Security Quick Reference Guide

## Federal PPBE System - Security Features

Quick reference for developers implementing the 10 security features.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Generate security keys
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('base64'))"

# 3. Configure .env
cp .env.example .env
# Paste generated keys into .env

# 4. Generate TLS certificates (development)
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt \
  -days 365 -nodes -subj "/CN=localhost"

# 5. Start secure server
node server-secure.js
```

---

## 📁 File Locations

### Security Services
```
/backend/security/
├── mfa.service.js          # SEC-001: MFA/2FA
├── session.service.js      # SEC-002: Session Management
├── encryption.service.js   # SEC-004: Data Encryption
└── sql-safe.js            # SEC-007: SQL Injection Prevention
```

### Middleware
```
/backend/middleware/
├── password-policy.js      # SEC-003: Password Policy
├── sanitization.js         # SEC-006: Input Sanitization
├── xss-protection.js       # SEC-008: XSS Protection
└── csrf-protection.js      # SEC-009: CSRF Protection
```

### Configuration
```
/backend/config/
├── tls.config.js          # SEC-005: TLS/HTTPS
└── security-headers.js     # SEC-010: Security Headers
```

---

## 🔐 Feature Implementation

### 1. Multi-Factor Authentication (MFA)

```javascript
// Import
const { MFAService, requireMFA } = require('./security/mfa.service');

// Setup MFA for user
const { secret, otpauthUrl } = MFAService.generateSecret('username');
const qrCode = await MFAService.generateQRCode(otpauthUrl);

// Verify token
const isValid = MFAService.verifyToken('123456', secret);

// Protect route
app.get('/api/admin', authenticateToken, requireMFA, (req, res) => {
  // Admin endpoint
});
```

**API Endpoints**:
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/verify` - Verify and enable
- `POST /api/auth/mfa/validate` - Validate during login

---

### 2. Session Management

```javascript
// Import
const { createSessionConfig, sessionTimeout } = require('./security/session.service');

// Configure
const sessionConfig = createSessionConfig({
  secret: process.env.SESSION_SECRET,
  redisClient: redisClient // optional
});

app.use(session(sessionConfig));
app.use(sessionTimeout({
  idleTimeout: 15 * 60 * 1000,    // 15 minutes
  absoluteTimeout: 8 * 3600 * 1000 // 8 hours
}));
```

**Environment Variables**:
```bash
SESSION_SECRET=<your-secret>
SESSION_TIMEOUT_MINUTES=15
SESSION_MAX_AGE_HOURS=8
REDIS_URL=redis://localhost:6379  # optional
```

---

### 3. Password Policy

```javascript
// Import
const { enforcePasswordPolicy } = require('./middleware/password-policy');

// Apply to registration/password change
app.post('/api/auth/register', enforcePasswordPolicy, async (req, res) => {
  // Password is validated before reaching here
});
```

**Requirements**:
- Minimum 12 characters
- Uppercase + lowercase
- Numbers + special characters
- Not in common passwords list
- Cannot contain username/email

---

### 4. Data Encryption

```javascript
// Import
const { encryptionService } = require('./security/encryption.service');

// Encrypt/Decrypt
const encrypted = encryptionService.encrypt('sensitive data');
const decrypted = encryptionService.decrypt(encrypted);

// Field-level encryption
const user = { username: 'john', ssn: '123-45-6789' };
const encrypted = encryptionService.encryptFields(user, ['ssn']);
const decrypted = encryptionService.decryptFields(encrypted, ['ssn']);

// Hash (one-way)
const hash = encryptionService.hash('data');

// HMAC
const hmac = encryptionService.createHMAC('data');
const isValid = encryptionService.verifyHMAC('data', hmac);
```

**Environment**:
```bash
ENCRYPTION_KEY=<base64-key>
```

---

### 5. TLS/HTTPS

```javascript
// Import
const { createSecureServer } = require('./config/tls.config');

// Create HTTPS server
const httpsServer = createSecureServer(app, {
  keyPath: './certs/server.key',
  certPath: './certs/server.crt'
});

httpsServer.listen(443);
```

**Certificates**:
```bash
# Development
openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes

# Production
# Get from: DigiCert Federal SSP, Entrust Federal SSP, or Internal PKI
```

---

### 6. Input Sanitization

```javascript
// Import
const { comprehensiveSanitization } = require('./middleware/sanitization');

// Apply globally
app.use(comprehensiveSanitization());

// Or individual components
const { sanitizeInput, detectSQLInjection, mongoDBSanitize } = require('./middleware/sanitization');
app.use(mongoDBSanitize);
app.use(sanitizeInput);
app.use(detectSQLInjection);
```

**Automatic Protection**:
- HTML tags removed
- Script injection blocked
- NoSQL operators filtered
- SQL keywords detected
- Request size limited

---

### 7. SQL Injection Prevention

```javascript
// Import
const { SQLQueryBuilder, PostgreSQLHelper } = require('./security/sql-safe');

// Query Builder
const builder = new SQLQueryBuilder('postgresql');
const { query, parameters } = builder
  .select('users', ['id', 'username'], { active: true })
  .orderBy('created_at', 'DESC')
  .limit(10)
  .build();

const result = await pool.query(query, parameters);

// PostgreSQL Helper
const db = new PostgreSQLHelper(pool);
const users = await db.find('users', { active: true });
const user = await db.findOne('users', { id: 123 });
const newUser = await db.insert('users', { username: 'john' });
```

**Never Do This**:
```javascript
// ❌ DANGEROUS
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ SAFE
const query = 'SELECT * FROM users WHERE id = $1';
const result = await pool.query(query, [userId]);
```

---

### 8. XSS Protection

```javascript
// Import
const { comprehensiveXSSProtection } = require('./middleware/xss-protection');

// Apply globally
app.use(comprehensiveXSSProtection());

// Manual encoding
const { encodeHTMLEntities, SafeRender } = require('./middleware/xss-protection');

const safe = encodeHTMLEntities('<script>alert("xss")</script>');
// Result: &lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;

// Context-aware encoding
const safeHTML = SafeRender.html(userInput);
const safeAttr = SafeRender.attr(userInput);
const safeJS = SafeRender.js(userInput);
const safeURL = SafeRender.url(userInput);
```

**CSP Headers Automatically Applied**:
```http
Content-Security-Policy: default-src 'self'; script-src 'self'; ...
```

---

### 9. CSRF Protection

```javascript
// Import
const { csrfProtection, getCSRFToken } = require('./middleware/csrf-protection');

// Apply globally (after session and cookie-parser)
app.use(cookieParser());
app.use(session(...));
app.use(csrfProtection);

// Get token endpoint
app.get('/api/csrf-token', getCSRFToken);
```

**Frontend**:
```javascript
// Get token from cookie
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('XSRF-TOKEN='))
  ?.split('=')[1];

// Include in requests
fetch('/api/resource', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

---

### 10. Security Headers

```javascript
// Import
const { comprehensiveSecurityHeaders } = require('./config/security-headers');

// Apply globally (first middleware)
app.use(comprehensiveSecurityHeaders());
```

**Headers Applied**:
```http
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

**Test Headers**:
```bash
curl -I http://localhost:5000/api/health
```

---

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### Security Audit
```bash
npm audit
npm audit fix
```

### Manual Tests
```bash
# Test MFA
curl -X POST http://localhost:5000/api/auth/mfa/setup \
  -H "Authorization: Bearer <token>"

# Test CSRF (should fail without token)
curl -X POST http://localhost:5000/api/budgets \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"wrong"}'
done
```

### Online Tools
- **SSL Labs**: https://www.ssllabs.com/ssltest/
- **Security Headers**: https://securityheaders.com
- **Mozilla Observatory**: https://observatory.mozilla.org

---

## 🔧 Configuration Examples

### Development (.env)
```bash
NODE_ENV=development
PORT=5000
JWT_SECRET=dev-secret-change-in-production
SESSION_SECRET=dev-session-secret
ENCRYPTION_KEY=dev-encryption-key
ENABLE_MFA=true
ENABLE_CSRF=true
ENABLE_HTTPS=false
SESSION_TIMEOUT_MINUTES=30
CORS_ORIGIN=http://localhost:3000
```

### Production (.env)
```bash
NODE_ENV=production
PORT=5000
JWT_SECRET=<64-char-cryptographically-random-hex>
SESSION_SECRET=<64-char-cryptographically-random-hex>
ENCRYPTION_KEY=<base64-cryptographically-random-key>
TLS_KEY_PATH=/etc/ssl/private/server.key
TLS_CERT_PATH=/etc/ssl/certs/server.crt
TLS_CA_PATH=/etc/ssl/certs/ca.crt
ENABLE_MFA=true
ENABLE_CSRF=true
ENABLE_HTTPS=true
SESSION_TIMEOUT_MINUTES=15
SESSION_MAX_AGE_HOURS=8
REDIS_URL=redis://redis-server:6379
CORS_ORIGIN=https://ppbe.agency.gov
DATABASE_URL=postgresql://user:pass@db:5432/ppbe?sslmode=require
```

---

## 🚨 Common Issues

### Issue: Session expires too quickly
**Solution**:
```bash
SESSION_TIMEOUT_MINUTES=30
SESSION_MAX_AGE_HOURS=12
```

### Issue: CSRF token errors
**Solution**:
```javascript
// Ensure correct middleware order
app.use(cookieParser());
app.use(session(...));
app.use(csrfProtection);

// Frontend: Include token
headers: { 'X-CSRF-Token': csrfToken }
```

### Issue: MFA QR code won't scan
**Solution**:
```javascript
// Use manual entry instead
// Display: secret.base32
// User enters in authenticator app
```

### Issue: TLS certificate errors
**Solution**:
```bash
# Verify certificate
openssl x509 -in server.crt -text -noout

# Check key matches
openssl rsa -in server.key -check
```

---

## 📊 Performance Impact

| Feature | Overhead | When Applied |
|---------|----------|-------------|
| MFA | ~50ms | Login only |
| Sessions | ~5ms | Every request |
| Password Policy | ~100ms | Registration only |
| Encryption | ~2ms | Per encrypted field |
| TLS | ~10ms | Connection handshake |
| Sanitization | ~2ms | Every request |
| SQL Safe | ~1ms | Per query |
| XSS | ~2ms | Every request |
| CSRF | ~1ms | Every request |
| Headers | <1ms | Every request |

**Total**: ~10-15ms average per request

---

## 🎯 Security Checklist

### Before Deployment
- [ ] Generate strong secrets (32+ bytes)
- [ ] Enable all security features
- [ ] Configure TLS with valid certificates
- [ ] Set up Redis for sessions
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up audit logging
- [ ] Test all security features
- [ ] Run security audit (npm audit)
- [ ] Scan with OWASP ZAP

### After Deployment
- [ ] Monitor security logs
- [ ] Set up alerts for suspicious activity
- [ ] Schedule regular security scans
- [ ] Implement backup strategy
- [ ] Document incident response procedures
- [ ] Train team on security features
- [ ] Schedule penetration testing

---

## 📚 Additional Resources

### Documentation
- [SECURITY_CONTROLS.md](./SECURITY_CONTROLS.md) - NIST mapping
- [SECURITY_IMPLEMENTATION.md](./SECURITY_IMPLEMENTATION.md) - Detailed guide
- [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md) - Implementation summary
- [SECURITY.md](./SECURITY.md) - Overview

### Standards
- [NIST SP 800-53](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [FedRAMP](https://www.fedramp.gov/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Tools
- npm audit - Vulnerability scanning
- OWASP ZAP - Security testing
- Burp Suite - Penetration testing
- ssllabs.com - TLS testing
- securityheaders.com - Header analysis

---

## 💡 Best Practices

1. **Always use environment variables** for secrets
2. **Never commit** `.env`, `*.key`, or `*.crt` files
3. **Enable all features** in production
4. **Monitor security logs** continuously
5. **Update dependencies** regularly
6. **Use Redis** for sessions in production
7. **Implement backups** for encryption keys
8. **Test thoroughly** before deployment
9. **Follow least privilege** principle
10. **Document everything**

---

## 📞 Support

- **Security Issues**: security@agency.gov
- **Technical Support**: support@agency.gov
- **Documentation**: https://docs.ppbe.agency.gov

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
**Status**: Production Ready ✅
