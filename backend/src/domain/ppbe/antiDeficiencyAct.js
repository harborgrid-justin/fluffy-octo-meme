/**
 * PPBE-006: Anti-Deficiency Act Validation
 *
 * Per 31 U.S.C. § 1341, § 1342, § 1517
 * The Anti-Deficiency Act (ADA) prohibits:
 *
 * § 1341(a)(1)(A): Making or authorizing an expenditure or obligation exceeding
 *                   an amount available in an appropriation or fund
 *
 * § 1341(a)(1)(B): Involving the government in a contract or obligation for
 *                   payment of money before an appropriation is made
 *
 * § 1342: Accepting voluntary services (except in emergencies)
 *
 * § 1517: Apportionment violations
 *
 * Violations are CRIMINAL offenses punishable by fines and imprisonment.
 * Also subject to administrative discipline including removal from office.
 */

/**
 * ADA violation severity levels
 */
const VIOLATION_SEVERITY = {
  CRITICAL: {
    level: 'CRITICAL',
    description: 'Direct violation of appropriation limit - criminal offense',
    requiresReporting: true,
    reportingDeadline: 'Immediately',
    reportTo: ['OMB', 'Congress', 'GAO', 'Agency Head']
  },
  HIGH: {
    level: 'HIGH',
    description: 'Imminent risk of violation - immediate action required',
    requiresReporting: true,
    reportingDeadline: 'Within 24 hours',
    reportTo: ['Agency CFO', 'Comptroller']
  },
  MEDIUM: {
    level: 'MEDIUM',
    description: 'Potential risk of violation - monitoring required',
    requiresReporting: false,
    reportingDeadline: 'N/A',
    reportTo: ['Budget Officer']
  },
  LOW: {
    level: 'LOW',
    description: 'Administrative concern - no immediate violation risk',
    requiresReporting: false,
    reportingDeadline: 'N/A',
    reportTo: []
  }
};

/**
 * Check for Anti-Deficiency Act violations (overobligation)
 * 31 U.S.C. § 1341(a)(1)(A)
 * @param {Object} budgetAccount - Budget account details
 * @param {number} proposedObligation - Proposed obligation amount
 * @returns {Object} Violation check result
 */
function checkOverobligation(budgetAccount, proposedObligation) {
  const errors = [];
  const warnings = [];

  if (!budgetAccount) {
    errors.push('Budget account information is required');
    return { isValid: false, errors, warnings, violation: true };
  }

  if (!proposedObligation || proposedObligation <= 0) {
    errors.push('Proposed obligation amount must be greater than zero');
    return { isValid: false, errors, warnings };
  }

  const {
    appropriated = 0,
    apportioned = null, // OMB apportionment
    allotted = null,    // Agency allotment
    obligated = 0,
    committed = 0
  } = budgetAccount;

  // Determine the controlling limit
  let controllingLimit = appropriated;
  let limitType = 'APPROPRIATION';

  if (apportioned !== null && apportioned < controllingLimit) {
    controllingLimit = apportioned;
    limitType = 'APPORTIONMENT';
  }

  if (allotted !== null && allotted < controllingLimit) {
    controllingLimit = allotted;
    limitType = 'ALLOTMENT';
  }

  // Calculate available balance
  const obligationsAndCommitments = obligated + committed;
  const available = controllingLimit - obligationsAndCommitments;
  const remainingAfter = available - proposedObligation;

  // Determine violation status
  let violation = false;
  let severity = null;

  if (remainingAfter < 0) {
    violation = true;
    severity = VIOLATION_SEVERITY.CRITICAL;

    errors.push(
      `ANTI-DEFICIENCY ACT VIOLATION: Proposed obligation of $${proposedObligation.toLocaleString()} ` +
      `would exceed ${limitType} limit of $${controllingLimit.toLocaleString()} ` +
      `by $${Math.abs(remainingAfter).toLocaleString()}. ` +
      `Current obligations: $${obligated.toLocaleString()}, ` +
      `Commitments: $${committed.toLocaleString()}. ` +
      `This violates 31 U.S.C. § 1341(a)(1)(A) and is a CRIMINAL OFFENSE.`
    );
  } else if (remainingAfter < controllingLimit * 0.05) {
    // Less than 5% remaining - high risk
    severity = VIOLATION_SEVERITY.HIGH;
    warnings.push(
      `HIGH RISK: Only $${remainingAfter.toLocaleString()} (${((remainingAfter / controllingLimit) * 100).toFixed(2)}%) ` +
      `will remain after this obligation. Immediate review required to prevent ADA violation.`
    );
  } else if (remainingAfter < controllingLimit * 0.10) {
    // Less than 10% remaining - medium risk
    severity = VIOLATION_SEVERITY.MEDIUM;
    warnings.push(
      `CAUTION: Only $${remainingAfter.toLocaleString()} (${((remainingAfter / controllingLimit) * 100).toFixed(2)}%) ` +
      `will remain after this obligation. Monitor closely.`
    );
  }

  return {
    isValid: !violation,
    violation,
    severity,
    errors,
    warnings,
    analysis: {
      appropriated,
      apportioned,
      allotted,
      controllingLimit,
      limitType,
      obligated,
      committed,
      available,
      proposedObligation,
      remainingAfter,
      percentRemaining: controllingLimit > 0 ? ((remainingAfter / controllingLimit) * 100).toFixed(2) : 0,
      wouldViolate: violation
    },
    statute: '31 U.S.C. § 1341(a)(1)(A)',
    reportingRequired: severity ? severity.requiresReporting : false
  };
}

/**
 * Check for augmentation violations
 * 31 U.S.C. § 1532 - Prohibits augmenting appropriations from outside sources
 * @param {Object} transaction - Transaction details
 * @returns {Object} Validation result
 */
function checkAugmentation(transaction) {
  const errors = [];
  const warnings = [];

  if (!transaction.fundingSource) {
    warnings.push('Funding source not specified - cannot validate augmentation rules');
    return { isValid: true, errors, warnings };
  }

  const prohibitedSources = [
    'GIFT',
    'DONATION',
    'PRIVATE_FUNDS',
    'NON_FEDERAL'
  ];

  if (prohibitedSources.includes(transaction.fundingSource)) {
    // Check for specific authorization
    if (!transaction.augmentationAuthority || !transaction.statutoryAuthority) {
      errors.push(
        `Potential augmentation violation: Using ${transaction.fundingSource} to supplement ` +
        `appropriated funds requires specific statutory authority. ` +
        `Reference 31 U.S.C. § 1532.`
      );

      return {
        isValid: false,
        errors,
        warnings,
        violation: 'AUGMENTATION',
        statute: '31 U.S.C. § 1532'
      };
    } else {
      warnings.push(
        `Augmentation authority cited: ${transaction.statutoryAuthority}. ` +
        `Verify this authority permits acceptance of ${transaction.fundingSource}.`
      );
    }
  }

  return {
    isValid: true,
    errors,
    warnings
  };
}

/**
 * Check for voluntary services violations
 * 31 U.S.C. § 1342 - Prohibits accepting voluntary services
 * @param {Object} service - Service details
 * @returns {Object} Validation result
 */
function checkVoluntaryServices(service) {
  const errors = [];
  const warnings = [];

  if (!service.compensated && !service.isEmergency) {
    errors.push(
      'ANTI-DEFICIENCY ACT VIOLATION: Accepting voluntary (uncompensated) services ' +
      'is prohibited except in emergencies involving the safety of human life or ' +
      'protection of property. This violates 31 U.S.C. § 1342.'
    );

    return {
      isValid: false,
      errors,
      warnings,
      violation: 'VOLUNTARY_SERVICE',
      severity: VIOLATION_SEVERITY.CRITICAL,
      statute: '31 U.S.C. § 1342'
    };
  }

  if (service.isEmergency) {
    warnings.push(
      'Emergency exception claimed for voluntary services. Document the emergency ' +
      'conditions and ensure they meet the statutory requirements.'
    );

    if (!service.emergencyJustification) {
      errors.push('Emergency justification required for voluntary services exception');
      return { isValid: false, errors, warnings };
    }
  }

  return {
    isValid: true,
    errors,
    warnings
  };
}

/**
 * Check for advance payment violations
 * 31 U.S.C. § 1341(a)(1)(B) - Obligation before appropriation
 * @param {Object} payment - Payment details
 * @returns {Object} Validation result
 */
function checkAdvancePayment(payment) {
  const errors = [];
  const warnings = [];

  if (!payment.appropriationDate) {
    warnings.push('Appropriation date not provided - cannot validate advance payment rules');
    return { isValid: true, errors, warnings };
  }

  const paymentDate = new Date(payment.paymentDate || payment.obligationDate);
  const appropriationDate = new Date(payment.appropriationDate);

  if (paymentDate < appropriationDate) {
    // Check for specific authorization
    if (!payment.advancePaymentAuthority) {
      errors.push(
        'ANTI-DEFICIENCY ACT VIOLATION: Obligation/payment made before appropriation is available. ' +
        `Payment date: ${paymentDate.toLocaleDateString()}, ` +
        `Appropriation date: ${appropriationDate.toLocaleDateString()}. ` +
        'This violates 31 U.S.C. § 1341(a)(1)(B).'
      );

      return {
        isValid: false,
        errors,
        warnings,
        violation: 'ADVANCE_OBLIGATION',
        severity: VIOLATION_SEVERITY.CRITICAL,
        statute: '31 U.S.C. § 1341(a)(1)(B)'
      };
    } else {
      warnings.push(
        `Advance payment authority cited: ${payment.advancePaymentAuthority}. ` +
        `Verify authority permits payment before appropriation.`
      );
    }
  }

  return {
    isValid: true,
    errors,
    warnings
  };
}

/**
 * Check for apportionment violations
 * 31 U.S.C. § 1517 - Apportionment and reserve controls
 * @param {Object} obligation - Obligation details
 * @param {Object} apportionment - OMB apportionment details
 * @returns {Object} Validation result
 */
function checkApportionmentViolation(obligation, apportionment) {
  const errors = [];
  const warnings = [];

  if (!apportionment) {
    warnings.push('No apportionment data provided - cannot validate § 1517 compliance');
    return { isValid: true, errors, warnings };
  }

  const {
    category, // 'A' (quarterly) or 'B' (other periods/purposes)
    amount,
    period,
    restrictions
  } = apportionment;

  // Validate obligation is within apportioned period
  if (period) {
    const obligationDate = new Date(obligation.obligationDate);
    const periodStart = new Date(period.start);
    const periodEnd = new Date(period.end);

    if (obligationDate < periodStart || obligationDate > periodEnd) {
      errors.push(
        `Apportionment violation: Obligation date ${obligationDate.toLocaleDateString()} ` +
        `is outside apportioned period (${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}). ` +
        `This violates 31 U.S.C. § 1517.`
      );

      return {
        isValid: false,
        errors,
        warnings,
        violation: 'APPORTIONMENT_PERIOD',
        severity: VIOLATION_SEVERITY.CRITICAL,
        statute: '31 U.S.C. § 1517'
      };
    }
  }

  // Check for footnote restrictions
  if (restrictions && Array.isArray(restrictions)) {
    for (const restriction of restrictions) {
      if (restriction.type === 'PROHIBITED' &&
          restriction.activities &&
          restriction.activities.includes(obligation.purpose)) {
        errors.push(
          `Apportionment restriction violation: Activity '${obligation.purpose}' is prohibited ` +
          `by OMB footnote: ${restriction.footnote}. This violates 31 U.S.C. § 1517.`
        );

        return {
          isValid: false,
          errors,
          warnings,
          violation: 'APPORTIONMENT_RESTRICTION',
          severity: VIOLATION_SEVERITY.CRITICAL,
          statute: '31 U.S.C. § 1517'
        };
      }
    }
  }

  return {
    isValid: true,
    errors,
    warnings
  };
}

/**
 * Comprehensive Anti-Deficiency Act validation
 * @param {Object} transaction - Transaction/obligation details
 * @param {Object} budgetAccount - Budget account details
 * @param {Object} apportionment - Apportionment details
 * @returns {Object} Comprehensive validation result
 */
function validateAntiDeficiencyAct(transaction, budgetAccount, apportionment = null) {
  const validations = {};
  const allErrors = [];
  const allWarnings = [];
  let highestSeverity = null;

  // Check overobligation (§ 1341(a)(1)(A))
  if (budgetAccount && transaction.amount) {
    validations.overobligation = checkOverobligation(budgetAccount, transaction.amount);
    allErrors.push(...validations.overobligation.errors);
    allWarnings.push(...validations.overobligation.warnings);

    if (validations.overobligation.severity) {
      highestSeverity = validations.overobligation.severity;
    }
  }

  // Check augmentation (§ 1532)
  validations.augmentation = checkAugmentation(transaction);
  allErrors.push(...validations.augmentation.errors);
  allWarnings.push(...validations.augmentation.warnings);

  // Check voluntary services (§ 1342)
  if (transaction.isService) {
    validations.voluntaryServices = checkVoluntaryServices(transaction);
    allErrors.push(...validations.voluntaryServices.errors);
    allWarnings.push(...validations.voluntaryServices.warnings);

    if (validations.voluntaryServices.severity &&
        (!highestSeverity || validations.voluntaryServices.severity.level === 'CRITICAL')) {
      highestSeverity = validations.voluntaryServices.severity;
    }
  }

  // Check advance payments (§ 1341(a)(1)(B))
  if (transaction.appropriationDate) {
    validations.advancePayment = checkAdvancePayment(transaction);
    allErrors.push(...validations.advancePayment.errors);
    allWarnings.push(...validations.advancePayment.warnings);

    if (validations.advancePayment.severity &&
        (!highestSeverity || validations.advancePayment.severity.level === 'CRITICAL')) {
      highestSeverity = validations.advancePayment.severity;
    }
  }

  // Check apportionment (§ 1517)
  if (apportionment) {
    validations.apportionment = checkApportionmentViolation(transaction, apportionment);
    allErrors.push(...validations.apportionment.errors);
    allWarnings.push(...validations.apportionment.warnings);

    if (validations.apportionment.severity &&
        (!highestSeverity || validations.apportionment.severity.level === 'CRITICAL')) {
      highestSeverity = validations.apportionment.severity;
    }
  }

  const hasViolation = allErrors.length > 0;

  return {
    isValid: !hasViolation,
    hasViolation,
    severity: highestSeverity,
    errors: allErrors,
    warnings: allWarnings,
    validations,
    requiresReporting: highestSeverity ? highestSeverity.requiresReporting : false,
    reportingDeadline: highestSeverity ? highestSeverity.reportingDeadline : null,
    reportTo: highestSeverity ? highestSeverity.reportTo : [],
    timestamp: new Date().toISOString(),
    criticalWarning: hasViolation ?
      'ANTI-DEFICIENCY ACT VIOLATIONS ARE CRIMINAL OFFENSES. ' +
      'IMMEDIATELY HALT TRANSACTION AND REPORT TO APPROPRIATE AUTHORITIES.' : null
  };
}

/**
 * Generate ADA violation report for submission
 * @param {Object} violation - Violation details
 * @returns {Object} Formatted report
 */
function generateViolationReport(violation) {
  return {
    reportType: 'ANTI-DEFICIENCY ACT VIOLATION',
    reportDate: new Date().toISOString(),
    statute: violation.statute || '31 U.S.C. § 1341',
    severity: violation.severity ? violation.severity.level : 'UNKNOWN',
    violationType: violation.violation || 'UNKNOWN',
    description: violation.errors.join('; '),
    transaction: {
      id: violation.transactionId,
      amount: violation.amount,
      date: violation.date,
      account: violation.account
    },
    reportingRequirements: {
      required: violation.requiresReporting || false,
      deadline: violation.reportingDeadline || 'N/A',
      recipients: violation.reportTo || []
    },
    analysis: violation.analysis || {},
    remedialActions: [
      'Immediately halt the transaction',
      'Notify agency head and CFO',
      'Report to OMB and Congress if required',
      'Conduct investigation',
      'Implement corrective actions',
      'Document all actions taken'
    ]
  };
}

module.exports = {
  VIOLATION_SEVERITY,
  checkOverobligation,
  checkAugmentation,
  checkVoluntaryServices,
  checkAdvancePayment,
  checkApportionmentViolation,
  validateAntiDeficiencyAct,
  generateViolationReport
};
