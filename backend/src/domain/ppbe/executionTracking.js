/**
 * PPBE-009: Execution Phase Tracking
 *
 * Per DoD FMR Volume 3 - Financial Management Execution
 * Tracks the execution of appropriated funds through the obligation and expenditure cycle
 *
 * Fund Lifecycle Stages:
 * 1. APPORTIONED: OMB releases funds (SF-132)
 * 2. ALLOTTED: Internal distribution to operating units
 * 3. COMMITTED: Administrative reservation (pre-obligation)
 * 4. OBLIGATED: Legal liability created (contract, order, etc.)
 * 5. EXPENDED: Payment made (actual cash disbursement)
 * 6. CLOSED: Final accounting complete
 *
 * Key Metrics:
 * - Obligation Rate: Obligated / Available
 * - Expenditure Rate: Expended / Obligated
 * - Burn Rate: Monthly expenditure pace
 * - Unliquidated Obligations: Obligated but not expended
 */

const { getFiscalYear, getDaysRemainingInFiscalYear, getDaysElapsedInFiscalYear } = require('./fiscalYear');

/**
 * Execution stages
 */
const EXECUTION_STAGES = {
  APPORTIONED: {
    code: 'APPORTIONED',
    name: 'Apportioned',
    description: 'Funds released by OMB via SF-132',
    order: 1
  },
  ALLOTTED: {
    code: 'ALLOTTED',
    name: 'Allotted',
    description: 'Funds distributed to operating units',
    order: 2
  },
  COMMITTED: {
    code: 'COMMITTED',
    name: 'Committed',
    description: 'Administrative reservation of funds',
    order: 3
  },
  OBLIGATED: {
    code: 'OBLIGATED',
    name: 'Obligated',
    description: 'Legal liability incurred',
    order: 4
  },
  EXPENDED: {
    code: 'EXPENDED',
    name: 'Expended',
    description: 'Payment disbursed',
    order: 5
  },
  CLOSED: {
    code: 'CLOSED',
    name: 'Closed',
    description: 'Final accounting complete',
    order: 6
  }
};

/**
 * Calculate execution metrics
 * @param {Object} account - Budget account execution data
 * @returns {Object} Execution metrics
 */
function calculateExecutionMetrics(account) {
  const {
    appropriated = 0,
    apportioned = 0,
    allotted = 0,
    committed = 0,
    obligated = 0,
    expended = 0,
    fiscalYear
  } = account;

  const available = appropriated - obligated - committed;
  const unliquidatedObligations = obligated - expended;

  // Calculate rates
  const obligationRate = appropriated > 0 ? (obligated / appropriated) * 100 : 0;
  const expenditureRate = obligated > 0 ? (expended / obligated) * 100 : 0;
  const commitmentRate = appropriated > 0 ? (committed / appropriated) * 100 : 0;

  // Calculate execution velocity
  const currentFY = getFiscalYear();
  const daysElapsed = fiscalYear === currentFY ? getDaysElapsedInFiscalYear() : 365;
  const daysRemaining = fiscalYear === currentFY ? getDaysRemainingInFiscalYear() : 0;

  const dailyObligationRate = daysElapsed > 0 ? obligated / daysElapsed : 0;
  const dailyExpenditureRate = daysElapsed > 0 ? expended / daysElapsed : 0;

  // Project end-of-year status
  const projectedObligations = daysRemaining > 0
    ? obligated + (dailyObligationRate * daysRemaining)
    : obligated;

  const projectedExpenditures = daysRemaining > 0
    ? expended + (dailyExpenditureRate * daysRemaining)
    : expended;

  return {
    amounts: {
      appropriated,
      apportioned,
      allotted,
      committed,
      obligated,
      expended,
      available,
      unliquidatedObligations
    },
    rates: {
      obligationRate: obligationRate.toFixed(2),
      expenditureRate: expenditureRate.toFixed(2),
      commitmentRate: commitmentRate.toFixed(2),
      availabilityRate: appropriated > 0 ? ((available / appropriated) * 100).toFixed(2) : 0
    },
    velocity: {
      dailyObligationRate: dailyObligationRate.toFixed(2),
      dailyExpenditureRate: dailyExpenditureRate.toFixed(2),
      daysElapsed,
      daysRemaining
    },
    projections: {
      projectedObligations: Math.round(projectedObligations),
      projectedExpenditures: Math.round(projectedExpenditures),
      projectedUnobligated: Math.round(appropriated - projectedObligations),
      projectedUnliquidated: Math.round(projectedObligations - projectedExpenditures)
    },
    fiscalYear,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Track obligation performance
 * @param {Object} account - Account details
 * @param {Object} target - Target execution profile
 * @returns {Object} Performance analysis
 */
function trackObligationPerformance(account, target = null) {
  const metrics = calculateExecutionMetrics(account);
  const analysis = {
    status: 'ON_TRACK',
    variance: 0,
    concerns: [],
    recommendations: []
  };

  const obligationRate = parseFloat(metrics.rates.obligationRate);
  const daysElapsed = metrics.velocity.daysElapsed;
  const percentOfYearElapsed = (daysElapsed / 365) * 100;

  // Expected obligation rate should roughly track with time elapsed
  const expectedRate = target ? target.targetRate : percentOfYearElapsed;
  analysis.variance = obligationRate - expectedRate;

  // Determine status
  if (analysis.variance < -20) {
    analysis.status = 'SIGNIFICANTLY_BEHIND';
    analysis.concerns.push(`Obligation rate (${obligationRate.toFixed(2)}%) is significantly behind expected rate (${expectedRate.toFixed(2)}%)`);
    analysis.recommendations.push('Review and expedite pending obligations');
    analysis.recommendations.push('Identify and resolve execution barriers');
  } else if (analysis.variance < -10) {
    analysis.status = 'BEHIND';
    analysis.concerns.push(`Obligation rate is ${Math.abs(analysis.variance).toFixed(2)}% below target`);
    analysis.recommendations.push('Accelerate obligation activities');
  } else if (analysis.variance > 10 && metrics.velocity.daysRemaining < 30) {
    analysis.status = 'AHEAD';
    analysis.concerns.push('Rapid obligation rate - ensure funds are not being rushed at year-end');
    analysis.recommendations.push('Verify all obligations comply with bona fide need rule');
  }

  // Check for potential year-end issues
  if (metrics.velocity.daysRemaining < 60) {
    const unobligatedAmount = metrics.amounts.available;
    const dailyRateNeeded = unobligatedAmount / Math.max(metrics.velocity.daysRemaining, 1);

    if (dailyRateNeeded > metrics.velocity.dailyObligationRate * 2) {
      analysis.concerns.push(
        `Need to obligate $${unobligatedAmount.toLocaleString()} in ${metrics.velocity.daysRemaining} days. ` +
        `Requires ${((dailyRateNeeded / metrics.velocity.dailyObligationRate) * 100).toFixed(0)}% increase in daily rate.`
      );
      analysis.recommendations.push('Prioritize high-value obligations immediately');
    }
  }

  return {
    ...analysis,
    metrics,
    expectedRate: expectedRate.toFixed(2),
    actualRate: obligationRate.toFixed(2),
    percentOfYearElapsed: percentOfYearElapsed.toFixed(2)
  };
}

/**
 * Track expenditure performance
 * @param {Object} account - Account details
 * @returns {Object} Expenditure analysis
 */
function trackExpenditurePerformance(account) {
  const metrics = calculateExecutionMetrics(account);
  const analysis = {
    status: 'NORMAL',
    concerns: [],
    recommendations: []
  };

  const expenditureRate = parseFloat(metrics.rates.expenditureRate);
  const unliquidatedObligations = metrics.amounts.unliquidatedObligations;
  const obligated = metrics.amounts.obligated;

  // Check unliquidated obligations
  const unliquidatedPercentage = obligated > 0 ? (unliquidatedObligations / obligated) * 100 : 0;

  if (unliquidatedPercentage > 50 && obligated > 0) {
    analysis.status = 'HIGH_UNLIQUIDATED';
    analysis.concerns.push(
      `High unliquidated obligations: $${unliquidatedObligations.toLocaleString()} ` +
      `(${unliquidatedPercentage.toFixed(2)}% of obligations)`
    );
    analysis.recommendations.push('Review aged unliquidated obligations');
    analysis.recommendations.push('Verify payment schedules and deliverables');
  }

  // Check expenditure rate
  if (expenditureRate < 30 && metrics.rates.obligationRate > 70) {
    analysis.concerns.push(
      `Low expenditure rate (${expenditureRate.toFixed(2)}%) relative to obligation rate ` +
      `(${metrics.rates.obligationRate}%). Large unliquidated obligation backlog building.`
    );
    analysis.recommendations.push('Accelerate payment processing');
  }

  // Calculate burn rate
  const monthlyBurnRate = metrics.velocity.dailyExpenditureRate * 30;
  analysis.monthlyBurnRate = monthlyBurnRate.toFixed(2);

  return {
    ...analysis,
    metrics,
    unliquidatedPercentage: unliquidatedPercentage.toFixed(2),
    unliquidatedAmount: unliquidatedObligations
  };
}

/**
 * Generate execution status report
 * @param {Array} accounts - Array of budget accounts
 * @returns {Object} Comprehensive execution report
 */
function generateExecutionReport(accounts) {
  const report = {
    summary: {
      totalAccounts: accounts.length,
      totalAppropriated: 0,
      totalObligated: 0,
      totalExpended: 0,
      totalAvailable: 0,
      totalUnliquidated: 0,
      averageObligationRate: 0,
      averageExpenditureRate: 0
    },
    byStatus: {
      ON_TRACK: 0,
      BEHIND: 0,
      SIGNIFICANTLY_BEHIND: 0,
      AHEAD: 0
    },
    concerns: [],
    topPerformers: [],
    bottomPerformers: [],
    generatedAt: new Date().toISOString(),
    fiscalYear: getFiscalYear()
  };

  const performances = [];

  for (const account of accounts) {
    const metrics = calculateExecutionMetrics(account);
    const performance = trackObligationPerformance(account);

    report.summary.totalAppropriated += metrics.amounts.appropriated;
    report.summary.totalObligated += metrics.amounts.obligated;
    report.summary.totalExpended += metrics.amounts.expended;
    report.summary.totalAvailable += metrics.amounts.available;
    report.summary.totalUnliquidated += metrics.amounts.unliquidatedObligations;

    report.byStatus[performance.status] = (report.byStatus[performance.status] || 0) + 1;

    if (performance.concerns.length > 0) {
      report.concerns.push({
        account: account.name || account.id,
        concerns: performance.concerns
      });
    }

    performances.push({
      account: account.name || account.id,
      obligationRate: parseFloat(metrics.rates.obligationRate),
      expenditureRate: parseFloat(metrics.rates.expenditureRate),
      status: performance.status
    });
  }

  // Calculate averages
  if (accounts.length > 0) {
    report.summary.averageObligationRate = (
      (report.summary.totalObligated / report.summary.totalAppropriated) * 100
    ).toFixed(2);

    report.summary.averageExpenditureRate = report.summary.totalObligated > 0 ? (
      (report.summary.totalExpended / report.summary.totalObligated) * 100
    ).toFixed(2) : '0.00';
  }

  // Identify top and bottom performers
  performances.sort((a, b) => b.obligationRate - a.obligationRate);
  report.topPerformers = performances.slice(0, 5);
  report.bottomPerformers = performances.slice(-5).reverse();

  return report;
}

/**
 * Calculate fund availability at a given point in time
 * @param {Object} account - Account details
 * @param {Date} asOfDate - Date to calculate availability
 * @returns {Object} Availability calculation
 */
function calculateFundAvailability(account, asOfDate = new Date()) {
  const {
    appropriated = 0,
    obligated = 0,
    committed = 0,
    preCommitments = 0
  } = account;

  // Calculate net available
  const grossAvailable = appropriated;
  const reservedCommitted = committed;
  const reservedObligated = obligated;
  const reservedPreCommitments = preCommitments || 0;

  const netAvailable = grossAvailable - reservedCommitted - reservedObligated - reservedPreCommitments;

  return {
    asOfDate: asOfDate.toISOString(),
    grossAvailable,
    reserved: {
      obligated: reservedObligated,
      committed: reservedCommitted,
      preCommitments: reservedPreCommitments,
      total: reservedObligated + reservedCommitted + reservedPreCommitments
    },
    netAvailable,
    percentAvailable: grossAvailable > 0 ? ((netAvailable / grossAvailable) * 100).toFixed(2) : 0,
    canObligate: netAvailable > 0
  };
}

/**
 * Track monthly execution trends
 * @param {Array} monthlyData - Array of monthly execution data
 * @returns {Object} Trend analysis
 */
function analyzeExecutionTrends(monthlyData) {
  if (!monthlyData || monthlyData.length < 2) {
    return {
      isValid: false,
      error: 'Insufficient data for trend analysis (minimum 2 months required)'
    };
  }

  const trends = {
    obligation: [],
    expenditure: [],
    velocity: []
  };

  for (let i = 1; i < monthlyData.length; i++) {
    const current = monthlyData[i];
    const previous = monthlyData[i - 1];

    const obligationChange = current.obligated - previous.obligated;
    const expenditureChange = current.expended - previous.expended;

    trends.obligation.push({
      month: current.month,
      change: obligationChange,
      percentChange: previous.obligated > 0
        ? ((obligationChange / previous.obligated) * 100).toFixed(2)
        : 0
    });

    trends.expenditure.push({
      month: current.month,
      change: expenditureChange,
      percentChange: previous.expended > 0
        ? ((expenditureChange / previous.expended) * 100).toFixed(2)
        : 0
    });
  }

  // Calculate average monthly velocity
  const avgObligationVelocity = trends.obligation.reduce((sum, t) => sum + t.change, 0) / trends.obligation.length;
  const avgExpenditureVelocity = trends.expenditure.reduce((sum, t) => sum + t.change, 0) / trends.expenditure.length;

  return {
    isValid: true,
    trends,
    averages: {
      monthlyObligationVelocity: avgObligationVelocity.toFixed(2),
      monthlyExpenditureVelocity: avgExpenditureVelocity.toFixed(2)
    },
    dataPoints: monthlyData.length
  };
}

module.exports = {
  EXECUTION_STAGES,
  calculateExecutionMetrics,
  trackObligationPerformance,
  trackExpenditurePerformance,
  generateExecutionReport,
  calculateFundAvailability,
  analyzeExecutionTrends
};
