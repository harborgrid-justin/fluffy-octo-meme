// User and Authentication Types
export interface User {
  id: string;
  username: string;
  password: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  department: string;
  organizationId?: string;
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  BUDGET_ANALYST = 'budget_analyst',
  PROGRAM_MANAGER = 'program_manager',
  FINANCE_OFFICER = 'finance_officer',
  APPROVER = 'approver',
  VIEWER = 'viewer',
  USER = 'user'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  id: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Budget Types
export interface Budget {
  id: string;
  fiscalYearId: string;
  title: string;
  description?: string;
  amount: number;
  allocatedAmount: number;
  obligatedAmount: number;
  expendedAmount: number;
  department: string;
  organizationId?: string;
  status: BudgetStatus;
  approvalStatus: ApprovalStatus;
  version: number;
  parentBudgetId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum BudgetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export interface BudgetLineItem {
  id: string;
  budgetId: string;
  lineNumber: string;
  description: string;
  amount: number;
  obligatedAmount: number;
  expendedAmount: number;
  appropriation: string;
  bpac: string; // Budget Project Account Code
  category: string;
  subcategory?: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetVersion {
  id: string;
  budgetId: string;
  version: number;
  data: any;
  changes: string;
  createdBy: string;
  createdAt: Date;
}

// Fiscal Year Types
export interface FiscalYear {
  id: string;
  year: number;
  name: string;
  status: FiscalYearStatus;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  allocatedBudget: number;
  obligatedBudget: number;
  expendedBudget: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum FiscalYearStatus {
  PLANNING = 'planning',
  CURRENT = 'current',
  CLOSED = 'closed',
  FUTURE = 'future'
}

// Program Element Types
export interface ProgramElement {
  id: string;
  peNumber: string; // Program Element Number
  name: string;
  description: string;
  department: string;
  organizationId?: string;
  fiscalYearId: string;
  budget: number;
  obligatedAmount: number;
  expendedAmount: number;
  status: ProgramStatus;
  priority: number;
  startDate: Date;
  endDate?: Date;
  milestones?: Milestone[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ProgramStatus {
  PLANNING = 'planning',
  PROGRAMMING = 'programming',
  BUDGETING = 'budgeting',
  EXECUTION = 'execution',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: Date;
  status: string;
  completedAt?: Date;
}

// Organization Types
export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  parentId?: string;
  level: number;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrganizationType {
  DEPARTMENT = 'department',
  DIVISION = 'division',
  BRANCH = 'branch',
  OFFICE = 'office',
  UNIT = 'unit'
}

// Approval Workflow Types
export interface ApprovalWorkflow {
  id: string;
  name: string;
  description?: string;
  entityType: ApprovalEntityType;
  steps: ApprovalStep[];
  active: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ApprovalEntityType {
  BUDGET = 'budget',
  PROGRAM = 'program',
  EXECUTION = 'execution',
  LINEITEM = 'lineitem'
}

export interface ApprovalStep {
  order: number;
  approverRole: UserRole;
  approverId?: string;
  organizationId?: string;
  required: boolean;
  autoApprove?: boolean;
  thresholdAmount?: number;
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  entityType: ApprovalEntityType;
  entityId: string;
  requestedBy: string;
  currentStep: number;
  status: ApprovalStatus;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export enum ApprovalStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export interface ApprovalAction {
  id: string;
  requestId: string;
  step: number;
  approverId: string;
  action: ApprovalActionType;
  comments?: string;
  timestamp: Date;
}

export enum ApprovalActionType {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  DELEGATED = 'delegated'
}

// Audit Types
export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  APPROVE = 'approve',
  REJECT = 'reject',
  EXPORT = 'export',
  IMPORT = 'import'
}

// Document Types
export interface Document {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  tags?: string[];
}

// Comment Types
export interface Comment {
  id: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  content: string;
  userId: string;
  username: string;
  createdAt: Date;
  updatedAt: Date;
  edited: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  read: boolean;
  priority: NotificationPriority;
  createdAt: Date;
  readAt?: Date;
}

export enum NotificationType {
  APPROVAL_REQUEST = 'approval_request',
  APPROVAL_APPROVED = 'approval_approved',
  APPROVAL_REJECTED = 'approval_rejected',
  COMMENT_ADDED = 'comment_added',
  BUDGET_UPDATED = 'budget_updated',
  THRESHOLD_EXCEEDED = 'threshold_exceeded',
  SYSTEM = 'system'
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Report Types
export interface Report {
  id: string;
  name: string;
  type: ReportType;
  parameters: any;
  generatedBy: string;
  generatedAt: Date;
  format: ReportFormat;
  filePath?: string;
  status: ReportStatus;
}

export enum ReportType {
  BUDGET_SUMMARY = 'budget_summary',
  EXECUTION_ANALYSIS = 'execution_analysis',
  VARIANCE_REPORT = 'variance_report',
  PROGRAM_STATUS = 'program_status',
  APPROVAL_HISTORY = 'approval_history',
  AUDIT_LOG = 'audit_log',
  CUSTOM = 'custom'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
  JSON = 'json'
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// Obligation and Expenditure Types
export interface Obligation {
  id: string;
  budgetId: string;
  lineItemId?: string;
  programElementId?: string;
  documentNumber: string;
  amount: number;
  description: string;
  vendor?: string;
  obligationDate: Date;
  fiscalYearId: string;
  status: ObligationStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ObligationStatus {
  PENDING = 'pending',
  OBLIGATED = 'obligated',
  DEOBLIGATED = 'deobligated',
  CANCELLED = 'cancelled'
}

export interface Expenditure {
  id: string;
  obligationId?: string;
  budgetId: string;
  lineItemId?: string;
  programElementId?: string;
  amount: number;
  description: string;
  vendor?: string;
  invoiceNumber?: string;
  paymentDate: Date;
  fiscalYearId: string;
  status: ExpenditureStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ExpenditureStatus {
  PENDING = 'pending',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

// Variance Analysis Types
export interface VarianceAnalysis {
  id: string;
  budgetId: string;
  fiscalYearId: string;
  period: string;
  plannedAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  status: VarianceStatus;
  analysis?: string;
  createdAt: Date;
}

export enum VarianceStatus {
  FAVORABLE = 'favorable',
  UNFAVORABLE = 'unfavorable',
  NEUTRAL = 'neutral',
  CRITICAL = 'critical'
}

// Appropriation Types
export interface Appropriation {
  id: string;
  fiscalYearId: string;
  code: string;
  name: string;
  amount: number;
  allocatedAmount: number;
  availableAmount: number;
  expirationDate: Date;
  type: AppropriationType;
  restrictions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum AppropriationType {
  ANNUAL = 'annual',
  MULTI_YEAR = 'multi_year',
  NO_YEAR = 'no_year'
}

// Search and Filter Types
export interface SearchQuery {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Request Context
export interface RequestContext {
  user: JWTPayload;
  ipAddress?: string;
  userAgent?: string;
}

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      context?: RequestContext;
    }
  }
}
