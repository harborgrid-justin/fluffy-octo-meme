import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { validate, validateParams, validateQuery } from '../middleware/validate';
import { auditLog } from '../middleware/audit';
import { UserRole, AuditAction } from '../types';

// Import validation schemas
import * as schemas from '../validation/schemas';

// Import controllers
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { applicationController } from '../controllers/applicationController';
import {
  budgetController,
  lineItemController,
  fiscalYearController,
  programElementController,
  organizationController,
  approvalController,
  auditController,
  documentController,
  reportController,
  commentController,
  notificationController,
  searchController,
  obligationController,
  expenditureController,
  varianceController,
  appropriationController,
  bulkController,
} from '../controllers/index';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================================================
// Authentication Routes (BE-002)
// ============================================================================
router.post('/auth/login', validate(schemas.loginSchema), authController.login);
router.post('/auth/register', validate(schemas.createUserSchema), authController.register);
router.post('/auth/refresh', validate(schemas.refreshTokenSchema), authController.refresh);
router.post('/auth/logout', authenticateToken, authController.logout);
router.post('/auth/logout-all', authenticateToken, authController.logoutAll);

// ============================================================================
// User Management Routes (BE-001)
// ============================================================================
router.post(
  '/users',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.createUserSchema),
  auditLog(AuditAction.CREATE, 'user'),
  userController.create
);

router.get(
  '/users',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  userController.getAll
);

router.get(
  '/users/:id',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  userController.getById
);

router.put(
  '/users/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validateParams(schemas.idParamSchema),
  validate(schemas.updateUserSchema),
  auditLog(AuditAction.UPDATE, 'user'),
  userController.update
);

router.delete(
  '/users/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.DELETE, 'user'),
  userController.delete
);

router.post('/users/change-password', authenticateToken, userController.changePassword);

// ============================================================================
// Budget Routes (BE-004, BE-015)
// ============================================================================
router.post(
  '/budgets',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validate(schemas.createBudgetSchema),
  auditLog(AuditAction.CREATE, 'budget'),
  budgetController.create
);

router.get('/budgets', authenticateToken, budgetController.getAll);

router.get(
  '/budgets/:id',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  budgetController.getById
);

router.put(
  '/budgets/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validateParams(schemas.idParamSchema),
  validate(schemas.updateBudgetSchema),
  auditLog(AuditAction.UPDATE, 'budget'),
  budgetController.update
);

router.delete(
  '/budgets/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.DELETE, 'budget'),
  budgetController.delete
);

router.get('/budgets/:id/versions', authenticateToken, budgetController.getVersionHistory);
router.post('/budgets/:id/rollback', authenticateToken, authorize(UserRole.ADMIN), budgetController.rollback);
router.get('/budgets/fiscal-year/:fiscalYearId/summary', authenticateToken, budgetController.getSummary);

// ============================================================================
// Line Item Routes (BE-005)
// ============================================================================
router.post(
  '/line-items',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validate(schemas.createLineItemSchema),
  auditLog(AuditAction.CREATE, 'lineitem'),
  lineItemController.create
);

router.get('/line-items/budget/:budgetId', authenticateToken, lineItemController.getByBudget);
router.get('/line-items/:id', authenticateToken, lineItemController.getById);

router.put(
  '/line-items/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validate(schemas.updateLineItemSchema),
  auditLog(AuditAction.UPDATE, 'lineitem'),
  lineItemController.update
);

router.delete(
  '/line-items/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'lineitem'),
  lineItemController.delete
);

router.get('/line-items/budget/:budgetId/summary', authenticateToken, lineItemController.getSummary);

// ============================================================================
// Fiscal Year Routes (BE-006)
// ============================================================================
router.post(
  '/fiscal-years',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.createFiscalYearSchema),
  auditLog(AuditAction.CREATE, 'fiscalyear'),
  fiscalYearController.create
);

router.get('/fiscal-years', authenticateToken, fiscalYearController.getAll);
router.get('/fiscal-years/current', authenticateToken, fiscalYearController.getCurrent);
router.get('/fiscal-years/:id', authenticateToken, fiscalYearController.getById);

router.put(
  '/fiscal-years/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.updateFiscalYearSchema),
  auditLog(AuditAction.UPDATE, 'fiscalyear'),
  fiscalYearController.update
);

router.delete(
  '/fiscal-years/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'fiscalyear'),
  fiscalYearController.delete
);

router.post('/fiscal-years/:id/close', authenticateToken, authorize(UserRole.ADMIN), fiscalYearController.close);
router.post('/fiscal-years/:id/set-current', authenticateToken, authorize(UserRole.ADMIN), fiscalYearController.setCurrent);

// ============================================================================
// Program Element Routes (BE-007)
// ============================================================================
router.post(
  '/programs',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.PROGRAM_MANAGER),
  validate(schemas.createProgramElementSchema),
  auditLog(AuditAction.CREATE, 'program'),
  programElementController.create
);

router.get('/programs', authenticateToken, programElementController.getAll);
router.get('/programs/:id', authenticateToken, programElementController.getById);

router.put(
  '/programs/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.PROGRAM_MANAGER),
  validate(schemas.updateProgramElementSchema),
  auditLog(AuditAction.UPDATE, 'program'),
  programElementController.update
);

router.delete(
  '/programs/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'program'),
  programElementController.delete
);

router.get('/programs/fiscal-year/:fiscalYearId/summary', authenticateToken, programElementController.getSummary);

// ============================================================================
// Organization Routes (BE-008)
// ============================================================================
router.post(
  '/organizations',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.createOrganizationSchema),
  auditLog(AuditAction.CREATE, 'organization'),
  organizationController.create
);

router.get('/organizations', authenticateToken, organizationController.getAll);
router.get('/organizations/:id', authenticateToken, organizationController.getById);

router.put(
  '/organizations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.updateOrganizationSchema),
  auditLog(AuditAction.UPDATE, 'organization'),
  organizationController.update
);

router.delete(
  '/organizations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'organization'),
  organizationController.delete
);

router.get('/organizations/:id/children', authenticateToken, organizationController.getChildren);
router.get('/organizations/hierarchy/:rootId?', authenticateToken, organizationController.getHierarchy);

// ============================================================================
// Approval Workflow Routes (BE-009, BE-010)
// ============================================================================
router.post(
  '/approvals/workflows',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.createApprovalWorkflowSchema),
  approvalController.createWorkflow
);

router.get('/approvals/workflows', authenticateToken, approvalController.getWorkflows);

router.post(
  '/approvals/requests',
  authenticateToken,
  validate(schemas.createApprovalRequestSchema),
  auditLog(AuditAction.CREATE, 'approval_request'),
  approvalController.createRequest
);

router.get('/approvals/requests', authenticateToken, approvalController.getRequests);
router.get('/approvals/pending', authenticateToken, approvalController.getPending);

router.post(
  '/approvals/requests/:id/process',
  authenticateToken,
  authorize(UserRole.APPROVER, UserRole.ADMIN),
  validate(schemas.approvalActionSchema),
  auditLog(AuditAction.APPROVE, 'approval_request'),
  approvalController.processApproval
);

router.get('/approvals/history/:entityType/:entityId', authenticateToken, approvalController.getHistory);

// ============================================================================
// Audit Log Routes (BE-011)
// ============================================================================
router.get(
  '/audit/logs',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  auditController.getLogs
);

router.get(
  '/audit/trail/:entityType/:entityId',
  authenticateToken,
  auditController.getEntityTrail
);

router.get(
  '/audit/user/:userId',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditController.getUserActivity
);

// ============================================================================
// Document Routes (BE-012)
// ============================================================================
router.post(
  '/documents',
  authenticateToken,
  validate(schemas.uploadDocumentSchema),
  auditLog(AuditAction.CREATE, 'document'),
  documentController.upload
);

router.get('/documents/:entityType/:entityId', authenticateToken, documentController.getByEntity);
router.get('/documents/:id', authenticateToken, documentController.getById);

router.delete(
  '/documents/:id',
  authenticateToken,
  auditLog(AuditAction.DELETE, 'document'),
  documentController.delete
);

router.get('/documents/search', authenticateToken, documentController.search);

// ============================================================================
// Report Routes (BE-013, BE-014)
// ============================================================================
router.post(
  '/reports/generate',
  authenticateToken,
  validate(schemas.generateReportSchema),
  auditLog(AuditAction.CREATE, 'report'),
  reportController.generate
);

router.get('/reports', authenticateToken, reportController.getAll);
router.get('/reports/:id', authenticateToken, reportController.getById);

router.delete(
  '/reports/:id',
  authenticateToken,
  auditLog(AuditAction.DELETE, 'report'),
  reportController.delete
);

router.post('/reports/export', authenticateToken, auditLog(AuditAction.EXPORT, 'report'), reportController.export);

// ============================================================================
// Comment Routes (BE-016)
// ============================================================================
router.post(
  '/comments',
  authenticateToken,
  validate(schemas.createCommentSchema),
  auditLog(AuditAction.CREATE, 'comment'),
  commentController.create
);

router.get('/comments/:entityType/:entityId', authenticateToken, commentController.getByEntity);

router.put(
  '/comments/:id',
  authenticateToken,
  validate(schemas.updateCommentSchema),
  auditLog(AuditAction.UPDATE, 'comment'),
  commentController.update
);

router.delete(
  '/comments/:id',
  authenticateToken,
  auditLog(AuditAction.DELETE, 'comment'),
  commentController.delete
);

// ============================================================================
// Notification Routes (BE-017)
// ============================================================================
router.post(
  '/notifications',
  authenticateToken,
  authorize(UserRole.ADMIN),
  validate(schemas.createNotificationSchema),
  notificationController.create
);

router.get('/notifications', authenticateToken, notificationController.getUserNotifications);
router.get('/notifications/unread-count', authenticateToken, notificationController.getUnreadCount);
router.post('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// ============================================================================
// Search Routes (BE-018)
// ============================================================================
router.post('/search/:collection', authenticateToken, searchController.search);
router.post('/search/advanced', authenticateToken, searchController.advancedSearch);

// ============================================================================
// Obligation Routes (BE-019)
// ============================================================================
router.post(
  '/obligations',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.createObligationSchema),
  auditLog(AuditAction.CREATE, 'obligation'),
  obligationController.create
);

router.get('/obligations', authenticateToken, obligationController.getAll);
router.get('/obligations/:id', authenticateToken, obligationController.getById);

router.put(
  '/obligations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.updateObligationSchema),
  auditLog(AuditAction.UPDATE, 'obligation'),
  obligationController.update
);

router.delete(
  '/obligations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'obligation'),
  obligationController.delete
);

router.get('/obligations/fiscal-year/:fiscalYearId/summary', authenticateToken, obligationController.getSummary);

// ============================================================================
// Expenditure Routes (BE-020)
// ============================================================================
router.post(
  '/expenditures',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.createExpenditureSchema),
  auditLog(AuditAction.CREATE, 'expenditure'),
  expenditureController.create
);

router.get('/expenditures', authenticateToken, expenditureController.getAll);
router.get('/expenditures/:id', authenticateToken, expenditureController.getById);

router.put(
  '/expenditures/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.updateExpenditureSchema),
  auditLog(AuditAction.UPDATE, 'expenditure'),
  expenditureController.update
);

router.delete(
  '/expenditures/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'expenditure'),
  expenditureController.delete
);

router.get('/expenditures/fiscal-year/:fiscalYearId/summary', authenticateToken, expenditureController.getSummary);

// ============================================================================
// Variance Routes (BE-021)
// ============================================================================
router.post('/variance/calculate', authenticateToken, varianceController.calculate);
router.get('/variance/budget/:budgetId', authenticateToken, varianceController.getByBudget);
router.get('/variance/fiscal-year/:fiscalYearId', authenticateToken, varianceController.getByFiscalYear);
router.get('/variance/fiscal-year/:fiscalYearId/summary', authenticateToken, varianceController.getSummary);

// ============================================================================
// Appropriation Routes (BE-022, BE-023)
// ============================================================================
router.post(
  '/appropriations',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.createAppropriationSchema),
  auditLog(AuditAction.CREATE, 'appropriation'),
  appropriationController.create
);

router.get('/appropriations', authenticateToken, appropriationController.getAll);
router.get('/appropriations/:id', authenticateToken, appropriationController.getById);

router.put(
  '/appropriations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.FINANCE_OFFICER),
  validate(schemas.updateAppropriationSchema),
  auditLog(AuditAction.UPDATE, 'appropriation'),
  appropriationController.update
);

router.delete(
  '/appropriations/:id',
  authenticateToken,
  authorize(UserRole.ADMIN),
  auditLog(AuditAction.DELETE, 'appropriation'),
  appropriationController.delete
);

router.post('/appropriations/check-availability', authenticateToken, appropriationController.checkAvailability);
router.post('/appropriations/validate', authenticateToken, appropriationController.validate);

// ============================================================================
// Bulk Import/Export Routes (BE-024, BE-025)
// ============================================================================
router.post(
  '/bulk/import',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validate(schemas.bulkImportSchema),
  auditLog(AuditAction.IMPORT, 'bulk'),
  bulkController.import
);

router.get(
  '/bulk/export/:entityType',
  authenticateToken,
  auditLog(AuditAction.EXPORT, 'bulk'),
  bulkController.export
);

router.post('/bulk/validate', authenticateToken, bulkController.validate);

// ============================================================================
// Application Tracking Routes
// ============================================================================
router.post(
  '/applications',
  authenticateToken,
  auditLog(AuditAction.CREATE, 'application'),
  applicationController.create
);

router.get(
  '/applications',
  authenticateToken,
  applicationController.getAll
);

router.get(
  '/applications/summary',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST, UserRole.AUDITOR),
  applicationController.getSummary
);

router.get(
  '/applications/:id',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  applicationController.getById
);

router.put(
  '/applications/:id',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.update
);

router.post(
  '/applications/:id/submit',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.submit
);

router.post(
  '/applications/:id/assign',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.PROGRAM_MANAGER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.assign
);

router.post(
  '/applications/:id/start-review',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST, UserRole.PROGRAM_MANAGER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.startReview
);

router.post(
  '/applications/:id/complete-review',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST, UserRole.PROGRAM_MANAGER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.completeReview
);

router.post(
  '/applications/:id/approve',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.APPROVER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.APPROVE, 'application'),
  applicationController.approve
);

router.post(
  '/applications/:id/reject',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.APPROVER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.REJECT, 'application'),
  applicationController.reject
);

router.post(
  '/applications/:id/disburse-funds',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.BUDGET_ANALYST),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.CREATE, 'disbursement'),
  applicationController.disburseFunds
);

router.post(
  '/applications/:id/close',
  authenticateToken,
  authorize(UserRole.ADMIN, UserRole.PROGRAM_MANAGER),
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.close
);

router.post(
  '/applications/:id/cancel',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.UPDATE, 'application'),
  applicationController.cancel
);

router.get(
  '/applications/:id/status-history',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  applicationController.getStatusHistory
);

router.post(
  '/applications/:id/comments',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  auditLog(AuditAction.CREATE, 'comment'),
  applicationController.addComment
);

router.get(
  '/applications/:id/comments',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  applicationController.getComments
);

router.get(
  '/applications/:id/disbursements',
  authenticateToken,
  validateParams(schemas.idParamSchema),
  applicationController.getDisbursements
);

export default router;
