/**
 * PPBE-002: Appropriation Type Validation
 *
 * Per DoD FMR Volume 2A, Chapter 1 and 31 U.S.C. § 1301
 * Validates appropriation types and their characteristics
 *
 * Main appropriation types in federal budget:
 * - O&M (Operations & Maintenance): 1-year funds
 * - MILPERS (Military Personnel): 1-year funds
 * - PROCUREMENT: Multi-year funds (3-5 years depending on category)
 * - RDT&E (Research, Development, Test & Evaluation): 2-year funds
 * - MILCON (Military Construction): 5-year funds
 * - FCRA (Federal Credit Reform Act): No-year funds
 */

const { getFiscalYear, getFiscalYearEndDate } = require('./fiscalYear');

// Appropriation type definitions per DoD FMR
const APPROPRIATION_TYPES = {
  OM: {
    code: 'OM',
    name: 'Operations and Maintenance',
    fullName: 'Operations and Maintenance (O&M)',
    availability: 1,
    description: 'Current expenses not otherwise classified, including civilian personnel compensation',
    availabilityType: 'annual',
    color: 'green'
  },
  MILPERS: {
    code: 'MILPERS',
    name: 'Military Personnel',
    fullName: 'Military Personnel (MILPERS)',
    availability: 1,
    description: 'Pay and allowances for active and reserve military personnel',
    availabilityType: 'annual',
    color: 'blue'
  },
  PROCUREMENT: {
    code: 'PROCUREMENT',
    name: 'Procurement',
    fullName: 'Procurement',
    availability: 3,
    description: 'Acquisition of equipment, weapons systems, and other capital assets',
    availabilityType: 'multi-year',
    color: 'red',
    subTypes: {
      AIRCRAFT: { availability: 3 },
      MISSILES: { availability: 3 },
      WEAPONS: { availability: 3 },
      AMMUNITION: { availability: 3 },
      SHIPBUILDING: { availability: 5 },
      OTHER: { availability: 3 }
    }
  },
  RDTE: {
    code: 'RDTE',
    name: 'Research, Development, Test & Evaluation',
    fullName: 'Research, Development, Test & Evaluation (RDT&E)',
    availability: 2,
    description: 'Research and development of new technologies and systems',
    availabilityType: 'multi-year',
    color: 'yellow'
  },
  MILCON: {
    code: 'MILCON',
    name: 'Military Construction',
    fullName: 'Military Construction (MILCON)',
    availability: 5,
    description: 'Construction, installation, or acquisition of facilities',
    availabilityType: 'multi-year',
    color: 'orange'
  },
  FCH: {
    code: 'FCH',
    name: 'Family Housing',
    fullName: 'Family Housing',
    availability: 2,
    description: 'Construction, maintenance, and operation of family housing',
    availabilityType: 'multi-year',
    color: 'purple'
  },
  NOYEAR: {
    code: 'NOYEAR',
    name: 'No-Year Funds',
    fullName: 'No-Year Appropriation',
    availability: Infinity,
    description: 'Funds available until expended, no time limit',
    availabilityType: 'no-year',
    color: 'gray'
  }
};

/**
 * Validate if an appropriation type code is valid
 * @param {string} typeCode - The appropriation type code
 * @returns {Object} Validation result with isValid flag and errors
 */
function validateAppropriationType(typeCode) {
  const errors = [];

  if (!typeCode) {
    errors.push('Appropriation type code is required');
    return { isValid: false, errors };
  }

  const normalizedCode = typeCode.toUpperCase();
  const appropriationType = APPROPRIATION_TYPES[normalizedCode];

  if (!appropriationType) {
    errors.push(`Invalid appropriation type: ${typeCode}. Must be one of: ${Object.keys(APPROPRIATION_TYPES).join(', ')}`);
    return { isValid: false, errors, validTypes: Object.keys(APPROPRIATION_TYPES) };
  }

  return {
    isValid: true,
    errors: [],
    appropriationType,
    code: normalizedCode
  };
}

/**
 * Get appropriation type details
 * @param {string} typeCode - The appropriation type code
 * @returns {Object|null} Appropriation type details or null if invalid
 */
function getAppropriationType(typeCode) {
  if (!typeCode) return null;
  const normalizedCode = typeCode.toUpperCase();
  return APPROPRIATION_TYPES[normalizedCode] || null;
}

/**
 * Get all appropriation types
 * @returns {Object} All appropriation type definitions
 */
function getAllAppropriationTypes() {
  return { ...APPROPRIATION_TYPES };
}

/**
 * Calculate expiration date for an appropriation
 * @param {string} typeCode - The appropriation type code
 * @param {number} fiscalYear - The fiscal year of appropriation
 * @param {string} subType - Optional subtype for PROCUREMENT
 * @returns {Object} Expiration details
 */
function calculateExpirationDate(typeCode, fiscalYear, subType = null) {
  const validation = validateAppropriationType(typeCode);

  if (!validation.isValid) {
    return {
      isValid: false,
      errors: validation.errors
    };
  }

  const appropriationType = validation.appropriationType;
  let availability = appropriationType.availability;

  // Handle procurement subtypes
  if (typeCode.toUpperCase() === 'PROCUREMENT' && subType && appropriationType.subTypes[subType]) {
    availability = appropriationType.subTypes[subType].availability;
  }

  // No-year funds never expire
  if (availability === Infinity) {
    return {
      isValid: true,
      expirationDate: null,
      expirationFY: null,
      availabilityYears: availability,
      availabilityType: 'no-year',
      neverExpires: true
    };
  }

  // Calculate expiration fiscal year
  const expirationFY = fiscalYear + availability - 1;
  const expirationDate = getFiscalYearEndDate(expirationFY);

  return {
    isValid: true,
    expirationDate,
    expirationFY,
    availabilityYears: availability,
    availabilityType: appropriationType.availabilityType,
    neverExpires: false,
    appropriationFY: fiscalYear
  };
}

/**
 * Check if funds are expired
 * @param {string} typeCode - The appropriation type code
 * @param {number} appropriationFY - The fiscal year of appropriation
 * @param {Date} currentDate - The current date (defaults to now)
 * @returns {Object} Expiration status
 */
function isFundingExpired(typeCode, appropriationFY, currentDate = new Date()) {
  const expiration = calculateExpirationDate(typeCode, appropriationFY);

  if (!expiration.isValid) {
    return {
      isValid: false,
      errors: expiration.errors
    };
  }

  if (expiration.neverExpires) {
    return {
      isValid: true,
      isExpired: false,
      neverExpires: true
    };
  }

  const currentFY = getFiscalYear(currentDate);
  const isExpired = currentFY > expiration.expirationFY;

  return {
    isValid: true,
    isExpired,
    expirationDate: expiration.expirationDate,
    expirationFY: expiration.expirationFY,
    currentFY,
    daysUntilExpiration: isExpired ? 0 : Math.floor((expiration.expirationDate - currentDate) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Validate appropriation with fiscal year
 * @param {Object} appropriation - Appropriation details
 * @returns {Object} Validation result
 */
function validateAppropriationWithFY(appropriation) {
  const errors = [];
  const warnings = [];

  if (!appropriation.typeCode) {
    errors.push('Appropriation type code is required');
  }

  if (!appropriation.fiscalYear) {
    errors.push('Fiscal year is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const typeValidation = validateAppropriationType(appropriation.typeCode);
  if (!typeValidation.isValid) {
    return { isValid: false, errors: typeValidation.errors, warnings };
  }

  const expiration = calculateExpirationDate(
    appropriation.typeCode,
    appropriation.fiscalYear,
    appropriation.subType
  );

  const currentFY = getFiscalYear();
  if (currentFY > expiration.expirationFY && !expiration.neverExpires) {
    warnings.push(`Funds expired at end of FY${expiration.expirationFY}`);
  }

  return {
    isValid: true,
    errors: [],
    warnings,
    appropriationType: typeValidation.appropriationType,
    expiration
  };
}

/**
 * Get color of money for appropriation type
 * @param {string} typeCode - The appropriation type code
 * @returns {string|null} Color designation or null
 */
function getColorOfMoney(typeCode) {
  const appropriationType = getAppropriationType(typeCode);
  return appropriationType ? appropriationType.color : null;
}

module.exports = {
  APPROPRIATION_TYPES,
  validateAppropriationType,
  getAppropriationType,
  getAllAppropriationTypes,
  calculateExpirationDate,
  isFundingExpired,
  validateAppropriationWithFY,
  getColorOfMoney
};
