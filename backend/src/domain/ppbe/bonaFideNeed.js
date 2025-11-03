/**
 * PPBE-005: Bona Fide Need Validation
 *
 * Per 31 U.S.C. § 1502 and GAO Principles of Appropriations Law
 * The Bona Fide Need Rule: An appropriation is available only for a bona fide need
 * arising during the period of that appropriation's availability.
 *
 * Key Principles:
 * 1. The need must arise (occur) during the fiscal year of the appropriation
 * 2. Cannot use current year funds for future year needs (anti-augmentation)
 * 3. Cannot use future year funds for current year needs (improper obligational authority)
 * 4. Exceptions exist for certain contract types and situations
 *
 * Exceptions to the rule:
 * - Severable services contracts
 * - Stock/inventory items
 * - Multi-year contracts (when authorized)
 * - "Lead-time" exceptions for long production cycles
 */

const { getFiscalYear, getFiscalYearStartDate, getFiscalYearEndDate } = require('./fiscalYear');
const { getAppropriationType } = require('./appropriationType');

// Contract types and their bona fide need implications
const CONTRACT_TYPES = {
  SEVERABLE_SERVICE: {
    code: 'SEVERABLE_SERVICE',
    name: 'Severable Services',
    description: 'Services that are continuing in nature and can be separated into components',
    bonaFideNeedRule: 'Need arises when services are performed, not when contracted',
    crossFYAllowed: true,
    examples: ['Janitorial services', 'Grounds maintenance', 'IT support', 'Security services']
  },
  NON_SEVERABLE_SERVICE: {
    code: 'NON_SEVERABLE_SERVICE',
    name: 'Non-Severable Services',
    description: 'Services that constitute a single undertaking',
    bonaFideNeedRule: 'Entire contract must be performed in the fiscal year',
    crossFYAllowed: false,
    examples: ['Building construction', 'System development project', 'Single audit', 'One-time study']
  },
  SUPPLIES: {
    code: 'SUPPLIES',
    name: 'Supplies and Materials',
    description: 'Tangible items consumed in use',
    bonaFideNeedRule: 'Need arises when supplies are required for use',
    crossFYAllowed: false,
    stockingException: true,
    examples: ['Office supplies', 'Spare parts', 'Fuel', 'Ammunition']
  },
  EQUIPMENT: {
    code: 'EQUIPMENT',
    name: 'Equipment and Capital Assets',
    description: 'Durable goods and capital items',
    bonaFideNeedRule: 'Need arises when item is required',
    crossFYAllowed: false,
    leadTimeException: true,
    examples: ['Vehicles', 'Computers', 'Machinery', 'Weapons systems']
  }
};

/**
 * Validate bona fide need for an obligation
 * @param {Object} obligation - Obligation details
 * @returns {Object} Validation result
 */
function validateBonaFideNeed(obligation) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!obligation.fiscalYear) {
    errors.push('Fiscal year of appropriation is required');
  }

  if (!obligation.needDate && !obligation.performancePeriod) {
    errors.push('Need date or performance period is required for bona fide need validation');
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const appropriationFY = obligation.fiscalYear;
  const fyStart = getFiscalYearStartDate(appropriationFY);
  const fyEnd = getFiscalYearEndDate(appropriationFY);

  // Determine when the need arises
  let needDate = null;
  let needFY = null;

  if (obligation.needDate) {
    needDate = new Date(obligation.needDate);
    needFY = getFiscalYear(needDate);
  } else if (obligation.performancePeriod && obligation.performancePeriod.start) {
    // For contracts, need typically arises at start of performance
    needDate = new Date(obligation.performancePeriod.start);
    needFY = getFiscalYear(needDate);
  }

  // Check if need arises in the appropriation fiscal year
  const needMatchesFY = needFY === appropriationFY;

  if (!needMatchesFY) {
    // Check for exceptions
    const exception = checkBonaFideNeedExceptions(obligation, appropriationFY, needFY);

    if (exception.hasException) {
      warnings.push(
        `Bona fide need exception applied: ${exception.exceptionType}. ` +
        `${exception.justification}`
      );

      return {
        isValid: true,
        errors: [],
        warnings,
        needMatchesFY: false,
        exception: exception,
        appropriationFY,
        needFY
      };
    } else {
      errors.push(
        `Bona fide need violation: FY${appropriationFY} funds cannot be used for ` +
        `need arising in FY${needFY}. The need must arise during FY${appropriationFY} ` +
        `(${fyStart.toLocaleDateString()} - ${fyEnd.toLocaleDateString()}).`
      );

      return {
        isValid: false,
        errors,
        warnings,
        needMatchesFY: false,
        appropriationFY,
        needFY,
        violation: 'BONA_FIDE_NEED',
        reference: '31 U.S.C. § 1502'
      };
    }
  }

  // Need matches FY - generally valid
  return {
    isValid: true,
    errors: [],
    warnings,
    needMatchesFY: true,
    appropriationFY,
    needFY
  };
}

/**
 * Check for bona fide need exceptions
 * @param {Object} obligation - Obligation details
 * @param {number} appropriationFY - Fiscal year of appropriation
 * @param {number} needFY - Fiscal year when need arises
 * @returns {Object} Exception details
 */
function checkBonaFideNeedExceptions(obligation, appropriationFY, needFY) {
  const contractType = obligation.contractType;

  // Exception 1: Severable Services Contracts
  if (contractType === 'SEVERABLE_SERVICE') {
    if (obligation.performancePeriod) {
      const start = new Date(obligation.performancePeriod.start);
      const end = new Date(obligation.performancePeriod.end);
      const startFY = getFiscalYear(start);
      const endFY = getFiscalYear(end);

      // Severable services can cross FY boundaries
      if (startFY === appropriationFY || endFY === appropriationFY) {
        return {
          hasException: true,
          exceptionType: 'SEVERABLE_SERVICE',
          justification: 'Severable services contract may cross fiscal year boundaries. ' +
                        'The portion performed in the appropriation FY satisfies bona fide need.',
          reference: 'GAO Redbook, Chapter 5, Section B.2'
        };
      }
    }
  }

  // Exception 2: Stock/Inventory Items
  if (obligation.isStockItem === true || obligation.inventoryItem === true) {
    return {
      hasException: true,
      exceptionType: 'STOCK_INVENTORY',
      justification: 'Stock and inventory items needed to maintain normal operating levels ' +
                    'may be ordered in advance. The need is determined by when items will be consumed.',
      reference: '41 Comp. Gen. 739 (1962)'
    };
  }

  // Exception 3: Lead-Time Items
  if (obligation.hasLeadTimeException === true && obligation.leadTimeJustification) {
    if (needFY === appropriationFY + 1 && obligation.leadTimeMonths >= 12) {
      return {
        hasException: true,
        exceptionType: 'LEAD_TIME',
        justification: `Lead-time exception: ${obligation.leadTimeJustification}. ` +
                      `Production requires ${obligation.leadTimeMonths} months.`,
        reference: 'DoD FMR Volume 3, Chapter 8'
      };
    }
  }

  // Exception 4: Authorized Multi-Year Contract
  if (obligation.isMultiYearContract === true && obligation.multiYearAuthority) {
    return {
      hasException: true,
      exceptionType: 'MULTIYEAR_AUTHORITY',
      justification: `Multi-year contract authority: ${obligation.multiYearAuthority}`,
      reference: '10 U.S.C. § 2306b'
    };
  }

  // Exception 5: Continuing Resolution Authority
  if (obligation.continuingResolutionAuthority === true) {
    return {
      hasException: true,
      exceptionType: 'CONTINUING_RESOLUTION',
      justification: 'Obligation authorized under Continuing Resolution authority',
      reference: obligation.continuingResolutionReference || 'Continuing Resolution Authority'
    };
  }

  return {
    hasException: false
  };
}

/**
 * Validate severable services contract
 * @param {Object} contract - Contract details
 * @returns {Object} Validation result
 */
function validateSeverableServicesContract(contract) {
  const errors = [];
  const warnings = [];

  if (!contract.performancePeriod || !contract.performancePeriod.start || !contract.performancePeriod.end) {
    errors.push('Performance period with start and end dates is required for severable services');
    return { isValid: false, errors, warnings };
  }

  const startDate = new Date(contract.performancePeriod.start);
  const endDate = new Date(contract.performancePeriod.end);
  const startFY = getFiscalYear(startDate);
  const endFY = getFiscalYear(endDate);

  // Calculate portion in each fiscal year
  const fyPortions = {};
  let currentFY = startFY;

  while (currentFY <= endFY) {
    const fyStartDate = getFiscalYearStartDate(currentFY);
    const fyEndDate = getFiscalYearEndDate(currentFY);

    const periodStart = startDate > fyStartDate ? startDate : fyStartDate;
    const periodEnd = endDate < fyEndDate ? endDate : fyEndDate;

    if (periodStart <= periodEnd) {
      const daysInFY = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24)) + 1;
      fyPortions[currentFY] = daysInFY;
    }

    currentFY++;
  }

  // Calculate total days and percentages
  const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const fyPercentages = {};

  for (const [fy, days] of Object.entries(fyPortions)) {
    fyPercentages[fy] = ((days / totalDays) * 100).toFixed(2);
  }

  // Validate funding allocation matches service period
  if (contract.fundingByFY) {
    for (const [fy, funding] of Object.entries(contract.fundingByFY)) {
      const expectedPercentage = parseFloat(fyPercentages[fy] || 0);
      const totalFunding = Object.values(contract.fundingByFY).reduce((sum, amt) => sum + amt, 0);
      const actualPercentage = ((funding / totalFunding) * 100).toFixed(2);

      // Allow 5% tolerance for rounding
      if (Math.abs(expectedPercentage - actualPercentage) > 5) {
        warnings.push(
          `FY${fy} funding (${actualPercentage}%) does not match service period (${expectedPercentage}%). ` +
          `For severable services, funding should be proportional to services performed.`
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    contractType: 'SEVERABLE_SERVICE',
    performancePeriod: { startFY, endFY },
    fiscalYearPortions: fyPortions,
    fiscalYearPercentages: fyPercentages,
    totalDays
  };
}

/**
 * Determine if a service is severable or non-severable
 * @param {string} serviceDescription - Description of the service
 * @param {Object} contractDetails - Additional contract details
 * @returns {Object} Determination result
 */
function determineServiceSeverability(serviceDescription, contractDetails = {}) {
  const severableKeywords = [
    'maintenance', 'janitorial', 'grounds', 'recurring', 'continuing',
    'support', 'guard', 'security', 'custodial', 'routine', 'monthly',
    'periodic', 'ongoing', 'daily', 'weekly'
  ];

  const nonSeverableKeywords = [
    'construction', 'development', 'design', 'project', 'study',
    'audit', 'assessment', 'single', 'one-time', 'complete', 'deliver',
    'produce', 'create', 'build'
  ];

  const description = serviceDescription.toLowerCase();

  let severableScore = 0;
  let nonSeverableScore = 0;

  for (const keyword of severableKeywords) {
    if (description.includes(keyword)) severableScore++;
  }

  for (const keyword of nonSeverableKeywords) {
    if (description.includes(keyword)) nonSeverableScore++;
  }

  // Additional factors
  if (contractDetails.hasRecurringPayments) severableScore += 2;
  if (contractDetails.hasMilestones) nonSeverableScore += 2;
  if (contractDetails.hasDeliverable) nonSeverableScore += 2;

  const isSeverable = severableScore > nonSeverableScore;
  const confidence = Math.abs(severableScore - nonSeverableScore) > 2 ? 'high' : 'medium';

  return {
    isSeverable,
    confidence,
    severableScore,
    nonSeverableScore,
    recommendation: isSeverable ? 'SEVERABLE_SERVICE' : 'NON_SEVERABLE_SERVICE',
    note: confidence === 'medium'
      ? 'Manual review recommended - classification is not clear-cut'
      : 'Classification appears clear based on description'
  };
}

/**
 * Generate bona fide need compliance report
 * @param {Array} obligations - Array of obligations
 * @returns {Object} Compliance report
 */
function generateBonaFideNeedReport(obligations) {
  const report = {
    totalObligations: obligations.length,
    compliant: 0,
    violations: 0,
    exceptions: 0,
    exceptionTypes: {},
    violationDetails: [],
    generatedAt: new Date().toISOString()
  };

  for (const obligation of obligations) {
    const validation = validateBonaFideNeed(obligation);

    if (validation.isValid) {
      report.compliant++;

      if (validation.exception) {
        report.exceptions++;
        const exType = validation.exception.exceptionType;
        report.exceptionTypes[exType] = (report.exceptionTypes[exType] || 0) + 1;
      }
    } else {
      report.violations++;
      report.violationDetails.push({
        obligationId: obligation.id,
        appropriationFY: validation.appropriationFY,
        needFY: validation.needFY,
        errors: validation.errors
      });
    }
  }

  report.complianceRate = report.totalObligations > 0
    ? ((report.compliant / report.totalObligations) * 100).toFixed(2)
    : '0.00';

  return report;
}

module.exports = {
  CONTRACT_TYPES,
  validateBonaFideNeed,
  checkBonaFideNeedExceptions,
  validateSeverableServicesContract,
  determineServiceSeverability,
  generateBonaFideNeedReport
};
