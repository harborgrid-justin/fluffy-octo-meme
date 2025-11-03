/**
 * PPBE-008: Budget Formulation Workflow State Machine
 *
 * Implements the PPBE cycle phases per DoD Instruction 7045.14
 * The PPBE process consists of four major phases:
 *
 * 1. PLANNING: Strategic guidance, program objectives (18-24 months before execution)
 * 2. PROGRAMMING: Program Objective Memorandum (POM) development (12-18 months before)
 * 3. BUDGETING: Budget submission to Congress (6-12 months before)
 * 4. EXECUTION: Funds obligated and expended (current FY)
 *
 * Each phase has specific states, transitions, and approval requirements.
 */

const { v4: uuidv4 } = require('uuid');
const { getFiscalYear } = require('./fiscalYear');

/**
 * Budget workflow states
 */
const WORKFLOW_STATES = {
  // Planning Phase
  DRAFT: {
    phase: 'PLANNING',
    code: 'DRAFT',
    name: 'Draft',
    description: 'Initial budget request being prepared',
    allowedTransitions: ['PLANNING_REVIEW', 'CANCELLED'],
    requiredFields: ['title', 'fiscalYear', 'amount', 'justification'],
    approvalRequired: false
  },
  PLANNING_REVIEW: {
    phase: 'PLANNING',
    code: 'PLANNING_REVIEW',
    name: 'Planning Review',
    description: 'Under review by planning staff',
    allowedTransitions: ['DRAFT', 'PLANNING_APPROVED', 'REJECTED'],
    approvalRequired: true,
    approvalLevel: 'PLANNING_OFFICER'
  },
  PLANNING_APPROVED: {
    phase: 'PLANNING',
    code: 'PLANNING_APPROVED',
    name: 'Planning Approved',
    description: 'Approved for programming phase',
    allowedTransitions: ['PROGRAMMING'],
    approvalRequired: true,
    approvalLevel: 'PLANNING_DIRECTOR'
  },

  // Programming Phase
  PROGRAMMING: {
    phase: 'PROGRAMMING',
    code: 'PROGRAMMING',
    name: 'Programming',
    description: 'POM development and resource allocation',
    allowedTransitions: ['POM_REVIEW', 'PLANNING_APPROVED'],
    requiredFields: ['programElements', 'resourceSponsor', 'pomYear'],
    approvalRequired: false
  },
  POM_REVIEW: {
    phase: 'PROGRAMMING',
    code: 'POM_REVIEW',
    name: 'POM Review',
    description: 'Program Objective Memorandum under review',
    allowedTransitions: ['PROGRAMMING', 'POM_APPROVED', 'REJECTED'],
    approvalRequired: true,
    approvalLevel: 'POM_REVIEWER'
  },
  POM_APPROVED: {
    phase: 'PROGRAMMING',
    code: 'POM_APPROVED',
    name: 'POM Approved',
    description: 'POM approved, ready for budget formulation',
    allowedTransitions: ['BUDGET_FORMULATION'],
    approvalRequired: true,
    approvalLevel: 'COMPTROLLER'
  },

  // Budgeting Phase
  BUDGET_FORMULATION: {
    phase: 'BUDGETING',
    code: 'BUDGET_FORMULATION',
    name: 'Budget Formulation',
    description: 'Preparing budget submission',
    allowedTransitions: ['BUDGET_REVIEW', 'POM_APPROVED'],
    requiredFields: ['budgetJustification', 'appropriationType', 'congressionalSubmission'],
    approvalRequired: false
  },
  BUDGET_REVIEW: {
    phase: 'BUDGETING',
    code: 'BUDGET_REVIEW',
    name: 'Budget Review',
    description: 'Budget under internal review',
    allowedTransitions: ['BUDGET_FORMULATION', 'OMB_REVIEW', 'REJECTED'],
    approvalRequired: true,
    approvalLevel: 'BUDGET_OFFICER'
  },
  OMB_REVIEW: {
    phase: 'BUDGETING',
    code: 'OMB_REVIEW',
    name: 'OMB Review',
    description: 'Under review by Office of Management and Budget',
    allowedTransitions: ['BUDGET_FORMULATION', 'CONGRESSIONAL_SUBMISSION'],
    approvalRequired: true,
    approvalLevel: 'OMB'
  },
  CONGRESSIONAL_SUBMISSION: {
    phase: 'BUDGETING',
    code: 'CONGRESSIONAL_SUBMISSION',
    name: 'Congressional Submission',
    description: 'Submitted to Congress for authorization and appropriation',
    allowedTransitions: ['CONGRESSIONAL_MARKUP', 'REJECTED'],
    approvalRequired: true,
    approvalLevel: 'SECRETARY'
  },
  CONGRESSIONAL_MARKUP: {
    phase: 'BUDGETING',
    code: 'CONGRESSIONAL_MARKUP',
    name: 'Congressional Markup',
    description: 'Under congressional review and markup',
    allowedTransitions: ['APPROPRIATED', 'CONGRESSIONAL_SUBMISSION', 'REJECTED'],
    approvalRequired: false
  },
  APPROPRIATED: {
    phase: 'BUDGETING',
    code: 'APPROPRIATED',
    name: 'Appropriated',
    description: 'Funds appropriated by Congress',
    allowedTransitions: ['EXECUTION'],
    approvalRequired: false
  },

  // Execution Phase
  EXECUTION: {
    phase: 'EXECUTION',
    code: 'EXECUTION',
    name: 'Execution',
    description: 'Funds being obligated and expended',
    allowedTransitions: ['CLOSEOUT', 'SUSPENDED'],
    approvalRequired: false
  },
  SUSPENDED: {
    phase: 'EXECUTION',
    code: 'SUSPENDED',
    name: 'Suspended',
    description: 'Execution temporarily suspended',
    allowedTransitions: ['EXECUTION', 'CANCELLED'],
    approvalRequired: true,
    approvalLevel: 'PROGRAM_MANAGER'
  },
  CLOSEOUT: {
    phase: 'EXECUTION',
    code: 'CLOSEOUT',
    name: 'Closeout',
    description: 'Final accounting and closeout',
    allowedTransitions: ['CLOSED'],
    approvalRequired: true,
    approvalLevel: 'FINANCE_OFFICER'
  },
  CLOSED: {
    phase: 'EXECUTION',
    code: 'CLOSED',
    name: 'Closed',
    description: 'Budget cycle complete',
    allowedTransitions: [],
    approvalRequired: false,
    terminal: true
  },

  // Terminal States
  REJECTED: {
    phase: null,
    code: 'REJECTED',
    name: 'Rejected',
    description: 'Budget request rejected',
    allowedTransitions: [],
    approvalRequired: false,
    terminal: true
  },
  CANCELLED: {
    phase: null,
    code: 'CANCELLED',
    name: 'Cancelled',
    description: 'Budget request cancelled',
    allowedTransitions: [],
    approvalRequired: false,
    terminal: true
  }
};

/**
 * Budget workflow state machine
 */
class BudgetWorkflow {
  constructor(budgetRequest) {
    this.budgetRequest = budgetRequest;
    this.currentState = budgetRequest.state || 'DRAFT';
    this.history = budgetRequest.history || [];
  }

  /**
   * Get current state details
   */
  getCurrentState() {
    return WORKFLOW_STATES[this.currentState];
  }

  /**
   * Validate state transition
   */
  canTransition(toState) {
    const currentStateObj = WORKFLOW_STATES[this.currentState];

    if (!currentStateObj) {
      return {
        canTransition: false,
        reason: `Invalid current state: ${this.currentState}`
      };
    }

    if (!WORKFLOW_STATES[toState]) {
      return {
        canTransition: false,
        reason: `Invalid target state: ${toState}`
      };
    }

    if (!currentStateObj.allowedTransitions.includes(toState)) {
      return {
        canTransition: false,
        reason: `Transition from ${this.currentState} to ${toState} is not allowed`,
        allowedTransitions: currentStateObj.allowedTransitions
      };
    }

    return {
      canTransition: true,
      requiresApproval: WORKFLOW_STATES[toState].approvalRequired,
      approvalLevel: WORKFLOW_STATES[toState].approvalLevel
    };
  }

  /**
   * Validate required fields for state
   */
  validateRequiredFields(state) {
    const stateObj = WORKFLOW_STATES[state];
    const errors = [];

    if (!stateObj || !stateObj.requiredFields) {
      return { isValid: true, errors };
    }

    for (const field of stateObj.requiredFields) {
      if (!this.budgetRequest[field]) {
        errors.push(`Required field '${field}' is missing for state ${state}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      requiredFields: stateObj.requiredFields
    };
  }

  /**
   * Transition to new state
   */
  transition(toState, metadata = {}) {
    const validation = this.canTransition(toState);

    if (!validation.canTransition) {
      return {
        success: false,
        error: validation.reason,
        allowedTransitions: validation.allowedTransitions
      };
    }

    // Validate required fields
    const fieldValidation = this.validateRequiredFields(toState);
    if (!fieldValidation.isValid) {
      return {
        success: false,
        error: 'Missing required fields',
        errors: fieldValidation.errors
      };
    }

    // Check approval if required
    if (validation.requiresApproval && !metadata.approvedBy) {
      return {
        success: false,
        error: `Transition to ${toState} requires approval by ${validation.approvalLevel}`,
        requiresApproval: true,
        approvalLevel: validation.approvalLevel
      };
    }

    // Record transition in history
    const historyEntry = {
      id: uuidv4(),
      fromState: this.currentState,
      toState: toState,
      timestamp: new Date().toISOString(),
      transitionedBy: metadata.userId || metadata.approvedBy || 'system',
      approvedBy: metadata.approvedBy,
      reason: metadata.reason,
      metadata
    };

    this.history.push(historyEntry);
    this.currentState = toState;

    return {
      success: true,
      newState: toState,
      historyEntry
    };
  }

  /**
   * Get workflow progress percentage
   */
  getProgress() {
    const stateOrder = [
      'DRAFT', 'PLANNING_REVIEW', 'PLANNING_APPROVED',
      'PROGRAMMING', 'POM_REVIEW', 'POM_APPROVED',
      'BUDGET_FORMULATION', 'BUDGET_REVIEW', 'OMB_REVIEW',
      'CONGRESSIONAL_SUBMISSION', 'CONGRESSIONAL_MARKUP', 'APPROPRIATED',
      'EXECUTION', 'CLOSEOUT', 'CLOSED'
    ];

    const currentIndex = stateOrder.indexOf(this.currentState);

    if (currentIndex === -1) {
      return 0; // Rejected or cancelled
    }

    return ((currentIndex + 1) / stateOrder.length * 100).toFixed(2);
  }

  /**
   * Get next recommended state
   */
  getNextState() {
    const currentStateObj = WORKFLOW_STATES[this.currentState];

    if (!currentStateObj || currentStateObj.terminal) {
      return null;
    }

    // Return the first (primary) allowed transition
    return currentStateObj.allowedTransitions[0];
  }

  /**
   * Get state history
   */
  getHistory() {
    return this.history;
  }

  /**
   * Get current phase
   */
  getCurrentPhase() {
    const stateObj = WORKFLOW_STATES[this.currentState];
    return stateObj ? stateObj.phase : null;
  }
}

/**
 * Create new budget workflow
 */
function createBudgetWorkflow(budgetRequest) {
  return new BudgetWorkflow(budgetRequest);
}

/**
 * Get all workflow states
 */
function getAllWorkflowStates() {
  return { ...WORKFLOW_STATES };
}

/**
 * Get states by phase
 */
function getStatesByPhase(phase) {
  return Object.values(WORKFLOW_STATES).filter(state => state.phase === phase);
}

/**
 * Validate budget request for workflow
 */
function validateBudgetRequest(budgetRequest) {
  const errors = [];
  const warnings = [];

  // Basic validation
  if (!budgetRequest.title) {
    errors.push('Budget title is required');
  }

  if (!budgetRequest.fiscalYear) {
    errors.push('Fiscal year is required');
  }

  if (!budgetRequest.amount || budgetRequest.amount <= 0) {
    errors.push('Budget amount must be greater than zero');
  }

  // Check if FY is appropriate
  const currentFY = getFiscalYear();
  if (budgetRequest.fiscalYear < currentFY + 1) {
    warnings.push(
      `Budget is for FY${budgetRequest.fiscalYear} but current FY is ${currentFY}. ` +
      `Budget formulation typically occurs 1-2 years in advance.`
    );
  }

  // Validate state
  if (budgetRequest.state && !WORKFLOW_STATES[budgetRequest.state]) {
    errors.push(`Invalid workflow state: ${budgetRequest.state}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate workflow status report
 */
function generateWorkflowReport(budgetRequests) {
  const report = {
    total: budgetRequests.length,
    byPhase: {
      PLANNING: 0,
      PROGRAMMING: 0,
      BUDGETING: 0,
      EXECUTION: 0
    },
    byState: {},
    totalAmount: 0,
    averageProgress: 0,
    generatedAt: new Date().toISOString()
  };

  let totalProgress = 0;

  for (const request of budgetRequests) {
    const workflow = new BudgetWorkflow(request);
    const phase = workflow.getCurrentPhase();
    const state = workflow.currentState;
    const progress = parseFloat(workflow.getProgress());

    if (phase) {
      report.byPhase[phase] = (report.byPhase[phase] || 0) + 1;
    }

    report.byState[state] = (report.byState[state] || 0) + 1;
    report.totalAmount += request.amount || 0;
    totalProgress += progress;
  }

  report.averageProgress = budgetRequests.length > 0
    ? (totalProgress / budgetRequests.length).toFixed(2)
    : 0;

  return report;
}

module.exports = {
  WORKFLOW_STATES,
  BudgetWorkflow,
  createBudgetWorkflow,
  getAllWorkflowStates,
  getStatesByPhase,
  validateBudgetRequest,
  generateWorkflowReport
};
