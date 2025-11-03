// Core type definitions for PPBE system

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  organization: string;
  permissions: Permission[];
}

export enum UserRole {
  ADMIN = 'admin',
  BUDGET_ANALYST = 'budget_analyst',
  PROGRAM_MANAGER = 'program_manager',
  EXECUTIVE = 'executive',
  VIEWER = 'viewer'
}

export enum Permission {
  READ_BUDGETS = 'read_budgets',
  WRITE_BUDGETS = 'write_budgets',
  APPROVE_BUDGETS = 'approve_budgets',
  READ_PROGRAMS = 'read_programs',
  WRITE_PROGRAMS = 'write_programs',
  READ_EXECUTION = 'read_execution',
  WRITE_EXECUTION = 'write_execution',
  ADMIN = 'admin'
}

export interface Budget {
  id: string;
  name: string;
  fiscalYear: number;
  organization: string;
  status: BudgetStatus;
  totalAmount: number;
  allocatedAmount: number;
  remainingAmount: number;
  lineItems: BudgetLineItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  approvals: Approval[];
  comments: Comment[];
  attachments: Attachment[];
}

export enum BudgetStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  IN_REVIEW = 'in_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ACTIVE = 'active',
  CLOSED = 'closed'
}

export interface BudgetLineItem {
  id: string;
  budgetId: string;
  category: string;
  subcategory: string;
  description: string;
  amount: number;
  allocatedAmount: number;
  executedAmount: number;
  remainingAmount: number;
  programId?: string;
  order: number;
  metadata: Record<string, any>;
}

export interface Program {
  id: string;
  name: string;
  code: string;
  description: string;
  organization: string;
  manager: string;
  startDate: string;
  endDate: string;
  status: ProgramStatus;
  budget: number;
  spent: number;
  milestones: Milestone[];
  metrics: ProgramMetric[];
}

export enum ProgramStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  completedDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface ProgramMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface Execution {
  id: string;
  budgetId: string;
  lineItemId: string;
  amount: number;
  date: string;
  description: string;
  vendor?: string;
  invoiceNumber?: string;
  approvedBy?: string;
  status: ExecutionStatus;
}

export enum ExecutionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Approval {
  id: string;
  entityType: 'budget' | 'execution' | 'program';
  entityId: string;
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  entityType: 'budget' | 'execution' | 'program';
  entityId: string;
  author: string;
  content: string;
  timestamp: string;
  parentId?: string;
  replies?: Comment[];
}

export interface Attachment {
  id: string;
  entityType: 'budget' | 'execution' | 'program';
  entityId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

export enum NotificationType {
  BUDGET_SUBMITTED = 'budget_submitted',
  BUDGET_APPROVED = 'budget_approved',
  BUDGET_REJECTED = 'budget_rejected',
  COMMENT_ADDED = 'comment_added',
  APPROVAL_REQUIRED = 'approval_required',
  EXECUTION_WARNING = 'execution_warning',
  MILESTONE_DUE = 'milestone_due',
  SYSTEM = 'system'
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  changes: Record<string, any>;
  ipAddress?: string;
}

export interface Organization {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  children?: Organization[];
  level: number;
  type: 'department' | 'division' | 'branch' | 'unit';
}

export interface SearchFilters {
  query?: string;
  fiscalYear?: number;
  organization?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface ReportConfig {
  id: string;
  name: string;
  type: 'budget' | 'execution' | 'program' | 'custom';
  filters: SearchFilters;
  columns: ReportColumn[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ReportColumn {
  field: string;
  header: string;
  width?: number;
  format?: 'currency' | 'date' | 'percentage' | 'number';
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'view';
}
