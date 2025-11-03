/**
 * Multi-Factor Authentication (MFA) Service
 *
 * Implements TOTP-based two-factor authentication for federal PPBE system
 * Compliant with NIST SP 800-63B Digital Authentication Guidelines
 *
 * NIST Controls Addressed:
 * - IA-2(1): Multi-factor Authentication
 * - IA-5(1): Password-Based Authentication
 * - AC-7: Unsuccessful Login Attempts
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFAService {
  /**
   * Generate a new MFA secret for a user
   * @param {string} username - User's username
   * @param {string} issuer - Application name (default: PPBE System)
   * @returns {Object} Secret and QR code data
   */
  static generateSecret(username, issuer = 'PPBE-Federal-System') {
    const secret = speakeasy.generateSecret({
      name: `${issuer} (${username})`,
      issuer: issuer,
      length: 32, // 256-bit secret for enhanced security
      encoding: 'base32'
    });

    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      tempSecret: secret.ascii
    };
  }

  /**
   * Generate QR code for MFA setup
   * @param {string} otpauthUrl - OTP auth URL from secret generation
   * @returns {Promise<string>} Base64 encoded QR code image
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   * @param {string} token - 6-digit TOTP token from user
   * @param {string} secret - User's MFA secret
   * @param {number} window - Time window for token validation (default: 1)
   * @returns {boolean} True if token is valid
   */
  static verifyToken(token, secret, window = 1) {
    try {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: token,
        window: window, // Allow 1 time step before/after for clock skew
        step: 30 // 30-second time step (TOTP standard)
      });

      return verified;
    } catch (error) {
      console.error('MFA verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   * @param {number} count - Number of backup codes to generate (default: 10)
   * @returns {Array<string>} Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    const crypto = require('crypto');

    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric backup code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code.match(/.{1,4}/g).join('-')); // Format: XXXX-XXXX
    }

    return codes;
  }

  /**
   * Hash backup codes for secure storage
   * @param {Array<string>} codes - Backup codes to hash
   * @returns {Promise<Array<string>>} Hashed backup codes
   */
  static async hashBackupCodes(codes) {
    const bcrypt = require('bcryptjs');
    const hashedCodes = [];

    for (const code of codes) {
      const hashed = await bcrypt.hash(code.replace('-', ''), 10);
      hashedCodes.push(hashed);
    }

    return hashedCodes;
  }

  /**
   * Verify backup code
   * @param {string} code - Backup code provided by user
   * @param {Array<string>} hashedCodes - Array of hashed backup codes
   * @returns {Promise<Object>} Verification result with index if valid
   */
  static async verifyBackupCode(code, hashedCodes) {
    const bcrypt = require('bcryptjs');
    const cleanCode = code.replace('-', '');

    for (let i = 0; i < hashedCodes.length; i++) {
      const isValid = await bcrypt.compare(cleanCode, hashedCodes[i]);
      if (isValid) {
        return { valid: true, index: i };
      }
    }

    return { valid: false, index: -1 };
  }

  /**
   * Check if MFA should be enforced based on user role
   * @param {string} role - User role
   * @returns {boolean} True if MFA is required
   */
  static isMFARequired(role) {
    const mfaRequiredRoles = ['admin', 'finance', 'executive'];
    return mfaRequiredRoles.includes(role.toLowerCase());
  }

  /**
   * Generate time-based one-time password for testing
   * @param {string} secret - MFA secret
   * @returns {string} Current TOTP token
   */
  static getCurrentToken(secret) {
    return speakeasy.totp({
      secret: secret,
      encoding: 'base32'
    });
  }

  /**
   * Validate MFA setup completion
   * @param {string} token - Token to verify
   * @param {string} tempSecret - Temporary secret during setup
   * @returns {boolean} True if setup is valid
   */
  static validateSetup(token, tempSecret) {
    return this.verifyToken(token, tempSecret, 2); // Wider window during setup
  }
}

// In-memory storage for MFA data (replace with database in production)
const mfaStore = new Map();

/**
 * MFA middleware for route protection
 */
const requireMFA = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if user has MFA enabled
  const mfaData = mfaStore.get(user.id);

  if (!mfaData || !mfaData.enabled) {
    // Check if MFA is required for this role
    if (MFAService.isMFARequired(user.role)) {
      return res.status(403).json({
        error: 'MFA is required for your role',
        mfaRequired: true
      });
    }
    return next();
  }

  // Check if MFA was verified in this session
  if (req.session && req.session.mfaVerified) {
    return next();
  }

  return res.status(403).json({
    error: 'MFA verification required',
    mfaRequired: true
  });
};

module.exports = {
  MFAService,
  requireMFA,
  mfaStore
};
