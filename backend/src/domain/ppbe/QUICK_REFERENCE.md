# PPBE Quick Reference Guide

## Common Use Cases

### 1. Validate a Budget Obligation

```javascript
const ppbe = require('./ppbe');

// Transaction to validate
const obligation = {
  id: 'OBL-2024-12345',
  appropriationType: 'OM',
  fiscalYear: 2024,
  amount: 500000,
  purpose: 'maintenance',
  obligationDate: '2024-06-15',
  needDate: '2024-07-01',
  justification: 'Equipment maintenance contract'
};

// Current budget status
const budgetAccount = {
  appropriated: 10000000,
  obligated: 7000000,
  committed: 1500000,
  apportioned: 9500000
};

// Validate
const result = ppbe.validateTransaction(obligation, budgetAccount);

if (!result.isValid) {
  console.error('Validation Errors:', result.errors);
  if (result.criticalViolations) {
    console.error('⚠️  CRITICAL: Anti-Deficiency Act violation!');
  }
} else {
  console.log('✓ Transaction is valid');
  if (result.warnings.length > 0) {
    console.warn('Warnings:', result.warnings);
  }
}
```

### 2. Calculate Fiscal Year

```javascript
const { getFiscalYear, getFiscalQuarter } = require('./ppbe/fiscalYear');

// What fiscal year is this date?
const fy = getFiscalYear(new Date('2024-10-15')); // Returns 2025

// What quarter?
const quarter = getFiscalQuarter(new Date('2024-10-15')); // Returns 1 (Q1)

// Days remaining in FY
const { getDaysRemainingInFiscalYear } = require('./ppbe/fiscalYear');
const daysLeft = getDaysRemainingInFiscalYear(); // Days until Sep 30
```

### 3. Check Fund Expiration

```javascript
const { calculateExpirationDate, isFundingExpired } = require('./ppbe/appropriationType');

// When do FY2024 Procurement funds expire?
const expiration = calculateExpirationDate('PROCUREMENT', 2024);
console.log(expiration.expirationFY); // 2026
console.log(expiration.expirationDate); // Sep 30, 2026

// Are they expired now?
const status = isFundingExpired('PROCUREMENT', 2024);
console.log(status.isExpired); // false (if current FY <= 2026)
console.log(status.daysUntilExpiration); // Days remaining
```

### 4. Validate Purpose (Colors of Money)

```javascript
const { validatePurpose, recommendAppropriationType } = require('./ppbe/colorsOfMoney');

// Can O&M be used for equipment?
const validation = validatePurpose('OM', 'equipment_acquisition');
if (!validation.isValid) {
  console.log('Not authorized:', validation.errors);
}

// What appropriation type should I use?
const recommendation = recommendAppropriationType('equipment_acquisition', 300000);
console.log(recommendation.primaryRecommendation);
// { code: 'PROCUREMENT', name: 'Procurement', reason: '...' }
```

### 5. Check for Anti-Deficiency Act Violations

```javascript
const { checkOverobligation } = require('./ppbe/antiDeficiencyAct');

const budgetAccount = {
  appropriated: 10000000,
  apportioned: 9000000,
  obligated: 8500000,
  committed: 400000
};

const result = checkOverobligation(budgetAccount, 500000);

if (result.violation) {
  console.error('⚠️  ANTI-DEFICIENCY ACT VIOLATION!');
  console.error(result.errors);
  console.error('Severity:', result.severity.level);
  console.error('Must report to:', result.severity.reportTo);
}
```

### 6. Validate Bona Fide Need

```javascript
const { validateBonaFideNeed } = require('./ppbe/bonaFideNeed');

const obligation = {
  fiscalYear: 2024,
  needDate: '2024-05-15', // When does the need arise?
  contractType: 'NON_SEVERABLE_SERVICE',
  amount: 250000
};

const result = validateBonaFideNeed(obligation);

if (!result.isValid) {
  console.error('Bona fide need violation:', result.errors);
} else if (result.exception) {
  console.log('Exception applied:', result.exception.exceptionType);
}
```

### 7. Track Budget Execution

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

console.log('Obligation Rate:', metrics.rates.obligationRate + '%');
console.log('Expenditure Rate:', metrics.rates.expenditureRate + '%');
console.log('Available Funds:', metrics.amounts.available);
console.log('Unliquidated Obligations:', metrics.amounts.unliquidatedObligations);
console.log('Projected End-of-Year:', metrics.projections.projectedObligations);
```

### 8. Budget Workflow State Machine

```javascript
const { createBudgetWorkflow } = require('./ppbe/budgetWorkflow');

const budgetRequest = {
  id: 'BR-2025-001',
  title: 'IT Infrastructure Upgrade',
  fiscalYear: 2025,
  amount: 5000000,
  state: 'DRAFT',
  justification: 'Modernize legacy systems'
};

const workflow = createBudgetWorkflow(budgetRequest);

// Check current state
console.log('Current State:', workflow.getCurrentState().name);
console.log('Current Phase:', workflow.getCurrentPhase());
console.log('Progress:', workflow.getProgress() + '%');

// Transition to next state
const result = workflow.transition('PLANNING_REVIEW', {
  userId: 'jsmith',
  reason: 'Completed initial draft'
});

if (result.success) {
  console.log('Transitioned to:', result.newState);
} else {
  console.error('Transition failed:', result.error);
}
```

### 9. Multi-Year Funding

```javascript
const { calculateIncrementalFundingSchedule } = require('./ppbe/multiYearFunding');

const contract = {
  totalCost: 15000000,
  performancePeriod: {
    start: '2024-01-01',
    end: '2026-12-31'
  },
  appropriationType: 'PROCUREMENT'
};

const schedule = calculateIncrementalFundingSchedule(contract);

console.log('Funding Schedule:');
schedule.schedule.forEach(fy => {
  console.log(`  FY${fy.fiscalYear}: $${fy.amount.toLocaleString()} (${fy.percentage}%)`);
});
```

### 10. Generate Congressional Reports

```javascript
const { formatBudgetJustification } = require('./ppbe/congressionalReporting');

const budgetData = {
  fiscalYear: 2025,
  appropriationType: 'OM',
  budgetActivity: 'BA-01',
  amount: 5000000,
  currentYearAmount: 4800000,
  priorYearAmount: 4600000,
  justification: {
    mission: 'Support operational readiness',
    goals: ['Increase readiness by 10%', 'Reduce downtime by 15%'],
    changeSummary: 'Increase due to inflation and expanded operations'
  }
};

const justification = formatBudgetJustification(budgetData);
console.log('Budget Justification:', JSON.stringify(justification, null, 2));
```

## Common Pitfalls to Avoid

### 1. Mixing Fiscal Years
```javascript
// ❌ WRONG: Using FY2024 funds for FY2025 need
const obligation = {
  fiscalYear: 2024,
  needDate: '2025-03-15' // Need arises in FY2025!
};
// This violates bona fide need rule

// ✓ CORRECT: Use FY2025 funds for FY2025 need
const obligation = {
  fiscalYear: 2025,
  needDate: '2025-03-15'
};
```

### 2. Wrong Appropriation Type
```javascript
// ❌ WRONG: Using O&M for major equipment
const { recommendAppropriationType } = require('./ppbe/colorsOfMoney');

const recommendation = recommendAppropriationType('equipment_acquisition', 500000);
// Returns: PROCUREMENT (equipment over $250K threshold)

// ✓ CORRECT: Use Procurement for major equipment
```

### 3. Exceeding Budget
```javascript
// ❌ WRONG: Not checking available funds
const result = checkOverobligation(
  { appropriated: 1000000, obligated: 900000, committed: 150000 },
  200000 // This exceeds available funds!
);
// ANTI-DEFICIENCY ACT VIOLATION

// ✓ CORRECT: Always validate before obligating
```

### 4. Using Expired Funds
```javascript
// ❌ WRONG: Obligating expired funds
const { isFundingExpired } = require('./ppbe/appropriationType');

const status = isFundingExpired('OM', 2022); // O&M expires in 1 year
if (status.isExpired) {
  // Cannot use these funds!
}

// ✓ CORRECT: Check expiration before use
```

## Quick Decision Tree

### Which Appropriation Type Should I Use?

```
What are you buying?
│
├─ Personnel Pay/Allowances → MILPERS
│
├─ Equipment/Supplies
│  ├─ Cost < $250K → O&M
│  └─ Cost >= $250K → PROCUREMENT
│
├─ Services
│  ├─ Recurring (janitorial, maintenance) → O&M
│  └─ One-time project/study → O&M (if < 1 year) or PROCUREMENT
│
├─ Research/Development → RDT&E
│
├─ Construction
│  ├─ Cost < $750K → O&M
│  └─ Cost >= $750K → MILCON
│
└─ Not sure? → Use recommendAppropriationType()
```

### Can I Obligate These Funds?

```
1. Is the appropriation type valid? → validateAppropriationType()
2. Are the funds expired? → isFundingExpired()
3. Is the purpose authorized? → validatePurpose()
4. Does the need arise in the right FY? → validateBonaFideNeed()
5. Do I have enough money? → checkOverobligation()
6. Is timing correct? → validateTimeRestriction()

ALL must pass!
```

## Regulatory References

| Rule | Statute | Description |
|------|---------|-------------|
| **Purpose** | 31 U.S.C. § 1301 | Use only for authorized purposes |
| **Time** | 31 U.S.C. § 1301 | Obligate within time limits |
| **Amount** | 31 U.S.C. § 1341 | Cannot exceed appropriation (ADA) |
| **Bona Fide Need** | 31 U.S.C. § 1502 | Need must arise in FY |
| **Voluntary Services** | 31 U.S.C. § 1342 | Cannot accept free services (ADA) |
| **Apportionment** | 31 U.S.C. § 1517 | Must follow OMB apportionment |
| **Multi-Year** | 10 U.S.C. § 2306b | Multi-year contract authority |

## Emergency Contacts

**Anti-Deficiency Act Violation Detected:**
1. IMMEDIATELY halt the transaction
2. Notify agency head and CFO
3. Report to OMB (if required by severity level)
4. Report to Congress (if required)
5. Document everything
6. Conduct investigation

**Severity Levels:**
- **CRITICAL**: Report immediately to OMB, Congress, GAO, Agency Head
- **HIGH**: Report within 24 hours to Agency CFO, Comptroller
- **MEDIUM**: Report to Budget Officer, monitor
- **LOW**: Document and review

## Best Practices

1. **Always validate before obligating**: Use `validateTransaction()` for every obligation
2. **Check expiration early**: Don't wait until Sep 30 to obligate
3. **Document everything**: Maintain audit trail for all decisions
4. **Use exceptions carefully**: Bona fide need exceptions require solid justification
5. **Monitor burn rate**: Track execution metrics monthly
6. **Plan ahead**: Budget formulation starts 18-24 months before execution
7. **Review congressional feedback**: Learn from past budget submissions

## Testing Your Implementation

```javascript
const ppbe = require('./ppbe');

// Get module info
console.log(ppbe.getModuleInfo());

// Test all features
const testTransaction = {
  id: 'TEST-001',
  appropriationType: 'OM',
  fiscalYear: ppbe.fiscalYear.getCurrentFiscalYear(),
  amount: 100000,
  purpose: 'maintenance',
  obligationDate: new Date().toISOString(),
  needDate: new Date().toISOString(),
  justification: 'Test obligation'
};

const testBudget = {
  appropriated: 10000000,
  obligated: 5000000,
  committed: 1000000,
  apportioned: 9000000
};

const result = ppbe.validateTransaction(testTransaction, testBudget);
console.log('Validation Result:', result.isValid ? '✓ PASS' : '✗ FAIL');
```

## Additional Resources

- **DoD FMR**: https://comptroller.defense.gov/FMR/
- **GAO Red Book**: https://www.gao.gov/legal/appropriations-law
- **31 U.S.C.**: https://uscode.house.gov/view.xhtml?path=/prelim@title31
- **10 U.S.C.**: https://uscode.house.gov/view.xhtml?path=/prelim@title10
