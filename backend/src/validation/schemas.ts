import { z } from 'zod';
import { UserRole, BudgetStatus, ApprovalStatus, FiscalYearStatus, ProgramStatus, OrganizationType, NotificationPriority, NotificationType, ObligationStatus, ExpenditureStatus, AppropriationType } from '../types';

// User Schemas
export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  email: z.string().email(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(UserRole),
  department: z.string().min(1).max(100),
  organizationId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(UserRole).optional(),
  department: z.string().min(1).max(100).optional(),
  organizationId: z.string().uuid().optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// Budget Schemas
export const createBudgetSchema = z.object({
  fiscalYearId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amount: z.number().positive(),
  department: z.string().min(1).max(100),
  organizationId: z.string().uuid().optional(),
  status: z.nativeEnum(BudgetStatus).optional(),
});

export const updateBudgetSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  amount: z.number().positive().optional(),
  department: z.string().min(1).max(100).optional(),
  organizationId: z.string().uuid().optional(),
  status: z.nativeEnum(BudgetStatus).optional(),
});

// Budget Line Item Schemas
export const createLineItemSchema = z.object({
  budgetId: z.string().uuid(),
  lineNumber: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  appropriation: z.string().min(1).max(50),
  bpac: z.string().min(1).max(50),
  category: z.string().min(1).max(100),
  subcategory: z.string().max(100).optional(),
  status: z.string().min(1).max(50).optional(),
});

export const updateLineItemSchema = z.object({
  lineNumber: z.string().min(1).max(50).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  appropriation: z.string().min(1).max(50).optional(),
  bpac: z.string().min(1).max(50).optional(),
  category: z.string().min(1).max(100).optional(),
  subcategory: z.string().max(100).optional(),
  status: z.string().min(1).max(50).optional(),
});

// Fiscal Year Schemas
export const createFiscalYearSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  name: z.string().min(1).max(100),
  status: z.nativeEnum(FiscalYearStatus),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
  totalBudget: z.number().nonnegative().optional(),
});

export const updateFiscalYearSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  status: z.nativeEnum(FiscalYearStatus).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  totalBudget: z.number().nonnegative().optional(),
});

// Program Element Schemas
export const createProgramElementSchema = z.object({
  peNumber: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  department: z.string().min(1).max(100),
  organizationId: z.string().uuid().optional(),
  fiscalYearId: z.string().uuid(),
  budget: z.number().positive(),
  status: z.nativeEnum(ProgramStatus).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
});

export const updateProgramElementSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(1000).optional(),
  department: z.string().min(1).max(100).optional(),
  organizationId: z.string().uuid().optional(),
  budget: z.number().positive().optional(),
  status: z.nativeEnum(ProgramStatus).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
});

// Organization Schemas
export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(50),
  type: z.nativeEnum(OrganizationType),
  parentId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  code: z.string().min(1).max(50).optional(),
  type: z.nativeEnum(OrganizationType).optional(),
  parentId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  active: z.boolean().optional(),
});

// Approval Workflow Schemas
export const createApprovalWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  entityType: z.enum(['budget', 'program', 'execution', 'lineitem']),
  steps: z.array(z.object({
    order: z.number().int().positive(),
    approverRole: z.nativeEnum(UserRole),
    approverId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    required: z.boolean(),
    autoApprove: z.boolean().optional(),
    thresholdAmount: z.number().positive().optional(),
  })),
});

export const createApprovalRequestSchema = z.object({
  workflowId: z.string().uuid(),
  entityType: z.enum(['budget', 'program', 'execution', 'lineitem']),
  entityId: z.string().uuid(),
  comments: z.string().max(1000).optional(),
});

export const approvalActionSchema = z.object({
  action: z.enum(['approved', 'rejected', 'returned', 'delegated']),
  comments: z.string().max(1000).optional(),
});

// Comment Schemas
export const createCommentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  parentId: z.string().uuid().optional(),
  content: z.string().min(1).max(2000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

// Notification Schemas
export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  type: z.nativeEnum(NotificationType),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  entityType: z.string().max(50).optional(),
  entityId: z.string().uuid().optional(),
  priority: z.nativeEnum(NotificationPriority).optional(),
});

// Obligation Schemas
export const createObligationSchema = z.object({
  budgetId: z.string().uuid(),
  lineItemId: z.string().uuid().optional(),
  programElementId: z.string().uuid().optional(),
  documentNumber: z.string().min(1).max(100),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  vendor: z.string().max(200).optional(),
  obligationDate: z.string().datetime().or(z.date()),
  fiscalYearId: z.string().uuid(),
});

export const updateObligationSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  vendor: z.string().max(200).optional(),
  obligationDate: z.string().datetime().or(z.date()).optional(),
  status: z.nativeEnum(ObligationStatus).optional(),
});

// Expenditure Schemas
export const createExpenditureSchema = z.object({
  obligationId: z.string().uuid().optional(),
  budgetId: z.string().uuid(),
  lineItemId: z.string().uuid().optional(),
  programElementId: z.string().uuid().optional(),
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  paymentDate: z.string().datetime().or(z.date()),
  fiscalYearId: z.string().uuid(),
});

export const updateExpenditureSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().min(1).max(500).optional(),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  paymentDate: z.string().datetime().or(z.date()).optional(),
  status: z.nativeEnum(ExpenditureStatus).optional(),
});

// Appropriation Schemas
export const createAppropriationSchema = z.object({
  fiscalYearId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  expirationDate: z.string().datetime().or(z.date()),
  type: z.nativeEnum(AppropriationType),
  restrictions: z.array(z.string()).optional(),
});

export const updateAppropriationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  expirationDate: z.string().datetime().or(z.date()).optional(),
  type: z.nativeEnum(AppropriationType).optional(),
  restrictions: z.array(z.string()).optional(),
});

// Search Schema
export const searchSchema = z.object({
  query: z.string().optional(),
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc']),
  }).optional(),
  pagination: z.object({
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(100).default(10),
  }).optional(),
});

// Document Upload Schema
export const uploadDocumentSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().uuid(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
});

// Report Generation Schema
export const generateReportSchema = z.object({
  type: z.enum(['budget_summary', 'execution_analysis', 'variance_report', 'program_status', 'approval_history', 'audit_log', 'custom']),
  format: z.enum(['pdf', 'excel', 'csv', 'json']),
  parameters: z.record(z.any()).optional(),
});

// Bulk Import Schema
export const bulkImportSchema = z.object({
  entityType: z.enum(['budgets', 'lineitems', 'programs', 'obligations', 'expenditures']),
  data: z.array(z.record(z.any())),
  validateOnly: z.boolean().optional(),
});

// Query Parameter Schemas
export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const paginationQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
