// Application Tracking Service
// Manages citizen benefit applications lifecycle
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorHandler';
import { dataStore } from './dataStore';

// Enums
export enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FUNDED = 'funded',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

export enum ApplicationType {
  HOMEOWNERS_ASSISTANCE_PROGRAM = 'homeowners_assistance_program',
  DISASTER_ASSISTANCE = 'disaster_assistance',
  VETERANS_BENEFITS = 'veterans_benefits',
  HOUSING_ASSISTANCE = 'housing_assistance',
  FINANCIAL_AID = 'financial_aid',
  OTHER = 'other',
}

export enum LossCalculationType {
  MARKET_VALUE_DECLINE = 'market_value_decline',
  FORCED_SALE = 'forced_sale',
  RELOCATION_COSTS = 'relocation_costs',
  OTHER = 'other',
}

// Interfaces
export interface Application {
  id: string;
  tenantId: string;
  organizationId?: string;
  
  // Identification
  applicationNumber: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  
  // Applicant information
  applicantId?: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantEmail: string;
  applicantPhone?: string;
  applicantAddress?: string;
  
  // Military/Employment information
  militaryBranch?: string;
  militaryRank?: string;
  serviceNumber?: string;
  baseClosureDate?: Date;
  affectedBase?: string;
  
  // Property information
  propertyAddress?: string;
  propertyPurchaseDate?: Date;
  propertyPurchasePrice?: number;
  currentMortgageBalance?: number;
  propertyAppraisedValue?: number;
  propertySalePrice?: number;
  propertySaleDate?: Date;
  
  // Loss calculation
  lossCalculationType?: LossCalculationType;
  calculatedLoss?: number;
  approvedAmount?: number;
  fundedAmount?: number;
  
  // Application content
  description?: string;
  justification?: string;
  additionalInfo?: any;
  
  // Assignment and processing
  assignedToId?: string;
  assignedAt?: Date;
  reviewStartedAt?: Date;
  reviewCompletedAt?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  rejectionReason?: string;
  fundedAt?: Date;
  fundedBy?: string;
  
  // Submission tracking
  submittedAt?: Date;
  lastStatusChangeAt?: Date;
  
  // Metadata
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  tenantId: string;
  fromStatus?: ApplicationStatus;
  toStatus: ApplicationStatus;
  reason?: string;
  notes?: string;
  changedAt: Date;
  changedBy?: string;
}

export interface ApplicationComment {
  id: string;
  applicationId: string;
  tenantId: string;
  comment: string;
  isInternal: boolean;
  createdAt: Date;
  createdBy?: string;
}

export interface FundDisbursement {
  id: string;
  applicationId: string;
  tenantId: string;
  disbursementNumber: string;
  amount: number;
  disbursementDate: Date;
  paymentMethod: string;
  transactionId?: string;
  status: string;
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export class ApplicationService {
  private generateApplicationNumber(): string {
    const prefix = 'APP';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  // Calculate loss for Homeowners Assistance Program
  private calculateLoss(application: Partial<Application>): number {
    if (!application.lossCalculationType) {
      return 0;
    }

    switch (application.lossCalculationType) {
      case LossCalculationType.MARKET_VALUE_DECLINE: {
        // Loss = Mortgage Balance - Sale Price
        const mortgage = application.currentMortgageBalance || 0;
        const salePrice = application.propertySalePrice || 0;
        return Math.max(0, mortgage - salePrice);
      }
      case LossCalculationType.FORCED_SALE: {
        // Loss = Appraised Value - Sale Price
        const appraisedValue = application.propertyAppraisedValue || 0;
        const salePrice = application.propertySalePrice || 0;
        return Math.max(0, appraisedValue - salePrice);
      }
      case LossCalculationType.RELOCATION_COSTS: {
        // Relocation costs are typically predefined or estimated
        return application.calculatedLoss || 0;
      }
      default:
        return application.calculatedLoss || 0;
    }
  }

  async createApplication(
    data: Omit<Application, 'id' | 'applicationNumber' | 'createdAt' | 'updatedAt'>,
    createdBy?: string
  ): Promise<Application> {
    const application: Application = {
      id: uuidv4(),
      applicationNumber: this.generateApplicationNumber(),
      ...data,
      status: data.status || ApplicationStatus.DRAFT,
      calculatedLoss: this.calculateLoss(data),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
    };

    const createdApplication = dataStore.create<Application>('applications', application);

    // Create initial status history
    await this.addStatusHistory(
      application.id,
      application.tenantId,
      undefined,
      application.status,
      'Application created',
      undefined,
      createdBy
    );

    return createdApplication;
  }

  async getApplicationById(id: string): Promise<Application> {
    const application = dataStore.findById<Application>('applications', id);
    if (!application) {
      throw new AppError(404, 'Application not found');
    }
    return application;
  }

  async getAllApplications(filters?: {
    tenantId?: string;
    organizationId?: string;
    applicationType?: ApplicationType;
    status?: ApplicationStatus;
    applicantId?: string;
    assignedToId?: string;
    submittedAfter?: Date;
    submittedBefore?: Date;
  }): Promise<Application[]> {
    let applications = dataStore.findAll<Application>('applications');

    if (filters?.tenantId) {
      applications = applications.filter(a => a.tenantId === filters.tenantId);
    }
    if (filters?.organizationId) {
      applications = applications.filter(a => a.organizationId === filters.organizationId);
    }
    if (filters?.applicationType) {
      applications = applications.filter(a => a.applicationType === filters.applicationType);
    }
    if (filters?.status) {
      applications = applications.filter(a => a.status === filters.status);
    }
    if (filters?.applicantId) {
      applications = applications.filter(a => a.applicantId === filters.applicantId);
    }
    if (filters?.assignedToId) {
      applications = applications.filter(a => a.assignedToId === filters.assignedToId);
    }
    if (filters?.submittedAfter) {
      applications = applications.filter(
        a => a.submittedAt && a.submittedAt >= filters.submittedAfter!
      );
    }
    if (filters?.submittedBefore) {
      applications = applications.filter(
        a => a.submittedAt && a.submittedAt <= filters.submittedBefore!
      );
    }

    return applications;
  }

  async updateApplication(
    id: string,
    updates: Partial<Application>,
    updatedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    // Recalculate loss if relevant fields changed
    if (
      updates.currentMortgageBalance !== undefined ||
      updates.propertySalePrice !== undefined ||
      updates.propertyAppraisedValue !== undefined ||
      updates.lossCalculationType !== undefined
    ) {
      const updatedData = { ...application, ...updates };
      updates.calculatedLoss = this.calculateLoss(updatedData);
    }

    const updatedApplication = dataStore.update<Application>('applications', id, {
      ...updates,
      updatedAt: new Date(),
      updatedBy,
    });

    if (!updatedApplication) {
      throw new AppError(404, 'Application not found');
    }

    return updatedApplication;
  }

  async submitApplication(id: string, submittedBy?: string): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (application.status !== ApplicationStatus.DRAFT) {
      throw new AppError(400, 'Only draft applications can be submitted');
    }

    // Validate required fields
    if (!application.applicantFirstName || !application.applicantLastName || !application.applicantEmail) {
      throw new AppError(400, 'Missing required applicant information');
    }

    const updatedApplication = await this.updateApplicationStatus(
      id,
      ApplicationStatus.SUBMITTED,
      'Application submitted by citizen',
      undefined,
      submittedBy
    );

    return {
      ...updatedApplication,
      submittedAt: new Date(),
    };
  }

  async assignApplication(
    id: string,
    assignedToId: string,
    assignedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (application.status === ApplicationStatus.DRAFT) {
      throw new AppError(400, 'Cannot assign draft applications');
    }

    const updatedApplication = dataStore.update<Application>('applications', id, {
      assignedToId,
      assignedAt: new Date(),
      updatedAt: new Date(),
      updatedBy: assignedBy,
    });

    if (!updatedApplication) {
      throw new AppError(404, 'Application not found');
    }

    await this.addComment(
      id,
      application.tenantId,
      `Application assigned to user ${assignedToId}`,
      true,
      assignedBy
    );

    return updatedApplication;
  }

  async startReview(id: string, reviewedBy?: string): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new AppError(400, 'Only submitted applications can be reviewed');
    }

    const updatedApplication = await this.updateApplicationStatus(
      id,
      ApplicationStatus.UNDER_REVIEW,
      'Review started',
      undefined,
      reviewedBy
    );

    return {
      ...updatedApplication,
      reviewStartedAt: new Date(),
    };
  }

  async completeReview(
    id: string,
    recommendApproval: boolean,
    notes?: string,
    reviewedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (application.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new AppError(400, 'Only applications under review can be completed');
    }

    const newStatus = recommendApproval
      ? ApplicationStatus.PENDING_APPROVAL
      : ApplicationStatus.REJECTED;

    const updatedApplication = await this.updateApplicationStatus(
      id,
      newStatus,
      'Review completed',
      notes,
      reviewedBy
    );

    return {
      ...updatedApplication,
      reviewCompletedAt: new Date(),
      ...(newStatus === ApplicationStatus.REJECTED && {
        rejectedAt: new Date(),
        rejectedBy: reviewedBy,
        rejectionReason: notes,
      }),
    };
  }

  async approveApplication(
    id: string,
    approvedAmount: number,
    notes?: string,
    approvedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (application.status !== ApplicationStatus.PENDING_APPROVAL) {
      throw new AppError(400, 'Only pending applications can be approved');
    }

    const updatedApplication = await this.updateApplicationStatus(
      id,
      ApplicationStatus.APPROVED,
      'Application approved',
      notes,
      approvedBy
    );

    return {
      ...updatedApplication,
      approvedAmount,
      approvedAt: new Date(),
      approvedBy,
    };
  }

  async rejectApplication(
    id: string,
    reason: string,
    rejectedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (
      application.status === ApplicationStatus.DRAFT ||
      application.status === ApplicationStatus.APPROVED ||
      application.status === ApplicationStatus.FUNDED ||
      application.status === ApplicationStatus.CLOSED
    ) {
      throw new AppError(400, 'Application cannot be rejected in current status');
    }

    const updatedApplication = await this.updateApplicationStatus(
      id,
      ApplicationStatus.REJECTED,
      'Application rejected',
      reason,
      rejectedBy
    );

    return {
      ...updatedApplication,
      rejectedAt: new Date(),
      rejectedBy,
      rejectionReason: reason,
    };
  }

  async disburseFunds(
    id: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string,
    disbursedBy?: string
  ): Promise<{ application: Application; disbursement: FundDisbursement }> {
    const application = await this.getApplicationById(id);

    if (application.status !== ApplicationStatus.APPROVED) {
      throw new AppError(400, 'Only approved applications can receive fund disbursements');
    }

    if (!application.approvedAmount || amount > application.approvedAmount) {
      throw new AppError(400, 'Disbursement amount exceeds approved amount');
    }

    // Create disbursement record
    const disbursement = await this.createDisbursement(
      id,
      application.tenantId,
      amount,
      paymentMethod,
      transactionId,
      disbursedBy
    );

    // Update application status to funded
    const updatedApplication = await this.updateApplicationStatus(
      id,
      ApplicationStatus.FUNDED,
      'Funds disbursed',
      `Disbursement: ${disbursement.disbursementNumber}`,
      disbursedBy
    );

    const finalApplication = {
      ...updatedApplication,
      fundedAmount: amount,
      fundedAt: new Date(),
      fundedBy: disbursedBy,
    };

    return {
      application: finalApplication,
      disbursement,
    };
  }

  async closeApplication(id: string, closedBy?: string): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (
      application.status !== ApplicationStatus.FUNDED &&
      application.status !== ApplicationStatus.REJECTED
    ) {
      throw new AppError(400, 'Only funded or rejected applications can be closed');
    }

    return this.updateApplicationStatus(
      id,
      ApplicationStatus.CLOSED,
      'Application closed',
      undefined,
      closedBy
    );
  }

  async cancelApplication(id: string, reason: string, cancelledBy?: string): Promise<Application> {
    const application = await this.getApplicationById(id);

    if (
      application.status === ApplicationStatus.FUNDED ||
      application.status === ApplicationStatus.CLOSED
    ) {
      throw new AppError(400, 'Funded or closed applications cannot be cancelled');
    }

    return this.updateApplicationStatus(
      id,
      ApplicationStatus.CANCELLED,
      'Application cancelled',
      reason,
      cancelledBy
    );
  }

  private async updateApplicationStatus(
    id: string,
    status: ApplicationStatus,
    reason?: string,
    notes?: string,
    changedBy?: string
  ): Promise<Application> {
    const application = await this.getApplicationById(id);

    const updatedApplication = dataStore.update<Application>('applications', id, {
      status,
      lastStatusChangeAt: new Date(),
      updatedAt: new Date(),
      updatedBy: changedBy,
    });

    if (!updatedApplication) {
      throw new AppError(404, 'Application not found');
    }

    // Add status history
    await this.addStatusHistory(
      id,
      application.tenantId,
      application.status,
      status,
      reason,
      notes,
      changedBy
    );

    return updatedApplication;
  }

  async getApplicationStatusHistory(applicationId: string): Promise<ApplicationStatusHistory[]> {
    return dataStore
      .findMany<ApplicationStatusHistory>(
        'applicationStatusHistory',
        h => h.applicationId === applicationId
      )
      .sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
  }

  private async addStatusHistory(
    applicationId: string,
    tenantId: string,
    fromStatus: ApplicationStatus | undefined,
    toStatus: ApplicationStatus,
    reason?: string,
    notes?: string,
    changedBy?: string
  ): Promise<ApplicationStatusHistory> {
    const history: ApplicationStatusHistory = {
      id: uuidv4(),
      applicationId,
      tenantId,
      fromStatus,
      toStatus,
      reason,
      notes,
      changedAt: new Date(),
      changedBy,
    };

    return dataStore.create<ApplicationStatusHistory>('applicationStatusHistory', history);
  }

  async addComment(
    applicationId: string,
    tenantId: string,
    comment: string,
    isInternal: boolean,
    createdBy?: string
  ): Promise<ApplicationComment> {
    const commentRecord: ApplicationComment = {
      id: uuidv4(),
      applicationId,
      tenantId,
      comment,
      isInternal,
      createdAt: new Date(),
      createdBy,
    };

    return dataStore.create<ApplicationComment>('applicationComments', commentRecord);
  }

  async getApplicationComments(applicationId: string, includeInternal: boolean = false): Promise<ApplicationComment[]> {
    let comments = dataStore.findMany<ApplicationComment>(
      'applicationComments',
      c => c.applicationId === applicationId
    );

    if (!includeInternal) {
      comments = comments.filter(c => !c.isInternal);
    }

    return comments.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  private async createDisbursement(
    applicationId: string,
    tenantId: string,
    amount: number,
    paymentMethod: string,
    transactionId?: string,
    createdBy?: string
  ): Promise<FundDisbursement> {
    const disbursementNumber = `DISB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const disbursement: FundDisbursement = {
      id: uuidv4(),
      applicationId,
      tenantId,
      disbursementNumber,
      amount,
      disbursementDate: new Date(),
      paymentMethod,
      transactionId,
      status: 'completed',
      createdAt: new Date(),
      createdBy,
    };

    return dataStore.create<FundDisbursement>('fundDisbursements', disbursement);
  }

  async getDisbursements(applicationId: string): Promise<FundDisbursement[]> {
    return dataStore
      .findMany<FundDisbursement>('fundDisbursements', d => d.applicationId === applicationId)
      .sort((a, b) => b.disbursementDate.getTime() - a.disbursementDate.getTime());
  }

  async getApplicationSummary(filters?: {
    tenantId?: string;
    organizationId?: string;
  }): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    totalApprovedAmount: number;
    totalFundedAmount: number;
    totalCalculatedLoss: number;
    avgProcessingTime: number;
  }> {
    const applications = await this.getAllApplications(filters);

    const summary = {
      total: applications.length,
      byStatus: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      totalApprovedAmount: 0,
      totalFundedAmount: 0,
      totalCalculatedLoss: 0,
      avgProcessingTime: 0,
    };

    let totalProcessingTime = 0;
    let processedCount = 0;

    applications.forEach(app => {
      // Count by status
      summary.byStatus[app.status] = (summary.byStatus[app.status] || 0) + 1;

      // Count by type
      summary.byType[app.applicationType] = (summary.byType[app.applicationType] || 0) + 1;

      // Sum amounts
      summary.totalApprovedAmount += app.approvedAmount || 0;
      summary.totalFundedAmount += app.fundedAmount || 0;
      summary.totalCalculatedLoss += app.calculatedLoss || 0;

      // Calculate processing time
      if (app.submittedAt && (app.approvedAt || app.rejectedAt)) {
        const endDate = app.approvedAt || app.rejectedAt;
        const processingTime = endDate!.getTime() - app.submittedAt.getTime();
        totalProcessingTime += processingTime;
        processedCount++;
      }
    });

    summary.avgProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount / (1000 * 60 * 60 * 24) : 0; // in days

    return summary;
  }
}

export const applicationService = new ApplicationService();
