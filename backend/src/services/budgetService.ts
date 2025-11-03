// BE-004: Budget Allocation API (complete CRUD)
// BE-015: Budget Version Control/History
import { v4 as uuidv4 } from 'uuid';
import { Budget, BudgetStatus, BudgetVersion, ApprovalStatus } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class BudgetService {
  async createBudget(data: {
    fiscalYearId: string;
    title: string;
    description?: string;
    amount: number;
    department: string;
    organizationId?: string;
    status?: BudgetStatus;
  }, createdBy: string): Promise<Budget> {
    const budget: Budget = {
      id: uuidv4(),
      ...data,
      allocatedAmount: 0,
      obligatedAmount: 0,
      expendedAmount: 0,
      status: data.status || BudgetStatus.DRAFT,
      approvalStatus: ApprovalStatus.PENDING,
      version: 1,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdBudget = dataStore.create<Budget>('budgets', budget);

    // Create initial version
    await this.createVersion(budget.id, budget, 'Initial creation', createdBy);

    return createdBudget;
  }

  async getAllBudgets(filters?: {
    fiscalYearId?: string;
    department?: string;
    status?: BudgetStatus;
    organizationId?: string;
  }): Promise<Budget[]> {
    let budgets = dataStore.findAll<Budget>('budgets');

    if (filters?.fiscalYearId) {
      budgets = budgets.filter(b => b.fiscalYearId === filters.fiscalYearId);
    }
    if (filters?.department) {
      budgets = budgets.filter(b => b.department === filters.department);
    }
    if (filters?.status) {
      budgets = budgets.filter(b => b.status === filters.status);
    }
    if (filters?.organizationId) {
      budgets = budgets.filter(b => b.organizationId === filters.organizationId);
    }

    return budgets;
  }

  async getBudgetById(id: string): Promise<Budget> {
    const budget = dataStore.findById<Budget>('budgets', id);
    if (!budget) {
      throw new AppError(404, 'Budget not found');
    }
    return budget;
  }

  async updateBudget(id: string, updates: Partial<Budget>, updatedBy: string): Promise<Budget> {
    const budget = await this.getBudgetById(id);

    const updatedBudget = dataStore.update<Budget>('budgets', id, {
      ...updates,
      version: budget.version + 1,
    });

    if (!updatedBudget) {
      throw new AppError(404, 'Budget not found');
    }

    // Create version history
    await this.createVersion(id, updatedBudget, 'Budget updated', updatedBy);

    return updatedBudget;
  }

  async deleteBudget(id: string): Promise<void> {
    const success = dataStore.delete<Budget>('budgets', id);
    if (!success) {
      throw new AppError(404, 'Budget not found');
    }
  }

  async getBudgetVersionHistory(budgetId: string): Promise<BudgetVersion[]> {
    return dataStore.findMany<BudgetVersion>(
      'budgetVersions',
      v => v.budgetId === budgetId
    ).sort((a, b) => b.version - a.version);
  }

  async getBudgetVersion(budgetId: string, version: number): Promise<BudgetVersion> {
    const budgetVersion = dataStore.findOne<BudgetVersion>(
      'budgetVersions',
      v => v.budgetId === budgetId && v.version === version
    );

    if (!budgetVersion) {
      throw new AppError(404, 'Budget version not found');
    }

    return budgetVersion;
  }

  async rollbackToVersion(budgetId: string, version: number, updatedBy: string): Promise<Budget> {
    const budgetVersion = await this.getBudgetVersion(budgetId, version);
    const budget = await this.getBudgetById(budgetId);

    const rolledBackBudget = dataStore.update<Budget>('budgets', budgetId, {
      ...budgetVersion.data,
      version: budget.version + 1,
    });

    if (!rolledBackBudget) {
      throw new AppError(404, 'Budget not found');
    }

    await this.createVersion(
      budgetId,
      rolledBackBudget,
      `Rolled back to version ${version}`,
      updatedBy
    );

    return rolledBackBudget;
  }

  async updateBudgetStatus(id: string, status: BudgetStatus, updatedBy: string): Promise<Budget> {
    return this.updateBudget(id, { status }, updatedBy);
  }

  async getBudgetSummary(fiscalYearId: string): Promise<{
    totalBudget: number;
    allocatedAmount: number;
    obligatedAmount: number;
    expendedAmount: number;
    availableAmount: number;
    byDepartment: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    const budgets = await this.getAllBudgets({ fiscalYearId });

    const summary = {
      totalBudget: 0,
      allocatedAmount: 0,
      obligatedAmount: 0,
      expendedAmount: 0,
      availableAmount: 0,
      byDepartment: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    budgets.forEach(budget => {
      summary.totalBudget += budget.amount;
      summary.allocatedAmount += budget.allocatedAmount;
      summary.obligatedAmount += budget.obligatedAmount;
      summary.expendedAmount += budget.expendedAmount;

      summary.byDepartment[budget.department] =
        (summary.byDepartment[budget.department] || 0) + budget.amount;

      summary.byStatus[budget.status] =
        (summary.byStatus[budget.status] || 0) + 1;
    });

    summary.availableAmount = summary.totalBudget - summary.allocatedAmount;

    return summary;
  }

  private async createVersion(
    budgetId: string,
    data: Budget,
    changes: string,
    createdBy: string
  ): Promise<BudgetVersion> {
    const version: BudgetVersion = {
      id: uuidv4(),
      budgetId,
      version: data.version,
      data: { ...data },
      changes,
      createdBy,
      createdAt: new Date(),
    };

    return dataStore.create<BudgetVersion>('budgetVersions', version);
  }
}

export const budgetService = new BudgetService();
