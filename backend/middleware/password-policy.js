/**
 * Password Policy Enforcement Middleware
 *
 * Implements federal password requirements compliant with:
 * - NIST SP 800-63B Digital Identity Guidelines
 * - FedRAMP Moderate Baseline
 * - FISMA security controls
 *
 * NIST Controls Addressed:
 * - IA-5(1): Password-Based Authentication
 * - IA-5(1)(a): Minimum password complexity
 * - IA-5(1)(e): Password minimum and maximum lifetime
 * - IA-5(1)(h): Prohibit password reuse
 */

const crypto = require('crypto');

/**
 * Password Policy Configuration
 * Based on NIST SP 800-63B recommendations and federal requirements
 */
const PASSWORD_POLICY = {
  // Length requirements
  minLength: 12, // NIST recommends minimum 8, federal often requires 12+
  maxLength: 128,

  // Complexity requirements
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',

  // Security requirements
  maxRepeatingChars: 3, // No more than 3 repeating characters
  preventCommonPasswords: true,
  preventUserInfo: true, // Username, email in password

  // History and expiration
  passwordHistoryCount: 12, // Remember last 12 passwords
  passwordExpirationDays: 90, // Passwords expire after 90 days
  passwordWarningDays: 14, // Warn 14 days before expiration

  // Account lockout
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 30,
  resetOnSuccess: true
};

/**
 * Common weak passwords list (subset - expand in production)
 */
const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'admin', 'admin123', 'welcome',
  'welcome123', 'letmein', 'monkey', '123456', '12345678',
  'qwerty', 'abc123', 'password1', 'password!', 'passw0rd',
  'Password1', 'Password123', 'Welcome123', 'Changeme123',
  'Summer2024', 'Winter2024', 'Spring2024', 'Fall2024'
]);

/**
 * Validate password against policy
 * @param {string} password - Password to validate
 * @param {Object} userInfo - User information for context validation
 * @returns {Object} Validation result
 */
function validatePassword(password, userInfo = {}) {
  const errors = [];

  // Check if password exists
  if (!password) {
    return {
      valid: false,
      errors: ['Password is required']
    };
  }

  // Length check
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters long`);
  }

  if (password.length > PASSWORD_POLICY.maxLength) {
    errors.push(`Password must not exceed ${PASSWORD_POLICY.maxLength} characters`);
  }

  // Complexity checks
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_POLICY.requireSpecialChars) {
    const specialCharsRegex = new RegExp(`[${PASSWORD_POLICY.specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`);
    if (!specialCharsRegex.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }
  }

  // Repeating characters check
  const repeatingRegex = new RegExp(`(.)\\1{${PASSWORD_POLICY.maxRepeatingChars},}`, 'i');
  if (repeatingRegex.test(password)) {
    errors.push(`Password cannot contain more than ${PASSWORD_POLICY.maxRepeatingChars} repeating characters`);
  }

  // Common password check
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.has(lowerPassword)) {
      errors.push('Password is too common and easily guessable');
    }

    // Check for common patterns
    if (/^[a-z]+\d+$/i.test(password)) {
      errors.push('Password cannot be just a word followed by numbers');
    }
  }

  // User information check
  if (PASSWORD_POLICY.preventUserInfo && userInfo) {
    const { username, email, firstName, lastName } = userInfo;

    const infoToCheck = [
      username,
      email?.split('@')[0],
      firstName,
      lastName
    ].filter(Boolean);

    for (const info of infoToCheck) {
      if (info && password.toLowerCase().includes(info.toLowerCase())) {
        errors.push('Password cannot contain your username, email, or name');
        break;
      }
    }
  }

  // Entropy check (optional - measures password strength)
  const entropy = calculatePasswordEntropy(password);
  if (entropy < 50) {
    errors.push('Password is not strong enough - try using a longer password with varied characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    strength: calculatePasswordStrength(password),
    entropy: entropy
  };
}

/**
 * Calculate password entropy (bits)
 * @param {string} password - Password to analyze
 * @returns {number} Entropy in bits
 */
function calculatePasswordEntropy(password) {
  let charset = 0;

  if (/[a-z]/.test(password)) charset += 26; // Lowercase
  if (/[A-Z]/.test(password)) charset += 26; // Uppercase
  if (/\d/.test(password)) charset += 10; // Numbers
  if (/[^a-zA-Z0-9]/.test(password)) charset += 32; // Special chars

  return Math.log2(Math.pow(charset, password.length));
}

/**
 * Calculate password strength score
 * @param {string} password - Password to analyze
 * @returns {Object} Strength score and label
 */
function calculatePasswordStrength(password) {
  let score = 0;

  // Length score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length >= 20) score += 1;

  // Complexity score
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Variety score
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.6) score += 1;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const index = Math.min(Math.floor(score / 2), labels.length - 1);

  return {
    score: score,
    maxScore: 9,
    label: labels[index],
    percentage: Math.round((score / 9) * 100)
  };
}

/**
 * Express middleware for password validation
 */
function enforcePasswordPolicy(req, res, next) {
  const { password, username, email, firstName, lastName } = req.body;

  if (!password) {
    return next(); // Let express-validator handle missing password
  }

  const validation = validatePassword(password, {
    username,
    email,
    firstName,
    lastName
  });

  if (!validation.valid) {
    return res.status(400).json({
      error: 'Password does not meet security requirements',
      errors: validation.errors,
      policy: {
        minLength: PASSWORD_POLICY.minLength,
        requireUppercase: PASSWORD_POLICY.requireUppercase,
        requireLowercase: PASSWORD_POLICY.requireLowercase,
        requireNumbers: PASSWORD_POLICY.requireNumbers,
        requireSpecialChars: PASSWORD_POLICY.requireSpecialChars
      }
    });
  }

  // Attach validation results to request for logging
  req.passwordValidation = validation;

  next();
}

/**
 * Password history management
 */
class PasswordHistory {
  constructor() {
    this.history = new Map(); // userId -> array of hashed passwords
  }

  /**
   * Add password to history
   */
  async addPassword(userId, hashedPassword) {
    if (!this.history.has(userId)) {
      this.history.set(userId, []);
    }

    const userHistory = this.history.get(userId);
    userHistory.unshift(hashedPassword);

    // Keep only the configured number of passwords
    if (userHistory.length > PASSWORD_POLICY.passwordHistoryCount) {
      userHistory.pop();
    }
  }

  /**
   * Check if password was used recently
   */
  async isPasswordReused(userId, password) {
    const bcrypt = require('bcryptjs');
    const userHistory = this.history.get(userId);

    if (!userHistory) {
      return false;
    }

    for (const hashedPassword of userHistory) {
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear history for user
   */
  clearHistory(userId) {
    this.history.delete(userId);
  }
}

const passwordHistory = new PasswordHistory();

/**
 * Account lockout management
 */
class AccountLockout {
  constructor() {
    this.attempts = new Map(); // userId -> { count, lastAttempt, lockedUntil }
  }

  /**
   * Record failed login attempt
   */
  recordFailedAttempt(userId) {
    const now = Date.now();

    if (!this.attempts.has(userId)) {
      this.attempts.set(userId, {
        count: 1,
        lastAttempt: now,
        lockedUntil: null
      });
      return { locked: false, remainingAttempts: PASSWORD_POLICY.maxLoginAttempts - 1 };
    }

    const record = this.attempts.get(userId);
    record.count += 1;
    record.lastAttempt = now;

    if (record.count >= PASSWORD_POLICY.maxLoginAttempts) {
      record.lockedUntil = now + (PASSWORD_POLICY.lockoutDurationMinutes * 60 * 1000);
      return {
        locked: true,
        lockedUntil: new Date(record.lockedUntil).toISOString(),
        remainingAttempts: 0
      };
    }

    return {
      locked: false,
      remainingAttempts: PASSWORD_POLICY.maxLoginAttempts - record.count
    };
  }

  /**
   * Check if account is locked
   */
  isLocked(userId) {
    const record = this.attempts.get(userId);

    if (!record || !record.lockedUntil) {
      return { locked: false };
    }

    const now = Date.now();
    if (now < record.lockedUntil) {
      return {
        locked: true,
        lockedUntil: new Date(record.lockedUntil).toISOString(),
        remainingTime: Math.ceil((record.lockedUntil - now) / 60000) // minutes
      };
    }

    // Lockout expired, clear it
    this.reset(userId);
    return { locked: false };
  }

  /**
   * Reset attempts on successful login
   */
  reset(userId) {
    this.attempts.delete(userId);
  }

  /**
   * Get attempt count
   */
  getAttempts(userId) {
    const record = this.attempts.get(userId);
    return record ? record.count : 0;
  }
}

const accountLockout = new AccountLockout();

module.exports = {
  PASSWORD_POLICY,
  validatePassword,
  calculatePasswordEntropy,
  calculatePasswordStrength,
  enforcePasswordPolicy,
  passwordHistory,
  accountLockout
};
