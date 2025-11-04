import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { applicationService, ApplicationStatus, ApplicationType } from '../services/applicationService';

export class ApplicationController {
  // Create a new application
  create = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.createApplication(
      {
        ...req.body,
        tenantId: req.user?.tenantId || 'default-tenant',
      },
      req.user?.id
    );
    res.status(201).json({ success: true, data: application });
  });

  // Get all applications with filters
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {
      tenantId: req.user?.tenantId || 'default-tenant',
    };

    if (req.query.organizationId) filters.organizationId = req.query.organizationId as string;
    if (req.query.applicationType) filters.applicationType = req.query.applicationType as ApplicationType;
    if (req.query.status) filters.status = req.query.status as ApplicationStatus;
    if (req.query.applicantId) filters.applicantId = req.query.applicantId as string;
    if (req.query.assignedToId) filters.assignedToId = req.query.assignedToId as string;
    if (req.query.submittedAfter) filters.submittedAfter = new Date(req.query.submittedAfter as string);
    if (req.query.submittedBefore) filters.submittedBefore = new Date(req.query.submittedBefore as string);

    const applications = await applicationService.getAllApplications(filters);
    res.json({ success: true, data: applications });
  });

  // Get application by ID
  getById = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.getApplicationById(req.params.id);
    res.json({ success: true, data: application });
  });

  // Update application
  update = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.updateApplication(
      req.params.id,
      req.body,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Submit application
  submit = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.submitApplication(req.params.id, req.user?.id);
    res.json({ success: true, data: application });
  });

  // Assign application to employee
  assign = asyncHandler(async (req: Request, res: Response) => {
    const { assignedToId } = req.body;
    const application = await applicationService.assignApplication(
      req.params.id,
      assignedToId,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Start review
  startReview = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.startReview(req.params.id, req.user?.id);
    res.json({ success: true, data: application });
  });

  // Complete review
  completeReview = asyncHandler(async (req: Request, res: Response) => {
    const { recommendApproval, notes } = req.body;
    const application = await applicationService.completeReview(
      req.params.id,
      recommendApproval,
      notes,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Approve application
  approve = asyncHandler(async (req: Request, res: Response) => {
    const { approvedAmount, notes } = req.body;
    const application = await applicationService.approveApplication(
      req.params.id,
      approvedAmount,
      notes,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Reject application
  reject = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const application = await applicationService.rejectApplication(
      req.params.id,
      reason,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Disburse funds
  disburseFunds = asyncHandler(async (req: Request, res: Response) => {
    const { amount, paymentMethod, transactionId } = req.body;
    const result = await applicationService.disburseFunds(
      req.params.id,
      amount,
      paymentMethod,
      transactionId,
      req.user?.id
    );
    res.json({ success: true, data: result });
  });

  // Close application
  close = asyncHandler(async (req: Request, res: Response) => {
    const application = await applicationService.closeApplication(req.params.id, req.user?.id);
    res.json({ success: true, data: application });
  });

  // Cancel application
  cancel = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const application = await applicationService.cancelApplication(
      req.params.id,
      reason,
      req.user?.id
    );
    res.json({ success: true, data: application });
  });

  // Get status history
  getStatusHistory = asyncHandler(async (req: Request, res: Response) => {
    const history = await applicationService.getApplicationStatusHistory(req.params.id);
    res.json({ success: true, data: history });
  });

  // Add comment
  addComment = asyncHandler(async (req: Request, res: Response) => {
    const { comment, isInternal } = req.body;
    const tenantId = req.user?.tenantId || 'default-tenant';
    const commentRecord = await applicationService.addComment(
      req.params.id,
      tenantId,
      comment,
      isInternal || false,
      req.user?.id
    );
    res.status(201).json({ success: true, data: commentRecord });
  });

  // Get comments
  getComments = asyncHandler(async (req: Request, res: Response) => {
    const includeInternal = req.query.includeInternal === 'true';
    const comments = await applicationService.getApplicationComments(req.params.id, includeInternal);
    res.json({ success: true, data: comments });
  });

  // Get disbursements
  getDisbursements = asyncHandler(async (req: Request, res: Response) => {
    const disbursements = await applicationService.getDisbursements(req.params.id);
    res.json({ success: true, data: disbursements });
  });

  // Get application summary
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {
      tenantId: req.user?.tenantId || 'default-tenant',
    };
    if (req.query.organizationId) {
      filters.organizationId = req.query.organizationId as string;
    }
    const summary = await applicationService.getApplicationSummary(filters);
    res.json({ success: true, data: summary });
  });
}

export const applicationController = new ApplicationController();
