/**
 * PPBE-010: Congressional Reporting Formats
 *
 * Per Congressional Budget and Impoundment Control Act of 1974
 * and DoD Financial Management Regulation Volume 2B
 *
 * Standard congressional reporting formats:
 * 1. Budget Justification Books (Presidents Budget)
 * 2. Operation and Maintenance (O&M) Exhibits
 * 3. Procurement Exhibits (P-Forms)
 * 4. RDT&E Budget Exhibits (R-Forms)
 * 5. Military Construction Exhibits (C-Forms)
 * 6. Reprogramming Actions (DD Form 1415)
 * 7. Quarterly Financial Reports
 * 8. Annual Financial Report
 */

const { getFiscalYear, getFiscalYearDisplay } = require('./fiscalYear');
const { getAppropriationType } = require('./appropriationType');

/**
 * Format Budget Justification (Presidents Budget format)
 * Standard format for congressional budget submission
 * @param {Object} budgetData - Budget submission data
 * @returns {Object} Formatted budget justification
 */
function formatBudgetJustification(budgetData) {
  const {
    fiscalYear,
    appropriationType,
    budgetActivity,
    programElement,
    amount,
    priorYearAmount,
    currentYearAmount,
    justification,
    performanceMetrics
  } = budgetData;

  const appropriationTypeObj = getAppropriationType(appropriationType);

  return {
    header: {
      title: 'BUDGET JUSTIFICATION',
      department: budgetData.department || 'Department of Defense',
      appropriation: appropriationTypeObj ? appropriationTypeObj.fullName : appropriationType,
      fiscalYear: getFiscalYearDisplay(fiscalYear),
      submissionDate: new Date().toISOString(),
      exhibitNumber: budgetData.exhibitNumber || 'TBD'
    },
    fiscalYearSummary: {
      budgetYear: {
        fy: fiscalYear,
        amount: formatCurrency(amount),
        label: `FY${fiscalYear} Request`
      },
      currentYear: {
        fy: fiscalYear - 1,
        amount: formatCurrency(currentYearAmount || 0),
        label: `FY${fiscalYear - 1} Enacted`
      },
      priorYear: {
        fy: fiscalYear - 2,
        amount: formatCurrency(priorYearAmount || 0),
        label: `FY${fiscalYear - 2} Actual`
      },
      change: {
        amount: formatCurrency(amount - (currentYearAmount || 0)),
        percentage: currentYearAmount > 0
          ? (((amount - currentYearAmount) / currentYearAmount) * 100).toFixed(2)
          : 'N/A'
      }
    },
    programDetails: {
      budgetActivity: budgetActivity || 'N/A',
      programElement: programElement || 'N/A',
      projectTitle: budgetData.title || budgetData.programName
    },
    justification: {
      missionDescription: justification?.mission || '',
      performanceGoals: justification?.goals || [],
      accomplishments: justification?.accomplishments || [],
      changeSummary: justification?.changeSummary || ''
    },
    performanceMetrics: performanceMetrics || [],
    formattedFor: 'Congressional Budget Justification Book'
  };
}

/**
 * Format O&M Budget Exhibit (OP-5)
 * Standard format for Operations & Maintenance appropriations
 * @param {Object} omData - O&M budget data
 * @returns {Object} Formatted OP-5 exhibit
 */
function formatOMExhibit(omData) {
  const {
    fiscalYear,
    budgetActivity,
    priorYear,
    currentYear,
    budgetYear,
    changes
  } = omData;

  return {
    exhibit: 'OP-5',
    title: 'OPERATION AND MAINTENANCE BUDGET EXHIBIT',
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    budgetActivity: budgetActivity || {
      code: 'BA-01',
      name: 'Operating Forces'
    },
    summary: {
      columns: [
        {
          label: `FY${fiscalYear - 2} Actual`,
          amount: formatCurrency(priorYear || 0)
        },
        {
          label: `FY${fiscalYear - 1} Estimate`,
          amount: formatCurrency(currentYear || 0)
        },
        {
          label: `FY${fiscalYear} Request`,
          amount: formatCurrency(budgetYear || 0)
        }
      ],
      totalChange: formatCurrency((budgetYear || 0) - (currentYear || 0))
    },
    changesSummary: changes || [],
    breakdownByElement: omData.elements || [],
    civMilBreakdown: {
      civilianFTE: omData.civilianFTE || 0,
      militaryEndStrength: omData.militaryEndStrength || 0
    },
    formType: 'OP-5'
  };
}

/**
 * Format Procurement Exhibit (P-1)
 * Standard format for Procurement appropriations
 * @param {Object} procurementData - Procurement budget data
 * @returns {Object} Formatted P-1 exhibit
 */
function formatProcurementExhibit(procurementData) {
  const {
    fiscalYear,
    lineItem,
    itemName,
    quantity,
    unitCost,
    totalCost,
    priorYearFunding,
    advanceProcurement
  } = procurementData;

  return {
    exhibit: 'P-1',
    title: 'PROCUREMENT PROGRAM',
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    lineItemNumber: lineItem,
    nomenclature: itemName,
    quantityAndCost: {
      quantity: quantity || 0,
      unitCost: formatCurrency(unitCost || 0),
      totalCost: formatCurrency(totalCost || 0),
      costType: procurementData.costType || 'TY$ (Then-Year Dollars)'
    },
    fundingSummary: {
      priorYears: formatCurrency(priorYearFunding || 0),
      currentRequest: formatCurrency(totalCost || 0),
      toComplete: formatCurrency(procurementData.costToComplete || 0)
    },
    advanceProcurement: advanceProcurement ? {
      amount: formatCurrency(advanceProcurement.amount),
      description: advanceProcurement.description
    } : null,
    technicalDescription: procurementData.technicalDescription || '',
    missionDescription: procurementData.missionDescription || '',
    programStatus: procurementData.programStatus || 'Production',
    formType: 'P-1'
  };
}

/**
 * Format RDT&E Exhibit (R-2)
 * Standard format for Research, Development, Test & Evaluation
 * @param {Object} rdteData - RDT&E budget data
 * @returns {Object} Formatted R-2 exhibit
 */
function formatRDTEExhibit(rdteData) {
  const {
    fiscalYear,
    programElement,
    projectTitle,
    budgetActivity,
    priorYear,
    currentYear,
    budgetYear
  } = rdteData;

  return {
    exhibit: 'R-2',
    title: 'RDT&E BUDGET ITEM JUSTIFICATION',
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    programElement: programElement || 'PE XXXXXX',
    projectTitle: projectTitle,
    budgetActivity: budgetActivity || {
      code: 'BA-1',
      name: 'Basic Research'
    },
    costSummary: {
      totalProgramElement: {
        priorYear: formatCurrency(priorYear || 0),
        currentYear: formatCurrency(currentYear || 0),
        budgetYear: formatCurrency(budgetYear || 0),
        costToComplete: formatCurrency(rdteData.costToComplete || 0)
      }
    },
    projects: rdteData.projects || [],
    accomplishments: rdteData.accomplishments || [],
    plansSummary: rdteData.plans || '',
    scheduleProfile: rdteData.schedule || {},
    formType: 'R-2'
  };
}

/**
 * Format MILCON Exhibit (C-1)
 * Standard format for Military Construction
 * @param {Object} milconData - MILCON budget data
 * @returns {Object} Formatted C-1 exhibit
 */
function formatMILCONExhibit(milconData) {
  const {
    fiscalYear,
    projectTitle,
    location,
    category,
    totalCost,
    priorYearFunding,
    currentRequest
  } = milconData;

  return {
    exhibit: 'C-1',
    title: 'MILITARY CONSTRUCTION PROJECT DATA',
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    projectInformation: {
      title: projectTitle,
      location: location || {
        installation: '',
        state: '',
        country: 'USA'
      },
      category: category || 'Other'
    },
    costData: {
      totalCost: formatCurrency(totalCost || 0),
      priorYearFunding: formatCurrency(priorYearFunding || 0),
      currentRequest: formatCurrency(currentRequest || 0),
      futureYears: formatCurrency((totalCost || 0) - (priorYearFunding || 0) - (currentRequest || 0))
    },
    projectJustification: milconData.justification || '',
    scopeOfWork: milconData.scopeOfWork || '',
    currentSituation: milconData.currentSituation || '',
    squareFootage: milconData.squareFootage || 0,
    formType: 'C-1'
  };
}

/**
 * Format Reprogramming Action (DD Form 1415)
 * Used for requesting reprogramming of appropriated funds
 * @param {Object} reprogrammingData - Reprogramming request data
 * @returns {Object} Formatted DD 1415
 */
function formatReprogrammingAction(reprogrammingData) {
  const {
    fiscalYear,
    appropriationType,
    fromProgram,
    toProgram,
    amount,
    justification,
    category
  } = reprogrammingData;

  const appropriationTypeObj = getAppropriationType(appropriationType);

  return {
    form: 'DD 1415',
    title: 'REPROGRAMMING ACTION',
    controlNumber: reprogrammingData.controlNumber || generateControlNumber(fiscalYear),
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    appropriation: appropriationTypeObj ? appropriationTypeObj.fullName : appropriationType,
    category: category || 'Below Threshold Reprogramming (BTR)',
    fromProgram: {
      programElement: fromProgram.programElement,
      title: fromProgram.title,
      currentAmount: formatCurrency(fromProgram.currentAmount),
      decreaseAmount: formatCurrency(amount)
    },
    toProgram: {
      programElement: toProgram.programElement,
      title: toProgram.title,
      currentAmount: formatCurrency(toProgram.currentAmount),
      increaseAmount: formatCurrency(amount)
    },
    netChange: formatCurrency(0), // Net zero for reprogramming
    justification: justification || '',
    impactStatement: reprogrammingData.impactStatement || '',
    congressionalNotification: {
      required: reprogrammingData.notificationRequired !== false,
      committees: [
        'House Armed Services Committee',
        'Senate Armed Services Committee',
        'House Appropriations Committee (Defense)',
        'Senate Appropriations Committee (Defense)'
      ]
    },
    submissionDate: new Date().toISOString(),
    formType: 'DD-1415'
  };
}

/**
 * Format Quarterly Financial Report
 * @param {Object} quarterData - Quarterly execution data
 * @returns {Object} Formatted quarterly report
 */
function formatQuarterlyReport(quarterData) {
  const {
    fiscalYear,
    quarter,
    appropriations
  } = quarterData;

  return {
    reportType: 'QUARTERLY_FINANCIAL_REPORT',
    fiscalYear: getFiscalYearDisplay(fiscalYear),
    quarter: `Q${quarter}`,
    reportingPeriod: getQuarterDates(fiscalYear, quarter),
    summary: {
      totalAppropriated: formatCurrency(
        appropriations.reduce((sum, a) => sum + (a.appropriated || 0), 0)
      ),
      totalObligated: formatCurrency(
        appropriations.reduce((sum, a) => sum + (a.obligated || 0), 0)
      ),
      totalExpended: formatCurrency(
        appropriations.reduce((sum, a) => sum + (a.expended || 0), 0)
      )
    },
    byAppropriation: appropriations.map(appr => ({
      type: appr.type,
      appropriated: formatCurrency(appr.appropriated || 0),
      obligated: formatCurrency(appr.obligated || 0),
      expended: formatCurrency(appr.expended || 0),
      obligationRate: appr.appropriated > 0
        ? (((appr.obligated || 0) / appr.appropriated) * 100).toFixed(2) + '%'
        : '0%',
      expenditureRate: appr.obligated > 0
        ? (((appr.expended || 0) / appr.obligated) * 100).toFixed(2) + '%'
        : '0%'
    })),
    generatedDate: new Date().toISOString()
  };
}

/**
 * Format currency for display
 * @param {number} amount - Dollar amount
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '$0';

  // Convert to thousands for most congressional formats
  const thousands = Math.round(amount / 1000);

  return `$${thousands.toLocaleString()}K`;
}

/**
 * Generate control number for reprogramming actions
 * @param {number} fiscalYear - Fiscal year
 * @returns {string} Control number
 */
function generateControlNumber(fiscalYear) {
  const year = fiscalYear.toString().slice(-2);
  const sequence = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

  return `FY${year}-${sequence}`;
}

/**
 * Get quarter date ranges
 * @param {number} fiscalYear - Fiscal year
 * @param {number} quarter - Quarter (1-4)
 * @returns {Object} Quarter date range
 */
function getQuarterDates(fiscalYear, quarter) {
  const quarters = {
    1: { start: `${fiscalYear - 1}-10-01`, end: `${fiscalYear - 1}-12-31` },
    2: { start: `${fiscalYear}-01-01`, end: `${fiscalYear}-03-31` },
    3: { start: `${fiscalYear}-04-01`, end: `${fiscalYear}-06-30` },
    4: { start: `${fiscalYear}-07-01`, end: `${fiscalYear}-09-30` }
  };

  return quarters[quarter] || quarters[1];
}

/**
 * Generate comprehensive congressional budget book
 * @param {Object} budgetData - Complete budget data
 * @returns {Object} Full congressional budget book
 */
function generateCongressionalBudgetBook(budgetData) {
  const {
    fiscalYear,
    department,
    appropriations
  } = budgetData;

  const book = {
    title: `DEPARTMENT BUDGET REQUEST`,
    subtitle: `Fiscal Year ${fiscalYear}`,
    department: department || 'Department of Defense',
    submissionDate: new Date().toISOString(),
    sections: []
  };

  // Executive Summary
  book.sections.push({
    section: 'EXECUTIVE_SUMMARY',
    title: 'Executive Summary',
    content: {
      totalRequest: formatCurrency(
        appropriations.reduce((sum, a) => sum + (a.amount || 0), 0)
      ),
      highlights: budgetData.executiveSummary?.highlights || [],
      priorities: budgetData.executiveSummary?.priorities || []
    }
  });

  // Budget by Appropriation
  for (const appropriation of appropriations) {
    let exhibit = null;

    switch (appropriation.type) {
      case 'OM':
        exhibit = formatOMExhibit(appropriation);
        break;
      case 'PROCUREMENT':
        exhibit = formatProcurementExhibit(appropriation);
        break;
      case 'RDTE':
        exhibit = formatRDTEExhibit(appropriation);
        break;
      case 'MILCON':
        exhibit = formatMILCONExhibit(appropriation);
        break;
      default:
        exhibit = formatBudgetJustification(appropriation);
    }

    book.sections.push({
      section: appropriation.type,
      title: appropriation.title,
      exhibit
    });
  }

  return book;
}

module.exports = {
  formatBudgetJustification,
  formatOMExhibit,
  formatProcurementExhibit,
  formatRDTEExhibit,
  formatMILCONExhibit,
  formatReprogrammingAction,
  formatQuarterlyReport,
  generateCongressionalBudgetBook,
  formatCurrency
};
