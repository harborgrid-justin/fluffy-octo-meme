# PPBE Domain Module

Comprehensive Planning, Programming, Budgeting, and Execution (PPBE) business logic for federal budget systems.

## Overview

This module implements production-grade PPBE domain logic following Department of Defense Financial Management Regulation (DoD FMR), United States Code Title 31 (Money and Finance), and GAO Principles of Appropriations Law.

**Version:** 1.0.0
**Compliance Date:** November 2025
**Regulatory Framework:** DoD FMR, 31 U.S.C., GAO Red Book

## Features

### PPBE-001: Fiscal Year Calculation Logic

Federal fiscal year utilities implementing Oct 1 - Sep 30 fiscal year cycle.

**Key Functions:**
- `getFiscalYear(date)` - Determine fiscal year for any date
- `getFiscalYearStartDate(fy)` - Get Oct 1 start date
- `getFiscalYearEndDate(fy)` - Get Sep 30 end date
- `getFiscalQuarter(date)` - Calculate fiscal quarter (Q1-Q4)
- `getDaysRemainingInFiscalYear(date)` - Days until FY end

**Compliance:** 31 U.S.C. § 1102

**Example:**
```javascript
const { getFiscalYear, getFiscalQuarter } = require('./ppbe/fiscalYear');

const fy = getFiscalYear(new Date('2024-10-15')); // Returns 2025
const quarter = getFiscalQuarter(new Date('2024-10-15')); // Returns 1 (Q1)
```

### PPBE-002: Appropriation Type Validation

Validates appropriation types and calculates fund expiration dates.

**Appropriation Types:**
- **O&M** (Operations & Maintenance): 1-year funds
- **MILPERS** (Military Personnel): 1-year funds
- **PROCUREMENT**: 3-5 year funds (varies by subtype)
- **RDT&E** (Research, Development, Test & Evaluation): 2-year funds
- **MILCON** (Military Construction): 5-year funds
- **NO-YEAR**: Funds available until expended

**Key Functions:**
- `validateAppropriationType(typeCode)` - Validate appropriation type
- `calculateExpirationDate(typeCode, fiscalYear)` - Calculate expiration
- `isFundingExpired(typeCode, appropriationFY)` - Check if expired

**Compliance:** DoD FMR Volume 2A, Chapter 1; 31 U.S.C. § 1301

**Example:**
```javascript
const { calculateExpirationDate } = require('./ppbe/appropriationType');

const expiration = calculateExpirationDate('PROCUREMENT', 2024);
// Returns: { expirationFY: 2026, expirationDate: '2026-09-30', availabilityYears: 3 }
```

### PPBE-003: Colors of Money Rules

Implements appropriation purpose restrictions per 31 U.S.C. § 1301(a).

**Key Functions:**
- `validatePurpose(typeCode, purpose)` - Validate authorized purpose
- `recommendAppropriationType(purpose, amount)` - Recommend correct type
- `validateNoCommingling(transactions)` - Prevent mixing appropriations
- `getAuthorizedPurposes(typeCode)` - List authorized purposes

**Cost Thresholds:**
- Equipment under $250K: O&M
- Equipment $250K+: Procurement
- Construction $750K+: MILCON

**Compliance:** 31 U.S.C. § 1301(a) - "Appropriations shall be applied only to the objects for which the appropriations were made"

**Example:**
```javascript
const { validatePurpose } = require('./ppbe/colorsOfMoney');

const validation = validatePurpose('OM', 'equipment_acquisition');
// Validates if O&M can be used for equipment acquisition
```

### PPBE-004: PTA (Purpose, Time, Amount) Validation

Validates the three fundamental restrictions on appropriated funds.

**Three Restrictions:**
1. **PURPOSE**: Funds must be used only for authorized purposes
2. **TIME**: Funds must be obligated within authorized time period
3. **AMOUNT**: Obligations cannot exceed appropriated amount

**Key Functions:**
- `validatePurposeRestriction(obligation)` - Validate purpose
- `validateTimeRestriction(obligation)` - Validate timing
- `validateAmountRestriction(obligation, budgetStatus)` - Validate amount
- `validatePTA(obligation, budgetStatus)` - Comprehensive validation
- `generatePTAComplianceReport(obligations, budgetStatus)` - Compliance reporting

**Compliance:** 31 U.S.C. § 1301, § 1341, § 1342; GAO Principles of Appropriations Law

**Example:**
```javascript
const { validatePTA } = require('./ppbe/ptaValidation');

const obligation = {
  appropriationType: 'OM',
  fiscalYear: 2024,
  amount: 500000,
  purpose: 'maintenance',
  obligationDate: '2024-06-15'
};

const budgetStatus = {
  appropriated: 10000000,
  obligated: 6000000,
  committed: 1000000
};

const validation = validatePTA(obligation, budgetStatus);
// Returns comprehensive PTA validation results
```

### PPBE-005: Bona Fide Need Validation

Implements the bona fide need rule: appropriations available only for needs arising during the period of availability.

**Key Functions:**
- `validateBonaFideNeed(obligation)` - Validate bona fide need
- `checkBonaFideNeedExceptions(obligation, appropriationFY, needFY)` - Check exceptions
- `validateSeverableServicesContract(contract)` - Validate severable services
- `determineServiceSeverability(description, details)` - Determine if severable

**Exceptions:**
- Severable services contracts
- Stock/inventory items
- Lead-time items (12+ months)
- Authorized multi-year contracts

**Compliance:** 31 U.S.C. § 1502; GAO Principles of Appropriations Law, Chapter 5

**Example:**
```javascript
const { validateBonaFideNeed } = require('./ppbe/bonaFideNeed');

const obligation = {
  fiscalYear: 2024,
  needDate: '2024-03-15',
  contractType: 'SEVERABLE_SERVICE',
  performancePeriod: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
};

const validation = validateBonaFideNeed(obligation);
// Validates that FY2024 funds can be used for need arising in FY2024
```

### PPBE-006: Anti-Deficiency Act Checks

Prevents violations of the Anti-Deficiency Act - CRIMINAL OFFENSE.

**Prohibitions:**
1. **§ 1341(a)(1)(A)**: Exceeding appropriation limits
2. **§ 1341(a)(1)(B)**: Obligation before appropriation
3. **§ 1342**: Accepting voluntary services
4. **§ 1517**: Apportionment violations

**Key Functions:**
- `checkOverobligation(budgetAccount, proposedObligation)` - Check for overobligation
- `checkAugmentation(transaction)` - Check for augmentation
- `checkVoluntaryServices(service)` - Check for voluntary services
- `checkAdvancePayment(payment)` - Check for advance obligations
- `validateAntiDeficiencyAct(transaction, budgetAccount)` - Comprehensive validation
- `generateViolationReport(violation)` - Generate violation report

**Severity Levels:**
- **CRITICAL**: Direct violation (criminal offense) - requires immediate reporting
- **HIGH**: Imminent risk - action within 24 hours
- **MEDIUM**: Potential risk - monitoring required
- **LOW**: Administrative concern

**Compliance:** 31 U.S.C. § 1341, § 1342, § 1517, § 1532

**WARNING:** Anti-Deficiency Act violations are CRIMINAL OFFENSES punishable by fines up to $5,000 and imprisonment up to 2 years.

**Example:**
```javascript
const { validateAntiDeficiencyAct } = require('./ppbe/antiDeficiencyAct');

const transaction = { amount: 500000 };
const budgetAccount = {
  appropriated: 10000000,
  apportioned: 8000000,
  obligated: 7600000,
  committed: 0
};

const validation = validateAntiDeficiencyAct(transaction, budgetAccount);
// Checks if transaction would violate Anti-Deficiency Act
```

### PPBE-007: Multi-Year Funding Calculations

Handles multi-year procurement, incremental funding, and advance procurement.

**Key Functions:**
- `validateFullFunding(contract)` - Validate full funding policy
- `calculateIncrementalFundingSchedule(contract)` - Calculate incremental funding
- `validateMultiYearContract(contract)` - Validate multi-year contract
- `calculateAdvanceProcurement(procurement)` - Calculate advance procurement
- `analyzeMultiYearFunding(program)` - Analyze multi-year funding
- `recommendFundingPhasing(requirement)` - Recommend phasing approach

**Funding Approaches:**
- **Full Funding**: Total cost funded upfront (DoD FMR standard)
- **Incremental Funding**: Partial funding over multiple years (requires authority)
- **Multi-Year Procurement**: Contracts spanning multiple fiscal years (10 U.S.C. § 2306b)
- **Advance Procurement**: Long lead-time items funded in advance

**Compliance:** DoD FMR Volume 2A, Chapter 8; 10 U.S.C. § 2306b, § 2306c

**Example:**
```javascript
const { calculateIncrementalFundingSchedule } = require('./ppbe/multiYearFunding');

const contract = {
  totalCost: 5000000,
  performancePeriod: {
    start: '2024-01-01',
    end: '2026-12-31'
  },
  appropriationType: 'PROCUREMENT'
};

const schedule = calculateIncrementalFundingSchedule(contract);
// Returns funding schedule by fiscal year
```

### PPBE-008: Budget Formulation Workflow

State machine for PPBE budget workflow through all four phases.

**PPBE Phases:**
1. **PLANNING**: Strategic guidance, program objectives (18-24 months before execution)
2. **PROGRAMMING**: Program Objective Memorandum (POM) development (12-18 months)
3. **BUDGETING**: Budget submission to Congress (6-12 months)
4. **EXECUTION**: Funds obligated and expended (current FY)

**Workflow States:**
- Planning: DRAFT → PLANNING_REVIEW → PLANNING_APPROVED
- Programming: PROGRAMMING → POM_REVIEW → POM_APPROVED
- Budgeting: BUDGET_FORMULATION → BUDGET_REVIEW → OMB_REVIEW → CONGRESSIONAL_SUBMISSION → APPROPRIATED
- Execution: EXECUTION → CLOSEOUT → CLOSED

**Key Functions:**
- `createBudgetWorkflow(budgetRequest)` - Create workflow instance
- `workflow.transition(toState, metadata)` - Transition between states
- `workflow.getProgress()` - Get progress percentage
- `validateBudgetRequest(budgetRequest)` - Validate budget request
- `generateWorkflowReport(budgetRequests)` - Generate workflow report

**Compliance:** DoD Instruction 7045.14 (PPBE Process)

**Example:**
```javascript
const { createBudgetWorkflow } = require('./ppbe/budgetWorkflow');

const budgetRequest = {
  id: '12345',
  title: 'IT Modernization',
  fiscalYear: 2025,
  amount: 10000000,
  state: 'DRAFT'
};

const workflow = createBudgetWorkflow(budgetRequest);
const result = workflow.transition('PLANNING_REVIEW', {
  userId: 'user123',
  reason: 'Ready for review'
});
```

### PPBE-009: Execution Phase Tracking

Tracks budget execution through obligation and expenditure lifecycle.

**Execution Stages:**
1. APPORTIONED: OMB releases funds (SF-132)
2. ALLOTTED: Internal distribution to operating units
3. COMMITTED: Administrative reservation
4. OBLIGATED: Legal liability created
5. EXPENDED: Payment made
6. CLOSED: Final accounting complete

**Key Metrics:**
- **Obligation Rate**: Obligated / Appropriated
- **Expenditure Rate**: Expended / Obligated
- **Burn Rate**: Monthly expenditure pace
- **Unliquidated Obligations**: Obligated but not expended

**Key Functions:**
- `calculateExecutionMetrics(account)` - Calculate execution metrics
- `trackObligationPerformance(account, target)` - Track obligation performance
- `trackExpenditurePerformance(account)` - Track expenditure performance
- `generateExecutionReport(accounts)` - Generate execution report
- `calculateFundAvailability(account, asOfDate)` - Calculate fund availability
- `analyzeExecutionTrends(monthlyData)` - Analyze execution trends

**Compliance:** DoD FMR Volume 3 (Financial Management Execution)

**Example:**
```javascript
const { calculateExecutionMetrics } = require('./ppbe/executionTracking');

const account = {
  appropriated: 10000000,
  obligated: 7500000,
  expended: 4500000,
  committed: 1000000,
  fiscalYear: 2024
};

const metrics = calculateExecutionMetrics(account);
// Returns: obligation rate, expenditure rate, burn rate, projections, etc.
```

### PPBE-010: Congressional Reporting Formats

Generates standard congressional budget reporting formats.

**Report Types:**
1. **Budget Justification** (Presidents Budget)
2. **OP-5**: Operation and Maintenance Exhibit
3. **P-1**: Procurement Program Exhibit
4. **R-2**: RDT&E Budget Item Justification
5. **C-1**: Military Construction Project Data
6. **DD Form 1415**: Reprogramming Action
7. **Quarterly Financial Reports**
8. **Congressional Budget Book**

**Key Functions:**
- `formatBudgetJustification(budgetData)` - Format budget justification
- `formatOMExhibit(omData)` - Format O&M exhibit (OP-5)
- `formatProcurementExhibit(procurementData)` - Format procurement (P-1)
- `formatRDTEExhibit(rdteData)` - Format RDT&E (R-2)
- `formatMILCONExhibit(milconData)` - Format MILCON (C-1)
- `formatReprogrammingAction(reprogrammingData)` - Format DD 1415
- `formatQuarterlyReport(quarterData)` - Format quarterly report
- `generateCongressionalBudgetBook(budgetData)` - Generate complete budget book

**Compliance:** Congressional Budget and Impoundment Control Act of 1974; DoD FMR Volume 2B

**Example:**
```javascript
const { formatBudgetJustification } = require('./ppbe/congressionalReporting');

const budgetData = {
  fiscalYear: 2025,
  appropriationType: 'OM',
  budgetActivity: 'BA-01 Operating Forces',
  amount: 5000000,
  currentYearAmount: 4800000,
  justification: {
    mission: 'Support operational readiness',
    goals: ['Increase readiness by 10%']
  }
};

const justification = formatBudgetJustification(budgetData);
// Returns formatted congressional budget justification
```

## Comprehensive Transaction Validation

The module provides a single function to validate transactions against all applicable PPBE rules:

```javascript
const ppbe = require('./ppbe');

const transaction = {
  id: 'OBL-2024-001',
  appropriationType: 'OM',
  fiscalYear: 2024,
  amount: 500000,
  purpose: 'maintenance',
  obligationDate: '2024-06-15',
  needDate: '2024-06-20'
};

const budgetAccount = {
  appropriated: 10000000,
  obligated: 6000000,
  committed: 1000000,
  apportioned: 9000000
};

const validation = ppbe.validateTransaction(transaction, budgetAccount);

if (!validation.isValid) {
  console.error('Validation failed:', validation.errors);

  if (validation.criticalViolations) {
    console.error('CRITICAL: Anti-Deficiency Act violation detected!');
  }
}
```

## Module Information

```javascript
const ppbe = require('./ppbe');

const info = ppbe.getModuleInfo();
console.log(info);
/*
{
  version: '1.0.0',
  name: 'PPBE Domain Module',
  compliance: {
    regulations: [...],
    lastUpdated: '2025-11-03'
  },
  features: [
    'PPBE-001: Fiscal Year Calculations',
    'PPBE-002: Appropriation Type Validation',
    ...
  ]
}
*/
```

## Regulatory Compliance

This module implements the following federal regulations and policies:

### United States Code (31 U.S.C.)
- **§ 1102**: Fiscal year definition
- **§ 1301**: Purpose, Time, Amount restrictions
- **§ 1341**: Anti-Deficiency Act (overobligation)
- **§ 1342**: Anti-Deficiency Act (voluntary services)
- **§ 1502**: Bona fide need rule
- **§ 1517**: Apportionment and reserves
- **§ 1532**: Augmentation of appropriations

### United States Code (10 U.S.C.)
- **§ 2306b**: Multi-year contracts (DoD)
- **§ 2306c**: Multi-year contracts (defense acquisition programs)

### DoD Financial Management Regulation (FMR)
- **Volume 2A**: Budget Formulation and Presentation
- **Volume 2B**: Budget Justification and Performance Information
- **Volume 3**: Financial Management Execution

### GAO Resources
- **Principles of Appropriations Law** (Red Book)
- GAO decisions and opinions on appropriations law

### Congressional Requirements
- Congressional Budget and Impoundment Control Act of 1974
- DoD Budget Request submission formats

## Testing

Example test cases:

```javascript
const { validatePTA } = require('./ppbe/ptaValidation');
const { checkOverobligation } = require('./ppbe/antiDeficiencyAct');

// Test PTA validation
const testObligation = {
  appropriationType: 'PROCUREMENT',
  fiscalYear: 2024,
  amount: 1000000,
  purpose: 'equipment_acquisition',
  obligationDate: '2024-03-15'
};

const testBudget = {
  appropriated: 5000000,
  obligated: 3000000,
  committed: 500000
};

const ptaResult = validatePTA(testObligation, testBudget);
console.assert(ptaResult.isValid, 'PTA validation should pass');

// Test Anti-Deficiency Act
const adaResult = checkOverobligation(testBudget, 2000000);
console.assert(!adaResult.violation, 'Should not violate ADA');
```

## Error Handling

All validation functions return structured error objects:

```javascript
{
  isValid: false,
  errors: [
    'Error message 1',
    'Error message 2'
  ],
  warnings: [
    'Warning message 1'
  ],
  // Additional validation-specific fields
}
```

Critical violations (Anti-Deficiency Act) include additional fields:

```javascript
{
  isValid: false,
  violation: true,
  severity: {
    level: 'CRITICAL',
    requiresReporting: true,
    reportTo: ['OMB', 'Congress', 'GAO']
  },
  errors: ['ANTI-DEFICIENCY ACT VIOLATION: ...']
}
```

## Audit Trail

All validations include timestamps and metadata for audit purposes:

```javascript
{
  isValid: true,
  timestamp: '2024-11-03T10:30:00Z',
  validatedBy: 'PTA Validator',
  reference: '31 U.S.C. § 1301'
}
```

## Support and Documentation

For questions or issues:

1. Review DoD FMR documentation
2. Consult GAO Principles of Appropriations Law
3. Reference 31 U.S.C. provisions
4. Contact agency budget/finance office

## Version History

- **1.0.0** (2025-11-03): Initial release with all 10 PPBE features

## License

This module implements federal regulations and is intended for use in federal budget systems.

## Disclaimer

This module provides business logic based on federal regulations and DoD policy. It should not be considered legal advice. Always consult with legal counsel and budget/finance professionals for specific situations. Violations of appropriations law can result in criminal penalties.
