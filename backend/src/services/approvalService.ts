// BE-009: Approval Workflow Engine
// BE-010: Multi-level Approval Routing
import { v4 as uuidv4 } from 'uuid';
import { ApprovalWorkflow, ApprovalRequest, ApprovalAction, ApprovalStatus, ApprovalActionType, ApprovalEntityType } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notificationService';

export class ApprovalService {
  // Workflow Management
  async createWorkflow(data: {
    name: string;
    description?: string;
    entityType: ApprovalEntityType;
    steps: any[];
  }, createdBy: string): Promise<ApprovalWorkflow> {
    const workflow: ApprovalWorkflow = {
      id: uuidv4(),
      ...data,
      active: true,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<ApprovalWorkflow>('approvalWorkflows', workflow);
  }

  async getWorkflows(entityType?: ApprovalEntityType): Promise<ApprovalWorkflow[]> {
    let workflows = dataStore.findAll<ApprovalWorkflow>('approvalWorkflows');

    if (entityType) {
      workflows = workflows.filter(w => w.entityType === entityType);
    }

    return workflows.filter(w => w.active);
  }

  async getWorkflowById(id: string): Promise<ApprovalWorkflow> {
    const workflow = dataStore.findById<ApprovalWorkflow>('approvalWorkflows', id);
    if (!workflow) {
      throw new AppError(404, 'Workflow not found');
    }
    return workflow;
  }

  // Approval Request Management
  async createApprovalRequest(data: {
    workflowId: string;
    entityType: ApprovalEntityType;
    entityId: string;
    comments?: string;
  }, requestedBy: string): Promise<ApprovalRequest> {
    const workflow = await this.getWorkflowById(data.workflowId);

    const request: ApprovalRequest = {
      id: uuidv4(),
      ...data,
      requestedBy,
      currentStep: 0,
      status: ApprovalStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdRequest = dataStore.create<ApprovalRequest>('approvalRequests', request);

    // Notify first approver
    await this.notifyApprover(createdRequest, workflow, 0);

    return createdRequest;
  }

  async getApprovalRequests(filters?: {
    entityType?: ApprovalEntityType;
    entityId?: string;
    status?: ApprovalStatus;
    requestedBy?: string;
  }): Promise<ApprovalRequest[]> {
    let requests = dataStore.findAll<ApprovalRequest>('approvalRequests');

    if (filters?.entityType) {
      requests = requests.filter(r => r.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      requests = requests.filter(r => r.entityId === filters.entityId);
    }
    if (filters?.status) {
      requests = requests.filter(r => r.status === filters.status);
    }
    if (filters?.requestedBy) {
      requests = requests.filter(r => r.requestedBy === filters.requestedBy);
    }

    return requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApprovalRequestById(id: string): Promise<ApprovalRequest> {
    const request = dataStore.findById<ApprovalRequest>('approvalRequests', id);
    if (!request) {
      throw new AppError(404, 'Approval request not found');
    }
    return request;
  }

  async processApproval(
    requestId: string,
    action: ApprovalActionType,
    approverId: string,
    comments?: string
  ): Promise<ApprovalRequest> {
    const request = await this.getApprovalRequestById(requestId);
    const workflow = await this.getWorkflowById(request.workflowId);

    if (request.status !== ApprovalStatus.PENDING && request.status !== ApprovalStatus.IN_REVIEW) {
      throw new AppError(400, 'This request has already been processed');
    }

    // Record the action
    const approvalAction: ApprovalAction = {
      id: uuidv4(),
      requestId,
      step: request.currentStep,
      approverId,
      action,
      comments,
      timestamp: new Date(),
    };

    dataStore.create<ApprovalAction>('approvalActions', approvalAction);

    let updatedRequest: ApprovalRequest;

    if (action === ApprovalActionType.APPROVED) {
      // Move to next step or complete
      if (request.currentStep < workflow.steps.length - 1) {
        updatedRequest = dataStore.update<ApprovalRequest>('approvalRequests', requestId, {
          currentStep: request.currentStep + 1,
          status: ApprovalStatus.IN_REVIEW,
        })!;

        // Notify next approver
        await this.notifyApprover(updatedRequest, workflow, updatedRequest.currentStep);
      } else {
        // All steps completed
        updatedRequest = dataStore.update<ApprovalRequest>('approvalRequests', requestId, {
          status: ApprovalStatus.APPROVED,
          completedAt: new Date(),
        })!;

        // Notify requester
        await notificationService.createNotification({
          userId: request.requestedBy,
          type: 'approval_approved' as any,
          title: 'Request Approved',
          message: `Your ${request.entityType} request has been approved`,
          entityType: request.entityType,
          entityId: request.entityId,
          priority: 'medium' as any,
        });
      }
    } else if (action === ApprovalActionType.REJECTED) {
      updatedRequest = dataStore.update<ApprovalRequest>('approvalRequests', requestId, {
        status: ApprovalStatus.REJECTED,
        completedAt: new Date(),
      })!;

      // Notify requester
      await notificationService.createNotification({
        userId: request.requestedBy,
        type: 'approval_rejected' as any,
        title: 'Request Rejected',
        message: `Your ${request.entityType} request has been rejected`,
        entityType: request.entityType,
        entityId: request.entityId,
        priority: 'high' as any,
      });
    } else {
      throw new AppError(400, 'Invalid approval action');
    }

    return updatedRequest;
  }

  async getApprovalHistory(entityType: string, entityId: string): Promise<{
    requests: ApprovalRequest[];
    actions: ApprovalAction[];
  }> {
    const requests = await this.getApprovalRequests({ entityType: entityType as any, entityId });
    const actions: ApprovalAction[] = [];

    for (const request of requests) {
      const requestActions = dataStore.findMany<ApprovalAction>(
        'approvalActions',
        action => action.requestId === request.id
      );
      actions.push(...requestActions);
    }

    return { requests, actions };
  }

  async getPendingApprovals(approverId: string): Promise<ApprovalRequest[]> {
    const allRequests = await this.getApprovalRequests({
      status: ApprovalStatus.PENDING,
    });

    const pendingForUser: ApprovalRequest[] = [];

    for (const request of allRequests) {
      const workflow = await this.getWorkflowById(request.workflowId);
      const currentStep = workflow.steps[request.currentStep];

      // Check if user is the approver for current step
      if (currentStep.approverId === approverId) {
        pendingForUser.push(request);
      }
    }

    return pendingForUser;
  }

  private async notifyApprover(
    request: ApprovalRequest,
    workflow: ApprovalWorkflow,
    stepIndex: number
  ): Promise<void> {
    const step = workflow.steps[stepIndex];

    if (step.approverId) {
      await notificationService.createNotification({
        userId: step.approverId,
        type: 'approval_request' as any,
        title: 'Approval Required',
        message: `You have a new ${request.entityType} approval request`,
        entityType: request.entityType,
        entityId: request.entityId,
        priority: 'high' as any,
      });
    }
  }
}

export const approvalService = new ApprovalService();
