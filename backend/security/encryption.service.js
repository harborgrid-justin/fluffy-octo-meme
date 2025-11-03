/**
 * Encryption Service
 *
 * Implements FIPS 140-2 compliant encryption for sensitive data at rest
 * Uses AES-256-GCM for authenticated encryption
 *
 * NIST Controls Addressed:
 * - SC-28: Protection of Information at Rest
 * - SC-13: Cryptographic Protection
 * - SC-12: Cryptographic Key Establishment and Management
 * - MP-5: Media Transport
 */

const crypto = require('crypto');

/**
 * Encryption Configuration
 */
const ENCRYPTION_CONFIG = {
  // Algorithm: AES-256-GCM (FIPS 140-2 approved)
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits (GCM standard)
  authTagLength: 16, // 128 bits authentication tag
  saltLength: 64, // For key derivation
  iterations: 100000, // PBKDF2 iterations
  digest: 'sha512' // Hash algorithm for PBKDF2
};

/**
 * Field-level encryption configuration
 * Specify which fields should be encrypted
 */
const ENCRYPTED_FIELDS = {
  user: ['ssn', 'taxId', 'bankAccount', 'personalNotes'],
  budget: ['sensitiveNotes', 'classifiedInfo'],
  program: ['classifiedDetails', 'contractorInfo']
};

class EncryptionService {
  constructor() {
    // Master encryption key from environment variable
    // In production, use AWS KMS, Azure Key Vault, or HSM
    this.masterKey = process.env.ENCRYPTION_KEY || this.generateKey();

    if (!process.env.ENCRYPTION_KEY) {
      console.warn('WARNING: Using generated encryption key. Set ENCRYPTION_KEY in production!');
    }
  }

  /**
   * Generate a cryptographically secure encryption key
   * @returns {string} Base64 encoded key
   */
  generateKey() {
    return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength).toString('base64');
  }

  /**
   * Derive encryption key from master key using PBKDF2
   * @param {string} salt - Salt for key derivation
   * @returns {Buffer} Derived key
   */
  deriveKey(salt) {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      ENCRYPTION_CONFIG.iterations,
      ENCRYPTION_CONFIG.keyLength,
      ENCRYPTION_CONFIG.digest
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string|Object} data - Data to encrypt
   * @returns {string} Encrypted data with metadata (base64)
   */
  encrypt(data) {
    try {
      // Convert data to string if object
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);

      // Generate random salt and IV
      const salt = crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
      const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);

      // Derive encryption key
      const key = this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(
        ENCRYPTION_CONFIG.algorithm,
        key,
        iv
      );

      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag (GCM provides authenticated encryption)
      const authTag = cipher.getAuthTag();

      // Combine: salt + iv + authTag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        Buffer.from(encrypted, 'base64')
      ]);

      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encryptedData - Base64 encoded encrypted data
   * @returns {string|Object} Decrypted data
   */
  decrypt(encryptedData) {
    try {
      // Decode base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.slice(0, ENCRYPTION_CONFIG.saltLength);
      const iv = combined.slice(
        ENCRYPTION_CONFIG.saltLength,
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
      );
      const authTag = combined.slice(
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength,
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.authTagLength
      );
      const encrypted = combined.slice(
        ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.authTagLength
      );

      // Derive decryption key
      const key = this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        ENCRYPTION_CONFIG.algorithm,
        key,
        iv
      );

      // Set authentication tag
      decipher.setAuthTag(authTag);

      // Decrypt data
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      // Try to parse as JSON, otherwise return string
      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Encrypt specific fields in an object
   * @param {Object} object - Object with fields to encrypt
   * @param {Array<string>} fields - Field names to encrypt
   * @returns {Object} Object with encrypted fields
   */
  encryptFields(object, fields) {
    const encrypted = { ...object };

    for (const field of fields) {
      if (object[field] !== undefined && object[field] !== null) {
        encrypted[field] = this.encrypt(object[field]);
        encrypted[`${field}_encrypted`] = true;
      }
    }

    return encrypted;
  }

  /**
   * Decrypt specific fields in an object
   * @param {Object} object - Object with encrypted fields
   * @param {Array<string>} fields - Field names to decrypt
   * @returns {Object} Object with decrypted fields
   */
  decryptFields(object, fields) {
    const decrypted = { ...object };

    for (const field of fields) {
      if (object[`${field}_encrypted`] && object[field]) {
        try {
          decrypted[field] = this.decrypt(object[field]);
          delete decrypted[`${field}_encrypted`];
        } catch (error) {
          console.error(`Failed to decrypt field: ${field}`, error);
          decrypted[field] = '[DECRYPTION_ERROR]';
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash data using SHA-256 (one-way)
   * @param {string} data - Data to hash
   * @returns {string} Hex encoded hash
   */
  hash(data) {
    return crypto.createHash('sha256').update(String(data)).digest('hex');
  }

  /**
   * Create HMAC for data integrity verification
   * @param {string} data - Data to create HMAC for
   * @returns {string} Hex encoded HMAC
   */
  createHMAC(data) {
    return crypto
      .createHmac('sha256', this.masterKey)
      .update(String(data))
      .digest('hex');
  }

  /**
   * Verify HMAC
   * @param {string} data - Original data
   * @param {string} hmac - HMAC to verify
   * @returns {boolean} True if HMAC is valid
   */
  verifyHMAC(data, hmac) {
    const expectedHmac = this.createHMAC(data);
    return crypto.timingSafeEqual(
      Buffer.from(hmac),
      Buffer.from(expectedHmac)
    );
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes (default: 32)
   * @returns {string} Hex encoded token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Mask sensitive data for logging
   * @param {string} data - Data to mask
   * @param {number} visibleChars - Number of visible characters (default: 4)
   * @returns {string} Masked data
   */
  maskSensitiveData(data, visibleChars = 4) {
    if (!data) return '';

    const dataStr = String(data);
    if (dataStr.length <= visibleChars) {
      return '*'.repeat(dataStr.length);
    }

    return dataStr.slice(0, visibleChars) + '*'.repeat(dataStr.length - visibleChars);
  }
}

/**
 * Middleware to automatically encrypt/decrypt specified fields
 */
function fieldEncryptionMiddleware(entityType) {
  const encryptionService = new EncryptionService();
  const fieldsToEncrypt = ENCRYPTED_FIELDS[entityType] || [];

  return {
    // Encrypt before saving
    beforeSave: (data) => {
      return encryptionService.encryptFields(data, fieldsToEncrypt);
    },

    // Decrypt after retrieval
    afterRetrieve: (data) => {
      if (Array.isArray(data)) {
        return data.map(item =>
          encryptionService.decryptFields(item, fieldsToEncrypt)
        );
      }
      return encryptionService.decryptFields(data, fieldsToEncrypt);
    }
  };
}

/**
 * Database encryption helper
 * Transparently encrypts/decrypts data for database operations
 */
class DatabaseEncryption {
  constructor() {
    this.encryptionService = new EncryptionService();
  }

  /**
   * Prepare data for database insertion (encrypt sensitive fields)
   */
  prepareForStorage(data, entityType) {
    const fields = ENCRYPTED_FIELDS[entityType] || [];
    return this.encryptionService.encryptFields(data, fields);
  }

  /**
   * Prepare data after retrieval (decrypt sensitive fields)
   */
  prepareFromStorage(data, entityType) {
    const fields = ENCRYPTED_FIELDS[entityType] || [];

    if (Array.isArray(data)) {
      return data.map(item =>
        this.encryptionService.decryptFields(item, fields)
      );
    }

    return this.encryptionService.decryptFields(data, fields);
  }
}

/**
 * Secure key storage recommendations
 */
const KEY_MANAGEMENT_GUIDE = {
  development: 'Use environment variable (ENCRYPTION_KEY)',
  production: [
    'AWS KMS (Key Management Service)',
    'Azure Key Vault',
    'HashiCorp Vault',
    'Hardware Security Module (HSM)',
    'FIPS 140-2 Level 3 certified storage'
  ],
  rotation: 'Rotate encryption keys every 90 days',
  backup: 'Store backup keys in secure offline storage',
  access: 'Limit key access to essential personnel only'
};

// Singleton instance
const encryptionService = new EncryptionService();
const databaseEncryption = new DatabaseEncryption();

module.exports = {
  EncryptionService,
  encryptionService,
  fieldEncryptionMiddleware,
  DatabaseEncryption,
  databaseEncryption,
  ENCRYPTED_FIELDS,
  ENCRYPTION_CONFIG,
  KEY_MANAGEMENT_GUIDE
};
