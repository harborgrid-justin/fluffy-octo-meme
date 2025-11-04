// In-memory data store (would be replaced with database in production)
import {
  User, Budget, BudgetLineItem, BudgetVersion, FiscalYear, ProgramElement,
  Organization, ApprovalWorkflow, ApprovalRequest, ApprovalAction, AuditLog,
  Document, Comment, Notification, Report, Obligation, Expenditure,
  VarianceAnalysis, Appropriation, RefreshToken
} from '../types';

export class DataStore {
  private users: User[] = [];
  private budgets: Budget[] = [];
  private budgetLineItems: BudgetLineItem[] = [];
  private budgetVersions: BudgetVersion[] = [];
  private fiscalYears: FiscalYear[] = [];
  private programElements: ProgramElement[] = [];
  private organizations: Organization[] = [];
  private approvalWorkflows: ApprovalWorkflow[] = [];
  private approvalRequests: ApprovalRequest[] = [];
  private approvalActions: ApprovalAction[] = [];
  private auditLogs: AuditLog[] = [];
  private documents: Document[] = [];
  private comments: Comment[] = [];
  private notifications: Notification[] = [];
  private reports: Report[] = [];
  private obligations: Obligation[] = [];
  private expenditures: Expenditure[] = [];
  private varianceAnalyses: VarianceAnalysis[] = [];
  private appropriations: Appropriation[] = [];
  private refreshTokens: RefreshToken[] = [];
  
  // Application tracking collections
  private applications: any[] = [];
  private applicationStatusHistory: any[] = [];
  private applicationComments: any[] = [];
  private fundDisbursements: any[] = [];

  // Generic CRUD operations
  create<T extends { id: string }>(collection: string, item: T): T {
    (this as any)[collection].push(item);
    return item;
  }

  findAll<T>(collection: string): T[] {
    return [...(this as any)[collection]];
  }

  findById<T extends { id: string }>(collection: string, id: string): T | undefined {
    return (this as any)[collection].find((item: T) => item.id === id);
  }

  findOne<T>(collection: string, predicate: (item: T) => boolean): T | undefined {
    return (this as any)[collection].find(predicate);
  }

  findMany<T>(collection: string, predicate: (item: T) => boolean): T[] {
    return (this as any)[collection].filter(predicate);
  }

  update<T extends { id: string }>(collection: string, id: string, updates: Partial<T>): T | undefined {
    const index = (this as any)[collection].findIndex((item: T) => item.id === id);
    if (index === -1) return undefined;

    (this as any)[collection][index] = {
      ...(this as any)[collection][index],
      ...updates,
      updatedAt: new Date(),
    };

    return (this as any)[collection][index];
  }

  delete<T extends { id: string }>(collection: string, id: string): boolean {
    const index = (this as any)[collection].findIndex((item: T) => item.id === id);
    if (index === -1) return false;

    (this as any)[collection].splice(index, 1);
    return true;
  }

  // Specialized methods for users
  getUserByUsername(username: string): User | undefined {
    return this.users.find(u => u.username === username);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  // Specialized methods for refresh tokens
  getRefreshToken(token: string): RefreshToken | undefined {
    return this.refreshTokens.find(t => t.token === token);
  }

  deleteRefreshToken(token: string): boolean {
    const index = this.refreshTokens.findIndex(t => t.token === token);
    if (index === -1) return false;
    this.refreshTokens.splice(index, 1);
    return true;
  }

  deleteUserRefreshTokens(userId: string): void {
    this.refreshTokens = this.refreshTokens.filter(t => t.userId !== userId);
  }

  // Clear all data (for testing)
  clear(): void {
    this.users = [];
    this.budgets = [];
    this.budgetLineItems = [];
    this.budgetVersions = [];
    this.fiscalYears = [];
    this.programElements = [];
    this.organizations = [];
    this.approvalWorkflows = [];
    this.approvalRequests = [];
    this.approvalActions = [];
    this.auditLogs = [];
    this.documents = [];
    this.comments = [];
    this.notifications = [];
    this.reports = [];
    this.obligations = [];
    this.expenditures = [];
    this.varianceAnalyses = [];
    this.appropriations = [];
    this.refreshTokens = [];
    this.applications = [];
    this.applicationStatusHistory = [];
    this.applicationComments = [];
    this.fundDisbursements = [];
  }
}

export const dataStore = new DataStore();
