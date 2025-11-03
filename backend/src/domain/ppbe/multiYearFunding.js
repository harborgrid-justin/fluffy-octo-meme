/**
 * PPBE-007: Multi-Year Funding Calculations
 *
 * Per 10 U.S.C. § 2306b, § 2306c and DoD FMR Volume 2A, Chapter 8
 * Handles multi-year procurement, incremental funding, and advance procurement
 *
 * Funding Types:
 * 1. Full Funding: Total cost funded upfront (standard policy)
 * 2. Incremental Funding: Partial funding over multiple years (authorized exceptions)
 * 3. Multi-Year Procurement: Contracts spanning multiple fiscal years
 * 4. Advance Procurement: Long lead-time items funded in advance
 *
 * Full Funding Policy: DoD FMR Vol 2A requires full funding at time of obligation
 * for most programs. Exceptions require specific statutory authority.
 */

const { getFiscalYear, getFiscalYearEndDate } = require('./fiscalYear');
const { calculateExpirationDate } = require('./appropriationType');

/**
 * Validate full funding policy compliance
 * @param {Object} contract - Contract details
 * @returns {Object} Validation result
 */
function validateFullFunding(contract) {
  const errors = [];
  const warnings = [];

  if (!contract.totalCost || contract.totalCost <= 0) {
    errors.push('Total contract cost is required for full funding validation');
    return { isValid: false, errors, warnings };
  }

  if (!contract.initialFunding || contract.initialFunding <= 0) {
    errors.push('Initial funding amount is required');
    return { isValid: false, errors, warnings };
  }

  const fundingRatio = (contract.initialFunding / contract.totalCost) * 100;
  const isFullyFunded = fundingRatio >= 100;

  if (!isFullyFunded) {
    // Check for authorized exception
    if (!contract.incrementalFundingAuthority) {
      errors.push(
        `Full Funding Policy violation: Contract total cost is $${contract.totalCost.toLocaleString()} ` +
        `but only $${contract.initialFunding.toLocaleString()} (${fundingRatio.toFixed(2)}%) is funded. ` +
        `DoD FMR Volume 2A requires full funding at obligation unless specific authority exists.`
      );

      return {
        isValid: false,
        errors,
        warnings,
        fundingRatio: fundingRatio.toFixed(2),
        shortfall: contract.totalCost - contract.initialFunding,
        requiresAuthority: true
      };
    } else {
      warnings.push(
        `Incremental funding authority cited: ${contract.incrementalFundingAuthority}. ` +
        `Verify this authority permits ${fundingRatio.toFixed(2)}% initial funding.`
      );
    }
  }

  return {
    isValid: true,
    errors,
    warnings,
    isFullyFunded,
    fundingRatio: fundingRatio.toFixed(2),
    totalCost: contract.totalCost,
    initialFunding: contract.initialFunding
  };
}

/**
 * Calculate incremental funding schedule
 * @param {Object} contract - Contract details
 * @returns {Object} Funding schedule
 */
function calculateIncrementalFundingSchedule(contract) {
  const errors = [];
  const warnings = [];

  if (!contract.totalCost) {
    errors.push('Total cost is required');
    return { isValid: false, errors };
  }

  if (!contract.performancePeriod || !contract.performancePeriod.start || !contract.performancePeriod.end) {
    errors.push('Performance period with start and end dates is required');
    return { isValid: false, errors };
  }

  const startDate = new Date(contract.performancePeriod.start);
  const endDate = new Date(contract.performancePeriod.end);
  const startFY = getFiscalYear(startDate);
  const endFY = getFiscalYear(endDate);

  // Calculate funding by fiscal year based on performance period
  const schedule = [];
  let totalAllocated = 0;

  for (let fy = startFY; fy <= endFY; fy++) {
    const fyStart = getFiscalYearEndDate(fy - 1);
    const fyEnd = getFiscalYearEndDate(fy);

    // Determine overlap period
    const periodStart = startDate > fyStart ? startDate : fyStart;
    const periodEnd = endDate < fyEnd ? endDate : fyEnd;

    if (periodStart <= periodEnd) {
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      const fyDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
      const percentage = (fyDays / totalDays) * 100;
      const amount = (contract.totalCost * percentage) / 100;

      schedule.push({
        fiscalYear: fy,
        startDate: periodStart,
        endDate: periodEnd,
        days: fyDays,
        percentage: percentage.toFixed(2),
        amount: Math.round(amount),
        appropriationType: contract.appropriationType || 'PROCUREMENT'
      });

      totalAllocated += Math.round(amount);
    }
  }

  // Adjust for rounding errors
  if (totalAllocated !== contract.totalCost) {
    const difference = contract.totalCost - totalAllocated;
    schedule[schedule.length - 1].amount += difference;
    warnings.push(`Rounding adjustment of $${difference} applied to final year`);
  }

  return {
    isValid: true,
    errors,
    warnings,
    schedule,
    totalCost: contract.totalCost,
    totalAllocated: contract.totalCost,
    fiscalYears: endFY - startFY + 1,
    startFY,
    endFY
  };
}

/**
 * Validate multi-year procurement contract
 * Per 10 U.S.C. § 2306b
 * @param {Object} contract - Contract details
 * @returns {Object} Validation result
 */
function validateMultiYearContract(contract) {
  const errors = [];
  const warnings = [];

  // Multi-year contracts require specific conditions
  const requiredConditions = [
    'Substantial savings compared to annual contracts',
    'Realistic cost estimates',
    'Stable requirement for at least 5 years',
    'Stable funding',
    'Statutory authority for multi-year contracting'
  ];

  if (!contract.multiYearAuthority) {
    errors.push(
      'Multi-year procurement contracts require specific statutory authority per 10 U.S.C. § 2306b'
    );
  }

  if (!contract.estimatedSavings || contract.estimatedSavings <= 0) {
    warnings.push(
      'Multi-year contracts should demonstrate substantial savings. Document expected savings.'
    );
  } else {
    const savingsPercentage = ((contract.estimatedSavings / contract.totalCost) * 100).toFixed(2);
    if (savingsPercentage < 10) {
      warnings.push(
        `Estimated savings of ${savingsPercentage}% may not justify multi-year contract. ` +
        `Typically requires 10% or greater savings.`
      );
    }
  }

  if (!contract.contractYears || contract.contractYears < 2) {
    errors.push('Multi-year contract must span at least 2 fiscal years');
  }

  if (!contract.cancellationCeiling) {
    warnings.push(
      'Cancellation ceiling should be established per 10 U.S.C. § 2306b(g) to limit government liability'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    requiredConditions,
    statute: '10 U.S.C. § 2306b',
    contractYears: contract.contractYears,
    estimatedSavings: contract.estimatedSavings
  };
}

/**
 * Calculate advance procurement funding
 * For long lead-time items (typically components for future procurement)
 * @param {Object} procurement - Procurement details
 * @returns {Object} Calculation result
 */
function calculateAdvanceProcurement(procurement) {
  const errors = [];
  const warnings = [];

  if (!procurement.endItem || !procurement.endItemFY) {
    errors.push('End item and delivery fiscal year required for advance procurement');
    return { isValid: false, errors };
  }

  if (!procurement.componentCost) {
    errors.push('Component cost is required');
    return { isValid: false, errors };
  }

  if (!procurement.leadTimeMonths) {
    errors.push('Lead time in months is required');
    return { isValid: false, errors };
  }

  const currentFY = getFiscalYear();
  const advanceFYs = procurement.endItemFY - currentFY;

  // Advance procurement typically 1-2 years ahead
  if (advanceFYs > 2) {
    warnings.push(
      `Advance procurement ${advanceFYs} years ahead is unusual. ` +
      `Verify lead time justification.`
    );
  }

  if (procurement.leadTimeMonths < 12) {
    warnings.push(
      `Lead time of ${procurement.leadTimeMonths} months may not justify advance procurement. ` +
      `Typically requires 12+ months lead time.`
    );
  }

  // Determine which FY appropriation to use
  const procurementFY = procurement.endItemFY - 1; // Usually funded in FY prior to end item

  return {
    isValid: true,
    errors,
    warnings,
    procurementFY,
    endItemFY: procurement.endItemFY,
    componentCost: procurement.componentCost,
    leadTimeMonths: procurement.leadTimeMonths,
    justification: `Component required ${procurement.leadTimeMonths} months before ` +
                   `end item delivery in FY${procurement.endItemFY}`,
    appropriationType: 'PROCUREMENT'
  };
}

/**
 * Track funding over multiple years
 * @param {Object} program - Program details
 * @returns {Object} Multi-year funding analysis
 */
function analyzeMultiYearFunding(program) {
  const errors = [];
  const warnings = [];

  if (!program.fundingProfile || !Array.isArray(program.fundingProfile)) {
    errors.push('Funding profile by fiscal year is required');
    return { isValid: false, errors };
  }

  const analysis = {
    totalProgramCost: 0,
    totalObligated: 0,
    totalExpended: 0,
    byFiscalYear: {},
    expiringFunds: [],
    availableFunds: []
  };

  const currentFY = getFiscalYear();

  for (const fyFunding of program.fundingProfile) {
    const {
      fiscalYear,
      appropriationType,
      appropriated = 0,
      obligated = 0,
      expended = 0
    } = fyFunding;

    analysis.totalProgramCost += appropriated;
    analysis.totalObligated += obligated;
    analysis.totalExpended += expended;

    // Calculate expiration
    const expiration = calculateExpirationDate(appropriationType, fiscalYear);
    const isExpired = !expiration.neverExpires && currentFY > expiration.expirationFY;
    const available = appropriated - obligated;

    analysis.byFiscalYear[fiscalYear] = {
      appropriationType,
      appropriated,
      obligated,
      expended,
      available,
      expirationFY: expiration.expirationFY,
      isExpired,
      obligationRate: appropriated > 0 ? ((obligated / appropriated) * 100).toFixed(2) : 0,
      expenditureRate: obligated > 0 ? ((expended / obligated) * 100).toFixed(2) : 0
    };

    // Track expiring funds
    if (!isExpired && expiration.expirationFY === currentFY && available > 0) {
      analysis.expiringFunds.push({
        fiscalYear,
        appropriationType,
        amount: available,
        expirationDate: expiration.expirationDate
      });
    }

    // Track available funds
    if (!isExpired && available > 0) {
      analysis.availableFunds.push({
        fiscalYear,
        appropriationType,
        amount: available,
        expirationFY: expiration.expirationFY
      });
    }
  }

  // Calculate overall rates
  analysis.overallObligationRate = analysis.totalProgramCost > 0
    ? ((analysis.totalObligated / analysis.totalProgramCost) * 100).toFixed(2)
    : 0;

  analysis.overallExpenditureRate = analysis.totalObligated > 0
    ? ((analysis.totalExpended / analysis.totalObligated) * 100).toFixed(2)
    : 0;

  analysis.remainingToBudget = program.totalProgramCost
    ? program.totalProgramCost - analysis.totalProgramCost
    : 0;

  // Generate warnings
  if (analysis.expiringFunds.length > 0) {
    const totalExpiring = analysis.expiringFunds.reduce((sum, f) => sum + f.amount, 0);
    warnings.push(
      `$${totalExpiring.toLocaleString()} in funds expire at end of current FY${currentFY}. ` +
      `Ensure these funds are obligated or will be lost.`
    );
  }

  if (parseFloat(analysis.overallObligationRate) < 50 && program.fundingProfile.length > 2) {
    warnings.push(
      `Low obligation rate of ${analysis.overallObligationRate}% across multi-year program. ` +
      `Review execution strategy.`
    );
  }

  return {
    isValid: true,
    errors,
    warnings,
    analysis,
    currentFY
  };
}

/**
 * Generate funding phasing recommendations
 * @param {Object} requirement - Requirement details
 * @returns {Object} Phasing recommendations
 */
function recommendFundingPhasing(requirement) {
  const recommendations = [];

  const {
    totalCost,
    urgency = 'normal',
    riskLevel = 'medium',
    contractType,
    performancePeriod
  } = requirement;

  // Default recommendation: Full funding
  recommendations.push({
    approach: 'FULL_FUNDING',
    description: 'Fund entire requirement upfront (DoD FMR standard policy)',
    advantages: ['Simplified execution', 'Lower risk', 'Policy compliant'],
    disadvantages: ['Large upfront commitment', 'Less flexibility'],
    confidence: 'high'
  });

  // Consider incremental funding for specific cases
  if (performancePeriod) {
    const startDate = new Date(performancePeriod.start);
    const endDate = new Date(performancePeriod.end);
    const startFY = getFiscalYear(startDate);
    const endFY = getFiscalYear(endDate);

    if (endFY > startFY && contractType === 'SEVERABLE_SERVICE') {
      recommendations.push({
        approach: 'INCREMENTAL_FUNDING',
        description: 'Fund severable services incrementally by fiscal year',
        advantages: ['Matches funding to performance', 'Spreads budget impact'],
        disadvantages: ['Requires close monitoring', 'Continuation risk'],
        confidence: 'high',
        requiresAuthority: true
      });
    }
  }

  // Multi-year contract consideration
  if (totalCost > 10000000 && urgency === 'low' && performancePeriod) {
    const years = Math.ceil((new Date(performancePeriod.end) - new Date(performancePeriod.start)) / (365 * 24 * 60 * 60 * 1000));

    if (years >= 3) {
      recommendations.push({
        approach: 'MULTIYEAR_CONTRACT',
        description: 'Structure as multi-year procurement contract',
        advantages: ['Potential cost savings', 'Vendor stability', 'Reduced admin'],
        disadvantages: ['Less flexibility', 'Cancellation costs'],
        confidence: 'medium',
        requiresAuthority: true,
        estimatedSavings: '10-15%'
      });
    }
  }

  return {
    recommendations,
    primaryRecommendation: recommendations[0],
    totalOptions: recommendations.length
  };
}

module.exports = {
  validateFullFunding,
  calculateIncrementalFundingSchedule,
  validateMultiYearContract,
  calculateAdvanceProcurement,
  analyzeMultiYearFunding,
  recommendFundingPhasing
};
