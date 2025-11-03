/**
 * PPBE-004: PTA (Purpose, Time, Amount) Validation
 *
 * Per 31 U.S.C. § 1301, § 1341, § 1342 and GAO Principles of Appropriations Law
 * The three fundamental restrictions on appropriated funds:
 *
 * PURPOSE: Funds must be used only for authorized purposes
 * TIME: Funds must be obligated within the time period specified
 * AMOUNT: Obligations cannot exceed the amount appropriated
 *
 * These are the core principles preventing misuse of federal funds.
 */

const { getFiscalYear, getFiscalYearEndDate, isDateInFiscalYear } = require('./fiscalYear');
const { validateAppropriationType, calculateExpirationDate, isFundingExpired } = require('./appropriationType');
const { validatePurpose } = require('./colorsOfMoney');

/**
 * Validate PURPOSE restriction
 * Ensures funds are used for their intended and authorized purposes
 * @param {Object} obligation - Obligation details
 * @returns {Object} Validation result
 */
function validatePurposeRestriction(obligation) {
  const errors = [];
  const warnings = [];

  if (!obligation.appropriationType) {
    errors.push('Appropriation type is required for purpose validation');
  }

  if (!obligation.purpose) {
    errors.push('Purpose description is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, restriction: 'PURPOSE' };
  }

  // Validate purpose against appropriation type
  const purposeValidation = validatePurpose(obligation.appropriationType, obligation.purpose);

  if (!purposeValidation.isValid) {
    errors.push(...purposeValidation.errors);
  }

  // Check for specific purpose restrictions
  if (obligation.restrictions && Array.isArray(obligation.restrictions)) {
    const purposeRestrictions = obligation.restrictions.filter(r => r.type === 'purpose');

    for (const restriction of purposeRestrictions) {
      if (restriction.prohibited && restriction.prohibited.includes(obligation.purpose)) {
        errors.push(`Purpose '${obligation.purpose}' is specifically prohibited by: ${restriction.reference}`);
      }

      if (restriction.required && !restriction.required.includes(obligation.purpose)) {
        warnings.push(`Purpose should be one of: ${restriction.required.join(', ')} per ${restriction.reference}`);
      }
    }
  }

  // Ensure adequate documentation
  if (!obligation.justification || obligation.justification.trim().length < 10) {
    warnings.push('Insufficient justification for purpose. Provide detailed explanation for audit trail.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    restriction: 'PURPOSE',
    purposeValidation
  };
}

/**
 * Validate TIME restriction
 * Ensures funds are obligated within authorized time period
 * @param {Object} obligation - Obligation details
 * @returns {Object} Validation result
 */
function validateTimeRestriction(obligation) {
  const errors = [];
  const warnings = [];

  if (!obligation.appropriationType) {
    errors.push('Appropriation type is required for time validation');
  }

  if (!obligation.fiscalYear) {
    errors.push('Fiscal year is required for time validation');
  }

  if (!obligation.obligationDate) {
    errors.push('Obligation date is required');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, restriction: 'TIME' };
  }

  const obligationDate = new Date(obligation.obligationDate);

  // Validate appropriation type
  const typeValidation = validateAppropriationType(obligation.appropriationType);
  if (!typeValidation.isValid) {
    errors.push(...typeValidation.errors);
    return { isValid: false, errors, warnings, restriction: 'TIME' };
  }

  // Calculate expiration
  const expiration = calculateExpirationDate(obligation.appropriationType, obligation.fiscalYear);

  if (!expiration.isValid) {
    errors.push(...(expiration.errors || []));
    return { isValid: false, errors, warnings, restriction: 'TIME' };
  }

  // Check if funds are expired
  const expirationStatus = isFundingExpired(
    obligation.appropriationType,
    obligation.fiscalYear,
    obligationDate
  );

  if (expirationStatus.isExpired) {
    errors.push(
      `Cannot obligate expired funds. ${obligation.appropriationType} FY${obligation.fiscalYear} ` +
      `expired on ${expiration.expirationDate.toLocaleDateString()}. ` +
      `This violates the time restriction of appropriations.`
    );
  }

  // Warn if obligation is near expiration
  if (!expirationStatus.isExpired && expirationStatus.daysUntilExpiration <= 30) {
    warnings.push(
      `Funds expire in ${expirationStatus.daysUntilExpiration} days. ` +
      `Ensure obligation is completed before ${expiration.expirationDate.toLocaleDateString()}.`
    );
  }

  // Check for bona fide need rule (obligation must be for current FY need)
  const obligationFY = getFiscalYear(obligationDate);
  if (obligation.needDate) {
    const needDate = new Date(obligation.needDate);
    const needFY = getFiscalYear(needDate);

    if (needFY !== obligation.fiscalYear) {
      errors.push(
        `Bona fide need mismatch: Obligation uses FY${obligation.fiscalYear} funds ` +
        `but need arises in FY${needFY}. This violates the bona fide need rule.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    restriction: 'TIME',
    expirationDate: expiration.expirationDate,
    expirationFY: expiration.expirationFY,
    daysUntilExpiration: expirationStatus.daysUntilExpiration,
    isExpired: expirationStatus.isExpired
  };
}

/**
 * Validate AMOUNT restriction
 * Ensures obligations do not exceed appropriated amounts
 * @param {Object} obligation - Obligation details
 * @param {Object} budgetStatus - Current budget status
 * @returns {Object} Validation result
 */
function validateAmountRestriction(obligation, budgetStatus) {
  const errors = [];
  const warnings = [];

  if (!obligation.amount || obligation.amount <= 0) {
    errors.push('Obligation amount must be greater than zero');
  }

  if (!budgetStatus) {
    errors.push('Budget status is required for amount validation');
    return { isValid: false, errors, warnings, restriction: 'AMOUNT' };
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, restriction: 'AMOUNT' };
  }

  const {
    appropriated = 0,
    obligated = 0,
    committed = 0,
    available = null
  } = budgetStatus;

  // Calculate available funds
  const actualAvailable = available !== null ? available : (appropriated - obligated - committed);
  const remainingAfterObligation = actualAvailable - obligation.amount;

  // Check for overobligation (Anti-Deficiency Act violation)
  if (remainingAfterObligation < 0) {
    errors.push(
      `Insufficient funds: Obligation of $${obligation.amount.toLocaleString()} exceeds ` +
      `available balance of $${actualAvailable.toLocaleString()}. ` +
      `This would violate the Anti-Deficiency Act (31 U.S.C. § 1341).`
    );
  }

  // Warn if obligation will consume significant portion of remaining funds
  const percentageUsed = (obligation.amount / actualAvailable) * 100;
  if (percentageUsed > 90 && remainingAfterObligation >= 0) {
    warnings.push(
      `This obligation will use ${percentageUsed.toFixed(1)}% of remaining available funds. ` +
      `Only $${remainingAfterObligation.toLocaleString()} will remain.`
    );
  }

  // Check for potential commitment issues
  if (committed > 0 && actualAvailable < committed + obligation.amount) {
    warnings.push(
      `Warning: Existing commitments of $${committed.toLocaleString()} may not be fully funded ` +
      `after this obligation.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    restriction: 'AMOUNT',
    budgetAnalysis: {
      appropriated,
      obligated,
      committed,
      available: actualAvailable,
      obligationAmount: obligation.amount,
      remainingAfterObligation,
      percentageUsed: percentageUsed.toFixed(2),
      wouldExceed: remainingAfterObligation < 0
    }
  };
}

/**
 * Comprehensive PTA validation
 * Validates all three restrictions: Purpose, Time, and Amount
 * @param {Object} obligation - Obligation details
 * @param {Object} budgetStatus - Current budget status
 * @returns {Object} Comprehensive validation result
 */
function validatePTA(obligation, budgetStatus) {
  const validations = {
    purpose: null,
    time: null,
    amount: null
  };

  const allErrors = [];
  const allWarnings = [];

  // Validate PURPOSE
  validations.purpose = validatePurposeRestriction(obligation);
  allErrors.push(...validations.purpose.errors);
  allWarnings.push(...validations.purpose.warnings);

  // Validate TIME
  validations.time = validateTimeRestriction(obligation);
  allErrors.push(...validations.time.errors);
  allWarnings.push(...validations.time.warnings);

  // Validate AMOUNT
  validations.amount = validateAmountRestriction(obligation, budgetStatus);
  allErrors.push(...validations.amount.errors);
  allWarnings.push(...validations.amount.warnings);

  // Determine overall status
  const allValid = validations.purpose.isValid && validations.time.isValid && validations.amount.isValid;

  return {
    isValid: allValid,
    errors: allErrors,
    warnings: allWarnings,
    validations,
    summary: {
      purposeValid: validations.purpose.isValid,
      timeValid: validations.time.isValid,
      amountValid: validations.amount.isValid,
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length
    },
    obligation: {
      id: obligation.id,
      amount: obligation.amount,
      appropriationType: obligation.appropriationType,
      fiscalYear: obligation.fiscalYear,
      purpose: obligation.purpose,
      obligationDate: obligation.obligationDate
    },
    timestamp: new Date().toISOString(),
    validatedBy: 'PTA Validator',
    reference: '31 U.S.C. § 1301 (Purpose, Time, Amount restrictions)'
  };
}

/**
 * Generate PTA compliance report
 * @param {Array} obligations - Array of obligations to analyze
 * @param {Object} budgetStatus - Budget status
 * @returns {Object} Compliance report
 */
function generatePTAComplianceReport(obligations, budgetStatus) {
  const report = {
    totalObligations: obligations.length,
    compliant: 0,
    nonCompliant: 0,
    warnings: 0,
    byRestriction: {
      purpose: { violations: 0, warnings: 0 },
      time: { violations: 0, warnings: 0 },
      amount: { violations: 0, warnings: 0 }
    },
    violations: [],
    generatedAt: new Date().toISOString()
  };

  for (const obligation of obligations) {
    const validation = validatePTA(obligation, budgetStatus);

    if (validation.isValid) {
      report.compliant++;
    } else {
      report.nonCompliant++;
      report.violations.push({
        obligationId: obligation.id,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    if (validation.warnings.length > 0) {
      report.warnings++;
    }

    // Track by restriction type
    if (!validation.validations.purpose.isValid) {
      report.byRestriction.purpose.violations++;
    }
    if (validation.validations.purpose.warnings.length > 0) {
      report.byRestriction.purpose.warnings++;
    }

    if (!validation.validations.time.isValid) {
      report.byRestriction.time.violations++;
    }
    if (validation.validations.time.warnings.length > 0) {
      report.byRestriction.time.warnings++;
    }

    if (!validation.validations.amount.isValid) {
      report.byRestriction.amount.violations++;
    }
    if (validation.validations.amount.warnings.length > 0) {
      report.byRestriction.amount.warnings++;
    }
  }

  report.complianceRate = report.totalObligations > 0
    ? ((report.compliant / report.totalObligations) * 100).toFixed(2)
    : '0.00';

  return report;
}

module.exports = {
  validatePurposeRestriction,
  validateTimeRestriction,
  validateAmountRestriction,
  validatePTA,
  generatePTAComplianceReport
};
