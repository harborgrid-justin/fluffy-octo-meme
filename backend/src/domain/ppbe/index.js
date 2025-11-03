/**
 * PPBE Domain Module Index
 *
 * This module provides comprehensive PPBE (Planning, Programming, Budgeting, and Execution)
 * business logic for federal budget systems, specifically designed for Department of Defense
 * and other federal agencies.
 *
 * Implements regulations from:
 * - DoD Financial Management Regulation (FMR)
 * - 31 U.S.C. (United States Code, Money and Finance)
 * - GAO Principles of Appropriations Law (Red Book)
 * - OMB Circulars and Guidance
 *
 * @module ppbe
 * @version 1.0.0
 */

// PPBE-001: Fiscal Year Utilities
const fiscalYear = require('./fiscalYear');

// PPBE-002: Appropriation Type Validation
const appropriationType = require('./appropriationType');

// PPBE-003: Colors of Money Rules
const colorsOfMoney = require('./colorsOfMoney');

// PPBE-004: PTA (Purpose, Time, Amount) Validation
const ptaValidation = require('./ptaValidation');

// PPBE-005: Bona Fide Need Validation
const bonaFideNeed = require('./bonaFideNeed');

// PPBE-006: Anti-Deficiency Act Validation
const antiDeficiencyAct = require('./antiDeficiencyAct');

// PPBE-007: Multi-Year Funding Calculations
const multiYearFunding = require('./multiYearFunding');

// PPBE-008: Budget Workflow State Machine
const budgetWorkflow = require('./budgetWorkflow');

// PPBE-009: Execution Phase Tracking
const executionTracking = require('./executionTracking');

// PPBE-010: Congressional Reporting Formats
const congressionalReporting = require('./congressionalReporting');

/**
 * Comprehensive PPBE validation function
 * Validates a transaction against all relevant PPBE rules
 * @param {Object} transaction - Transaction/obligation to validate
 * @param {Object} budgetAccount - Budget account details
 * @param {Object} options - Validation options
 * @returns {Object} Comprehensive validation result
 */
function validateTransaction(transaction, budgetAccount, options = {}) {
  const validations = {};
  const allErrors = [];
  const allWarnings = [];

  // Fiscal Year validation
  if (transaction.fiscalYear) {
    validations.fiscalYear = {
      isValid: fiscalYear.isValidFiscalYear(transaction.fiscalYear),
      currentFY: fiscalYear.getCurrentFiscalYear()
    };
  }

  // Appropriation Type validation
  if (transaction.appropriationType) {
    validations.appropriationType = appropriationType.validateAppropriationType(
      transaction.appropriationType
    );
    if (!validations.appropriationType.isValid) {
      allErrors.push(...validations.appropriationType.errors);
    }
  }

  // PTA validation
  if (budgetAccount) {
    validations.pta = ptaValidation.validatePTA(transaction, budgetAccount);
    allErrors.push(...validations.pta.errors);
    allWarnings.push(...validations.pta.warnings);
  }

  // Bona Fide Need validation
  if (transaction.fiscalYear && (transaction.needDate || transaction.performancePeriod)) {
    validations.bonaFideNeed = bonaFideNeed.validateBonaFideNeed(transaction);
    if (!validations.bonaFideNeed.isValid) {
      allErrors.push(...validations.bonaFideNeed.errors);
    }
    allWarnings.push(...(validations.bonaFideNeed.warnings || []));
  }

  // Anti-Deficiency Act validation
  if (budgetAccount && transaction.amount) {
    validations.antiDeficiencyAct = antiDeficiencyAct.validateAntiDeficiencyAct(
      transaction,
      budgetAccount,
      options.apportionment
    );
    if (!validations.antiDeficiencyAct.isValid) {
      allErrors.push(...validations.antiDeficiencyAct.errors);
    }
    allWarnings.push(...validations.antiDeficiencyAct.warnings);
  }

  // Colors of Money validation
  if (transaction.purpose && transaction.appropriationType) {
    validations.colorsOfMoney = colorsOfMoney.validateColorOfMoneyRules(transaction);
    allErrors.push(...validations.colorsOfMoney.errors);
    allWarnings.push(...validations.colorsOfMoney.warnings);
  }

  const isValid = allErrors.length === 0;

  return {
    isValid,
    passed: isValid,
    errors: allErrors,
    warnings: allWarnings,
    validations,
    criticalViolations: validations.antiDeficiencyAct?.hasViolation || false,
    timestamp: new Date().toISOString(),
    transactionId: transaction.id
  };
}

/**
 * Get PPBE module version and compliance information
 */
function getModuleInfo() {
  return {
    version: '1.0.0',
    name: 'PPBE Domain Module',
    description: 'Federal PPBE business logic and compliance validation',
    compliance: {
      regulations: [
        'DoD FMR Volume 2A (Budgeting)',
        'DoD FMR Volume 2B (Justification)',
        'DoD FMR Volume 3 (Execution)',
        '31 U.S.C. § 1301 (Purpose, Time, Amount)',
        '31 U.S.C. § 1341 (Anti-Deficiency Act)',
        '31 U.S.C. § 1342 (Voluntary Services)',
        '31 U.S.C. § 1502 (Bona Fide Need)',
        '31 U.S.C. § 1517 (Apportionment)',
        '10 U.S.C. § 2306b (Multi-Year Contracts)',
        'GAO Principles of Appropriations Law'
      ],
      lastUpdated: '2025-11-03'
    },
    features: [
      'PPBE-001: Fiscal Year Calculations',
      'PPBE-002: Appropriation Type Validation',
      'PPBE-003: Colors of Money Rules',
      'PPBE-004: PTA Validation',
      'PPBE-005: Bona Fide Need Validation',
      'PPBE-006: Anti-Deficiency Act Checks',
      'PPBE-007: Multi-Year Funding Calculations',
      'PPBE-008: Budget Workflow State Machine',
      'PPBE-009: Execution Phase Tracking',
      'PPBE-010: Congressional Reporting Formats'
    ]
  };
}

module.exports = {
  // Individual modules
  fiscalYear,
  appropriationType,
  colorsOfMoney,
  ptaValidation,
  bonaFideNeed,
  antiDeficiencyAct,
  multiYearFunding,
  budgetWorkflow,
  executionTracking,
  congressionalReporting,

  // Utility functions
  validateTransaction,
  getModuleInfo
};
