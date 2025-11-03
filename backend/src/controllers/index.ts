import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

// Import all services
import { budgetService } from '../services/budgetService';
import { lineItemService } from '../services/lineItemService';
import { fiscalYearService } from '../services/fiscalYearService';
import { programElementService } from '../services/programElementService';
import { organizationService } from '../services/organizationService';
import { approvalService } from '../services/approvalService';
import { auditService } from '../services/auditService';
import { documentService } from '../services/documentService';
import { reportService } from '../services/reportService';
import { commentService } from '../services/commentService';
import { notificationService } from '../services/notificationService';
import { searchService } from '../services/searchService';
import { obligationService } from '../services/obligationService';
import { expenditureService } from '../services/expenditureService';
import { varianceService } from '../services/varianceService';
import { appropriationService } from '../services/appropriationService';
import { bulkImportService } from '../services/bulkImportService';

// Budget Controller
export class BudgetController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.createBudget(req.body, req.user!.id);
    res.status(201).json({ success: true, data: budget });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const budgets = await budgetService.getAllBudgets(req.query as any);
    res.json({ success: true, data: budgets });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.getBudgetById(req.params.id);
    res.json({ success: true, data: budget });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const budget = await budgetService.updateBudget(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: budget });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await budgetService.deleteBudget(req.params.id);
    res.json({ success: true, message: 'Budget deleted successfully' });
  });

  getVersionHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await budgetService.getBudgetVersionHistory(req.params.id);
    res.json({ success: true, data: history });
  });

  rollback = asyncHandler(async (req: Request, res: Response) => {
    const { version } = req.body;
    const budget = await budgetService.rollbackToVersion(req.params.id, version, req.user!.id);
    res.json({ success: true, data: budget });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await budgetService.getBudgetSummary(req.params.fiscalYearId);
    res.json({ success: true, data: summary });
  });
}

// Line Item Controller
export class LineItemController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const lineItem = await lineItemService.createLineItem(req.body, req.user!.id);
    res.status(201).json({ success: true, data: lineItem });
  });

  getByBudget = asyncHandler(async (req: Request, res: Response) => {
    const lineItems = await lineItemService.getLineItemsByBudget(req.params.budgetId);
    res.json({ success: true, data: lineItems });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const lineItem = await lineItemService.getLineItemById(req.params.id);
    res.json({ success: true, data: lineItem });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const lineItem = await lineItemService.updateLineItem(req.params.id, req.body);
    res.json({ success: true, data: lineItem });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await lineItemService.deleteLineItem(req.params.id);
    res.json({ success: true, message: 'Line item deleted successfully' });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await lineItemService.getLineItemSummary(req.params.budgetId);
    res.json({ success: true, data: summary });
  });
}

// Fiscal Year Controller
export class FiscalYearController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.createFiscalYear(req.body);
    res.status(201).json({ success: true, data: fiscalYear });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYears = await fiscalYearService.getAllFiscalYears();
    res.json({ success: true, data: fiscalYears });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.getFiscalYearById(req.params.id);
    res.json({ success: true, data: fiscalYear });
  });

  getCurrent = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.getCurrentFiscalYear();
    res.json({ success: true, data: fiscalYear });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.updateFiscalYear(req.params.id, req.body);
    res.json({ success: true, data: fiscalYear });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await fiscalYearService.deleteFiscalYear(req.params.id);
    res.json({ success: true, message: 'Fiscal year deleted successfully' });
  });

  close = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.closeFiscalYear(req.params.id);
    res.json({ success: true, data: fiscalYear });
  });

  setCurrent = asyncHandler(async (req: Request, res: Response) => {
    const fiscalYear = await fiscalYearService.setCurrentFiscalYear(req.params.id);
    res.json({ success: true, data: fiscalYear });
  });
}

// Program Element Controller
export class ProgramElementController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const program = await programElementService.createProgramElement(req.body, req.user!.id);
    res.status(201).json({ success: true, data: program });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const programs = await programElementService.getAllProgramElements(req.query as any);
    res.json({ success: true, data: programs });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const program = await programElementService.getProgramElementById(req.params.id);
    res.json({ success: true, data: program });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const program = await programElementService.updateProgramElement(req.params.id, req.body);
    res.json({ success: true, data: program });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await programElementService.deleteProgramElement(req.params.id);
    res.json({ success: true, message: 'Program element deleted successfully' });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await programElementService.getProgramSummary(req.params.fiscalYearId);
    res.json({ success: true, data: summary });
  });
}

// Organization Controller
export class OrganizationController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationService.createOrganization(req.body);
    res.status(201).json({ success: true, data: org });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const orgs = await organizationService.getAllOrganizations(req.query as any);
    res.json({ success: true, data: orgs });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationService.getOrganizationById(req.params.id);
    res.json({ success: true, data: org });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const org = await organizationService.updateOrganization(req.params.id, req.body);
    res.json({ success: true, data: org });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await organizationService.deleteOrganization(req.params.id);
    res.json({ success: true, message: 'Organization deleted successfully' });
  });

  getHierarchy = asyncHandler(async (req: Request, res: Response) => {
    const hierarchy = await organizationService.getHierarchy(req.params.rootId);
    res.json({ success: true, data: hierarchy });
  });

  getChildren = asyncHandler(async (req: Request, res: Response) => {
    const children = await organizationService.getChildren(req.params.id);
    res.json({ success: true, data: children });
  });
}

// Approval Controller
export class ApprovalController {
  createWorkflow = asyncHandler(async (req: Request, res: Response) => {
    const workflow = await approvalService.createWorkflow(req.body, req.user!.id);
    res.status(201).json({ success: true, data: workflow });
  });

  getWorkflows = asyncHandler(async (req: Request, res: Response) => {
    const workflows = await approvalService.getWorkflows(req.query.entityType as any);
    res.json({ success: true, data: workflows });
  });

  createRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await approvalService.createApprovalRequest(req.body, req.user!.id);
    res.status(201).json({ success: true, data: request });
  });

  getRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await approvalService.getApprovalRequests(req.query as any);
    res.json({ success: true, data: requests });
  });

  processApproval = asyncHandler(async (req: Request, res: Response) => {
    const { action, comments } = req.body;
    const request = await approvalService.processApproval(req.params.id, action, req.user!.id, comments);
    res.json({ success: true, data: request });
  });

  getPending = asyncHandler(async (req: Request, res: Response) => {
    const requests = await approvalService.getPendingApprovals(req.user!.id);
    res.json({ success: true, data: requests });
  });

  getHistory = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const history = await approvalService.getApprovalHistory(entityType, entityId);
    res.json({ success: true, data: history });
  });
}

// Audit Controller
export class AuditController {
  getLogs = asyncHandler(async (req: Request, res: Response) => {
    const logs = await auditService.getAuditLogs(req.query as any);
    res.json({ success: true, data: logs });
  });

  getEntityTrail = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const trail = await auditService.getEntityAuditTrail(entityType, entityId);
    res.json({ success: true, data: trail });
  });

  getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const activity = await auditService.getUserActivity(req.params.userId);
    res.json({ success: true, data: activity });
  });
}

// Document Controller
export class DocumentController {
  upload = asyncHandler(async (req: Request, res: Response) => {
    const document = await documentService.uploadDocument(req.body, req.user!.id);
    res.status(201).json({ success: true, data: document });
  });

  getByEntity = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const documents = await documentService.getDocuments(entityType, entityId);
    res.json({ success: true, data: documents });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const document = await documentService.getDocumentById(req.params.id);
    res.json({ success: true, data: document });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await documentService.deleteDocument(req.params.id);
    res.json({ success: true, message: 'Document deleted successfully' });
  });

  search = asyncHandler(async (req: Request, res: Response) => {
    const documents = await documentService.searchDocuments(req.query as any);
    res.json({ success: true, data: documents });
  });
}

// Report Controller
export class ReportController {
  generate = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.generateReport(req.body, req.user!.id);
    res.status(201).json({ success: true, data: report });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const reports = await reportService.getReports(req.query as any);
    res.json({ success: true, data: reports });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const report = await reportService.getReportById(req.params.id);
    res.json({ success: true, data: report });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await reportService.deleteReport(req.params.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  });

  export = asyncHandler(async (req: Request, res: Response) => {
    const { format, data } = req.body;
    let result: string;

    if (format === 'csv') {
      result = await reportService.exportToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
    } else {
      result = await reportService.exportToJSON(data);
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(result);
  });
}

// Comment Controller
export class CommentController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.createComment(req.body, req.user!.id, req.user!.username);
    res.status(201).json({ success: true, data: comment });
  });

  getByEntity = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, entityId } = req.params;
    const comments = await commentService.getComments(entityType, entityId);
    res.json({ success: true, data: comments });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.updateComment(req.params.id, req.body.content, req.user!.id);
    res.json({ success: true, data: comment });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await commentService.deleteComment(req.params.id, req.user!.id);
    res.json({ success: true, message: 'Comment deleted successfully' });
  });
}

// Notification Controller
export class NotificationController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.createNotification(req.body);
    res.status(201).json({ success: true, data: notification });
  });

  getUserNotifications = asyncHandler(async (req: Request, res: Response) => {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.getUserNotifications(req.user!.id, unreadOnly);
    res.json({ success: true, data: notifications });
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.markAsRead(req.params.id);
    res.json({ success: true, data: notification });
  });

  markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  });
}

// Search Controller
export class SearchController {
  search = asyncHandler(async (req: Request, res: Response) => {
    const { collection } = req.params;
    const result = searchService.search(collection, req.body);
    res.json({ success: true, data: result });
  });

  advancedSearch = asyncHandler(async (req: Request, res: Response) => {
    const { collections, query } = req.body;
    const results = await searchService.advancedSearch(collections, query);
    res.json({ success: true, data: results });
  });
}

// Obligation Controller
export class ObligationController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const obligation = await obligationService.createObligation(req.body, req.user!.id);
    res.status(201).json({ success: true, data: obligation });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const obligations = await obligationService.getAllObligations(req.query as any);
    res.json({ success: true, data: obligations });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const obligation = await obligationService.getObligationById(req.params.id);
    res.json({ success: true, data: obligation });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const obligation = await obligationService.updateObligation(req.params.id, req.body);
    res.json({ success: true, data: obligation });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await obligationService.deleteObligation(req.params.id);
    res.json({ success: true, message: 'Obligation deleted successfully' });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await obligationService.getObligationSummary(req.params.fiscalYearId);
    res.json({ success: true, data: summary });
  });
}

// Expenditure Controller
export class ExpenditureController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const expenditure = await expenditureService.createExpenditure(req.body, req.user!.id);
    res.status(201).json({ success: true, data: expenditure });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const expenditures = await expenditureService.getAllExpenditures(req.query as any);
    res.json({ success: true, data: expenditures });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const expenditure = await expenditureService.getExpenditureById(req.params.id);
    res.json({ success: true, data: expenditure });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const expenditure = await expenditureService.updateExpenditure(req.params.id, req.body);
    res.json({ success: true, data: expenditure });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await expenditureService.deleteExpenditure(req.params.id);
    res.json({ success: true, message: 'Expenditure deleted successfully' });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await expenditureService.getExpenditureSummary(req.params.fiscalYearId);
    res.json({ success: true, data: summary });
  });
}

// Variance Controller
export class VarianceController {
  calculate = asyncHandler(async (req: Request, res: Response) => {
    const { budgetId, period } = req.body;
    const variance = await varianceService.calculateVariance(budgetId, period);
    res.status(201).json({ success: true, data: variance });
  });

  getByBudget = asyncHandler(async (req: Request, res: Response) => {
    const variances = await varianceService.getVarianceAnalysis(req.params.budgetId);
    res.json({ success: true, data: variances });
  });

  getByFiscalYear = asyncHandler(async (req: Request, res: Response) => {
    const variances = await varianceService.getFiscalYearVariances(req.params.fiscalYearId);
    res.json({ success: true, data: variances });
  });

  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const summary = await varianceService.getVarianceSummary(req.params.fiscalYearId);
    res.json({ success: true, data: summary });
  });
}

// Appropriation Controller
export class AppropriationController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const appropriation = await appropriationService.createAppropriation(req.body);
    res.status(201).json({ success: true, data: appropriation });
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const appropriations = await appropriationService.getAllAppropriations(req.query.fiscalYearId as string);
    res.json({ success: true, data: appropriations });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const appropriation = await appropriationService.getAppropriationById(req.params.id);
    res.json({ success: true, data: appropriation });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const appropriation = await appropriationService.updateAppropriation(req.params.id, req.body);
    res.json({ success: true, data: appropriation });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    await appropriationService.deleteAppropriation(req.params.id);
    res.json({ success: true, message: 'Appropriation deleted successfully' });
  });

  checkAvailability = asyncHandler(async (req: Request, res: Response) => {
    const { code, fiscalYearId, amount } = req.body;
    const result = await appropriationService.checkFundAvailability(code, fiscalYearId, amount);
    res.json({ success: true, data: result });
  });

  validate = asyncHandler(async (req: Request, res: Response) => {
    const { code, fiscalYearId } = req.body;
    const result = await appropriationService.validateAppropriation(code, fiscalYearId);
    res.json({ success: true, data: result });
  });
}

// Bulk Import/Export Controller
export class BulkController {
  import = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, data, validateOnly } = req.body;
    const result = await bulkImportService.importData(entityType, data, req.user!.id, validateOnly);
    res.json({ success: true, data: result });
  });

  export = asyncHandler(async (req: Request, res: Response) => {
    const { entityType } = req.params;
    const data = await bulkImportService.exportData(entityType as any, req.query);
    res.json({ success: true, data });
  });

  validate = asyncHandler(async (req: Request, res: Response) => {
    const { entityType, data } = req.body;
    const result = await bulkImportService.validateBulkData(entityType, data);
    res.json({ success: true, data: result });
  });
}

// Export controller instances
export const budgetController = new BudgetController();
export const lineItemController = new LineItemController();
export const fiscalYearController = new FiscalYearController();
export const programElementController = new ProgramElementController();
export const organizationController = new OrganizationController();
export const approvalController = new ApprovalController();
export const auditController = new AuditController();
export const documentController = new DocumentController();
export const reportController = new ReportController();
export const commentController = new CommentController();
export const notificationController = new NotificationController();
export const searchController = new SearchController();
export const obligationController = new ObligationController();
export const expenditureController = new ExpenditureController();
export const varianceController = new VarianceController();
export const appropriationController = new AppropriationController();
export const bulkController = new BulkController();
