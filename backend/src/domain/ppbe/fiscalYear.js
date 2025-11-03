/**
 * PPBE-001: Fiscal Year Calculation Logic
 *
 * Federal fiscal year runs from October 1 to September 30
 * Per 31 U.S.C. § 1102 and DoD FMR Volume 2A
 *
 * A fiscal year is designated by the calendar year in which it ends
 * Example: FY2024 runs from October 1, 2023 to September 30, 2024
 */

const FISCAL_YEAR_START_MONTH = 9; // October (0-indexed)
const FISCAL_YEAR_START_DAY = 1;
const FISCAL_YEAR_END_MONTH = 8; // September (0-indexed)
const FISCAL_YEAR_END_DAY = 30;

/**
 * Get the fiscal year for a given date
 * @param {Date} date - The date to check (defaults to current date)
 * @returns {number} The fiscal year (e.g., 2024)
 */
function getFiscalYear(date = new Date()) {
  const d = new Date(date);
  const month = d.getMonth();
  const year = d.getFullYear();

  // If we're in Oct, Nov, or Dec, we're in the fiscal year of the next calendar year
  if (month >= FISCAL_YEAR_START_MONTH) {
    return year + 1;
  }

  return year;
}

/**
 * Get the start date of a fiscal year
 * @param {number} fiscalYear - The fiscal year (e.g., 2024)
 * @returns {Date} The start date (October 1 of previous calendar year)
 */
function getFiscalYearStartDate(fiscalYear) {
  return new Date(fiscalYear - 1, FISCAL_YEAR_START_MONTH, FISCAL_YEAR_START_DAY);
}

/**
 * Get the end date of a fiscal year
 * @param {number} fiscalYear - The fiscal year (e.g., 2024)
 * @returns {Date} The end date (September 30 of the fiscal year)
 */
function getFiscalYearEndDate(fiscalYear) {
  return new Date(fiscalYear, FISCAL_YEAR_END_MONTH, FISCAL_YEAR_END_DAY, 23, 59, 59, 999);
}

/**
 * Check if a date falls within a specific fiscal year
 * @param {Date} date - The date to check
 * @param {number} fiscalYear - The fiscal year to check against
 * @returns {boolean} True if date is within the fiscal year
 */
function isDateInFiscalYear(date, fiscalYear) {
  const d = new Date(date);
  const startDate = getFiscalYearStartDate(fiscalYear);
  const endDate = getFiscalYearEndDate(fiscalYear);

  return d >= startDate && d <= endDate;
}

/**
 * Get the number of days remaining in the current fiscal year
 * @param {Date} date - The reference date (defaults to current date)
 * @returns {number} Number of days remaining
 */
function getDaysRemainingInFiscalYear(date = new Date()) {
  const d = new Date(date);
  const fy = getFiscalYear(d);
  const endDate = getFiscalYearEndDate(fy);

  const diffTime = endDate - d;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get the number of days elapsed in the current fiscal year
 * @param {Date} date - The reference date (defaults to current date)
 * @returns {number} Number of days elapsed
 */
function getDaysElapsedInFiscalYear(date = new Date()) {
  const d = new Date(date);
  const fy = getFiscalYear(d);
  const startDate = getFiscalYearStartDate(fy);

  const diffTime = d - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calculate the fiscal quarter for a given date (1-4)
 * Q1: Oct-Dec, Q2: Jan-Mar, Q3: Apr-Jun, Q4: Jul-Sep
 * @param {Date} date - The date to check
 * @returns {number} The fiscal quarter (1-4)
 */
function getFiscalQuarter(date = new Date()) {
  const d = new Date(date);
  const month = d.getMonth();

  // Oct, Nov, Dec = Q1
  if (month >= 9) return 1;
  // Jan, Feb, Mar = Q2
  if (month <= 2) return 2;
  // Apr, May, Jun = Q3
  if (month <= 5) return 3;
  // Jul, Aug, Sep = Q4
  return 4;
}

/**
 * Get fiscal year display string
 * @param {number} fiscalYear - The fiscal year
 * @returns {string} Display string (e.g., "FY2024")
 */
function getFiscalYearDisplay(fiscalYear) {
  return `FY${fiscalYear}`;
}

/**
 * Get fiscal year range display string
 * @param {number} fiscalYear - The fiscal year
 * @returns {string} Range string (e.g., "FY2024 (Oct 1, 2023 - Sep 30, 2024)")
 */
function getFiscalYearRangeDisplay(fiscalYear) {
  const startDate = getFiscalYearStartDate(fiscalYear);
  const endDate = getFiscalYearEndDate(fiscalYear);

  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${getFiscalYearDisplay(fiscalYear)} (${startStr} - ${endStr})`;
}

/**
 * Validate if a fiscal year is valid
 * @param {number} fiscalYear - The fiscal year to validate
 * @returns {boolean} True if valid
 */
function isValidFiscalYear(fiscalYear) {
  return Number.isInteger(fiscalYear) && fiscalYear >= 1900 && fiscalYear <= 2200;
}

/**
 * Get current fiscal year
 * @returns {number} Current fiscal year
 */
function getCurrentFiscalYear() {
  return getFiscalYear(new Date());
}

module.exports = {
  getFiscalYear,
  getFiscalYearStartDate,
  getFiscalYearEndDate,
  isDateInFiscalYear,
  getDaysRemainingInFiscalYear,
  getDaysElapsedInFiscalYear,
  getFiscalQuarter,
  getFiscalYearDisplay,
  getFiscalYearRangeDisplay,
  isValidFiscalYear,
  getCurrentFiscalYear,
  FISCAL_YEAR_START_MONTH,
  FISCAL_YEAR_START_DAY,
  FISCAL_YEAR_END_MONTH,
  FISCAL_YEAR_END_DAY
};
