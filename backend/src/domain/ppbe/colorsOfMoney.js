/**
 * PPBE-003: Colors of Money Rules
 *
 * Per 31 U.S.C. § 1301(a) - "Appropriations shall be applied only to the objects
 * for which the appropriations were made except as otherwise provided by law."
 *
 * "Colors of Money" refers to restrictions on how different appropriation types
 * can be used. Each appropriation has specific purposes and limitations.
 *
 * Key Rules:
 * 1. Purpose: Funds must be used for authorized purposes
 * 2. Time: Funds must be obligated within time limits
 * 3. Amount: Cannot exceed appropriated amount
 * 4. Fungibility: Cannot commingle different appropriation types
 */

const { getAppropriationType, APPROPRIATION_TYPES } = require('./appropriationType');

// Authorized purpose categories by appropriation type
const AUTHORIZED_PURPOSES = {
  OM: [
    'personnel_civilian',
    'operations',
    'maintenance',
    'supplies',
    'services',
    'transportation',
    'training_operating',
    'minor_equipment', // Under threshold
    'contracted_services',
    'utilities',
    'base_operations'
  ],
  MILPERS: [
    'military_pay',
    'allowances',
    'subsistence',
    'permanent_change_of_station',
    'incentive_pay',
    'special_pay',
    'retired_pay_accrual'
  ],
  PROCUREMENT: [
    'equipment_acquisition',
    'weapons_systems',
    'vehicles',
    'aircraft',
    'ships',
    'ammunition',
    'missiles',
    'major_equipment', // Over threshold
    'spare_parts_initial',
    'modifications'
  ],
  RDTE: [
    'research',
    'development',
    'testing',
    'evaluation',
    'prototypes',
    'studies',
    'scientific_investigation',
    'technology_demonstration'
  ],
  MILCON: [
    'construction',
    'facility_acquisition',
    'major_renovation',
    'infrastructure',
    'utilities_infrastructure',
    'planning_design'
  ],
  FCH: [
    'family_housing_construction',
    'family_housing_maintenance',
    'family_housing_operations',
    'housing_utilities'
  ],
  NOYEAR: [
    'working_capital',
    'revolving_funds',
    'special_purpose'
  ]
};

// Equipment cost thresholds (simplified - actual thresholds vary)
const COST_THRESHOLDS = {
  MINOR_EQUIPMENT: 250000, // Under this = O&M
  MAJOR_EQUIPMENT: 250000, // At or above = Procurement
  MILCON_THRESHOLD: 750000 // Simplified threshold
};

/**
 * Validate if a purpose is authorized for an appropriation type
 * @param {string} typeCode - Appropriation type code
 * @param {string} purpose - Intended purpose
 * @returns {Object} Validation result
 */
function validatePurpose(typeCode, purpose) {
  const errors = [];
  const warnings = [];

  if (!typeCode) {
    errors.push('Appropriation type code is required');
    return { isValid: false, errors, warnings };
  }

  if (!purpose) {
    errors.push('Purpose is required');
    return { isValid: false, errors, warnings };
  }

  const normalizedCode = typeCode.toUpperCase();
  const appropriationType = getAppropriationType(normalizedCode);

  if (!appropriationType) {
    errors.push(`Invalid appropriation type: ${typeCode}`);
    return { isValid: false, errors, warnings };
  }

  const authorizedPurposes = AUTHORIZED_PURPOSES[normalizedCode] || [];
  const normalizedPurpose = purpose.toLowerCase().replace(/\s+/g, '_');

  const isAuthorized = authorizedPurposes.includes(normalizedPurpose);

  if (!isAuthorized) {
    errors.push(
      `Purpose '${purpose}' is not authorized for ${appropriationType.name} (${normalizedCode}). ` +
      `Authorized purposes: ${authorizedPurposes.join(', ')}`
    );
    return {
      isValid: false,
      errors,
      warnings,
      authorizedPurposes
    };
  }

  return {
    isValid: true,
    errors: [],
    warnings,
    appropriationType,
    purpose: normalizedPurpose,
    authorizedPurposes
  };
}

/**
 * Determine appropriate appropriation type based on purpose and amount
 * @param {string} purpose - Intended purpose
 * @param {number} amount - Dollar amount
 * @param {string} description - Detailed description
 * @returns {Object} Recommendation result
 */
function recommendAppropriationType(purpose, amount, description = '') {
  const recommendations = [];
  const normalizedPurpose = purpose.toLowerCase().replace(/\s+/g, '_');

  // Check each appropriation type
  for (const [code, purposes] of Object.entries(AUTHORIZED_PURPOSES)) {
    if (purposes.includes(normalizedPurpose)) {
      const appropriationType = getAppropriationType(code);
      recommendations.push({
        code,
        name: appropriationType.name,
        reason: `Purpose '${purpose}' is authorized for ${appropriationType.name}`,
        confidence: 'high'
      });
    }
  }

  // Apply cost-based rules
  if (normalizedPurpose.includes('equipment')) {
    if (amount < COST_THRESHOLDS.MINOR_EQUIPMENT) {
      recommendations.push({
        code: 'OM',
        name: 'Operations and Maintenance',
        reason: `Equipment under $${COST_THRESHOLDS.MINOR_EQUIPMENT.toLocaleString()} threshold should use O&M`,
        confidence: 'high'
      });
    } else {
      recommendations.push({
        code: 'PROCUREMENT',
        name: 'Procurement',
        reason: `Equipment at or above $${COST_THRESHOLDS.MAJOR_EQUIPMENT.toLocaleString()} threshold should use Procurement`,
        confidence: 'high'
      });
    }
  }

  if (normalizedPurpose.includes('construction') && amount >= COST_THRESHOLDS.MILCON_THRESHOLD) {
    recommendations.push({
      code: 'MILCON',
      name: 'Military Construction',
      reason: `Construction over $${COST_THRESHOLDS.MILCON_THRESHOLD.toLocaleString()} threshold requires MILCON`,
      confidence: 'high'
    });
  }

  // Remove duplicates
  const uniqueRecommendations = recommendations.reduce((acc, rec) => {
    if (!acc.find(r => r.code === rec.code)) {
      acc.push(rec);
    }
    return acc;
  }, []);

  return {
    recommendations: uniqueRecommendations,
    primaryRecommendation: uniqueRecommendations[0] || null,
    thresholdsApplied: COST_THRESHOLDS
  };
}

/**
 * Validate that funds are not being commingled
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Validation result
 */
function validateNoCommingling(transactions) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { isValid: true, errors: [], warnings: ['No transactions to validate'] };
  }

  // Group by obligation/activity ID
  const grouped = {};
  for (const txn of transactions) {
    const key = txn.obligationId || txn.activityId || 'ungrouped';
    if (!grouped[key]) {
      grouped[key] = [];
    }
    grouped[key].push(txn);
  }

  // Check each group for mixed appropriation types
  for (const [key, group] of Object.entries(grouped)) {
    const types = [...new Set(group.map(t => t.appropriationType))];

    if (types.length > 1) {
      errors.push(
        `Commingling detected in ${key}: Multiple appropriation types (${types.join(', ')}) ` +
        `used for single obligation/activity. This violates 31 U.S.C. § 1301(a).`
      );
    }

    // Check for mixing fiscal years of same type
    const fyTypes = group.map(t => `${t.appropriationType}-FY${t.fiscalYear}`);
    const uniqueFYTypes = [...new Set(fyTypes)];

    if (uniqueFYTypes.length > 1 && types.length === 1) {
      warnings.push(
        `Multiple fiscal years of ${types[0]} detected in ${key}. ` +
        `Ensure this is authorized (e.g., incrementally funded contract).`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    groupsAnalyzed: Object.keys(grouped).length
  };
}

/**
 * Check if appropriation type change is allowed
 * @param {string} fromType - Original appropriation type
 * @param {string} toType - Proposed appropriation type
 * @param {string} reason - Reason for change
 * @returns {Object} Validation result
 */
function validateAppropriationChange(fromType, toType, reason = '') {
  const errors = [];
  const warnings = [];

  if (fromType === toType) {
    warnings.push('No change in appropriation type');
    return { isValid: true, errors: [], warnings, changeRequired: false };
  }

  const fromAppr = getAppropriationType(fromType);
  const toAppr = getAppropriationType(toType);

  if (!fromAppr) {
    errors.push(`Invalid source appropriation type: ${fromType}`);
  }

  if (!toAppr) {
    errors.push(`Invalid target appropriation type: ${toType}`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Generally, appropriation type changes are not allowed without new appropriation
  warnings.push(
    'Changing appropriation type generally requires new appropriation authority. ' +
    'Original funds must be deobligated and new funds obligated with proper authority.'
  );

  if (!reason || reason.trim().length === 0) {
    errors.push('Justification required for appropriation type change');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiresNewAuthority: true,
    requiresJustification: true,
    fromType: fromAppr.name,
    toType: toAppr.name
  };
}

/**
 * Get authorized purposes for an appropriation type
 * @param {string} typeCode - Appropriation type code
 * @returns {Array} List of authorized purposes
 */
function getAuthorizedPurposes(typeCode) {
  const normalizedCode = typeCode.toUpperCase();
  return AUTHORIZED_PURPOSES[normalizedCode] || [];
}

/**
 * Validate multiple color of money rules at once
 * @param {Object} transaction - Transaction details
 * @returns {Object} Comprehensive validation result
 */
function validateColorOfMoneyRules(transaction) {
  const errors = [];
  const warnings = [];
  const validations = {};

  // Validate purpose
  if (transaction.purpose && transaction.appropriationType) {
    const purposeValidation = validatePurpose(transaction.appropriationType, transaction.purpose);
    validations.purpose = purposeValidation;

    if (!purposeValidation.isValid) {
      errors.push(...purposeValidation.errors);
    }
    warnings.push(...(purposeValidation.warnings || []));
  }

  // Get recommendation
  if (transaction.purpose && transaction.amount) {
    const recommendation = recommendAppropriationType(
      transaction.purpose,
      transaction.amount,
      transaction.description
    );
    validations.recommendation = recommendation;

    // Check if current type matches recommendation
    if (recommendation.primaryRecommendation &&
        transaction.appropriationType &&
        recommendation.primaryRecommendation.code !== transaction.appropriationType.toUpperCase()) {
      warnings.push(
        `Recommended appropriation type is ${recommendation.primaryRecommendation.name}, ` +
        `but ${transaction.appropriationType} is being used. Verify this is correct.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validations,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  AUTHORIZED_PURPOSES,
  COST_THRESHOLDS,
  validatePurpose,
  recommendAppropriationType,
  validateNoCommingling,
  validateAppropriationChange,
  getAuthorizedPurposes,
  validateColorOfMoneyRules
};
