/**
 * Budget Approved Event Handler
 *
 * Handles side effects when a budget is approved:
 * - Send notifications to relevant users
 * - Update fiscal year allocations
 * - Create audit log entry
 * - Trigger report generation
 */

import { IDomainEventHandler, DomainEvent } from '../../../domain/shared/DomainEvent';

// Example event structure
export class BudgetApprovedEvent extends DomainEvent {
  constructor(
    public readonly budgetId: string,
    public readonly budgetTitle: string,
    public readonly amount: number,
    public readonly approvedBy: string,
    public readonly fiscalYearId: string
  ) {
    super();
  }

  getPayload() {
    return {
      budgetId: this.budgetId,
      budgetTitle: this.budgetTitle,
      amount: this.amount,
      approvedBy: this.approvedBy,
      fiscalYearId: this.fiscalYearId,
    };
  }
}

export class BudgetApprovedHandler implements IDomainEventHandler<BudgetApprovedEvent> {
  constructor(
    // Inject dependencies
    // private notificationService: INotificationService,
    // private auditLogService: IAuditLogService,
    // private fiscalYearRepository: IFiscalYearRepository
  ) {}

  async handle(event: BudgetApprovedEvent): Promise<void> {
    console.log(`[BudgetApprovedHandler] Handling budget approval for: ${event.budgetId}`);

    try {
      // 1. Send notification to budget creator
      await this.sendNotification(event);

      // 2. Update fiscal year allocation
      await this.updateFiscalYear(event);

      // 3. Create audit log entry
      await this.createAuditLog(event);

      // 4. Trigger report generation (async job)
      await this.triggerReportGeneration(event);

      console.log(`[BudgetApprovedHandler] Successfully handled budget approval`);
    } catch (error) {
      console.error(`[BudgetApprovedHandler] Error handling event:`, error);
      throw error;
    }
  }

  private async sendNotification(event: BudgetApprovedEvent): Promise<void> {
    // TODO: Implement notification service
    console.log(`[BudgetApprovedHandler] Would send notification for budget: ${event.budgetTitle}`);

    // Example:
    // await this.notificationService.send({
    //   userId: event.creatorId,
    //   title: 'Budget Approved',
    //   message: `Your budget "${event.budgetTitle}" has been approved`,
    //   type: 'budget_approval'
    // });
  }

  private async updateFiscalYear(event: BudgetApprovedEvent): Promise<void> {
    // TODO: Update fiscal year allocated budget
    console.log(`[BudgetApprovedHandler] Would update fiscal year: ${event.fiscalYearId}`);

    // Example:
    // const fiscalYear = await this.fiscalYearRepository.findById(event.fiscalYearId);
    // fiscalYear.addAllocatedBudget(event.amount);
    // await this.fiscalYearRepository.save(fiscalYear);
  }

  private async createAuditLog(event: BudgetApprovedEvent): Promise<void> {
    // TODO: Create audit log entry
    console.log(`[BudgetApprovedHandler] Would create audit log for budget: ${event.budgetId}`);

    // Example:
    // await this.auditLogService.log({
    //   entityType: 'Budget',
    //   entityId: event.budgetId,
    //   action: 'approved',
    //   userId: event.approvedBy,
    //   timestamp: event.occurredAt
    // });
  }

  private async triggerReportGeneration(event: BudgetApprovedEvent): Promise<void> {
    // TODO: Add job to queue for report generation
    console.log(`[BudgetApprovedHandler] Would trigger report generation`);

    // Example:
    // await this.queueService.addJob('generate-budget-report', {
    //   budgetId: event.budgetId,
    //   fiscalYearId: event.fiscalYearId
    // });
  }
}
