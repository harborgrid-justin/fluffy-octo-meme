// BE-021: Budget vs Actual Variance API
import { v4 as uuidv4 } from 'uuid';
import { VarianceAnalysis, VarianceStatus } from '../types';
import { dataStore } from './dataStore';
import { budgetService } from './budgetService';
import { obligationService } from './obligationService';
import { expenditureService } from './expenditureService';
import { AppError } from '../middleware/errorHandler';

export class VarianceService {
  async calculateVariance(budgetId: string, period: string): Promise<VarianceAnalysis> {
    const budget = await budgetService.getBudgetById(budgetId);

    const obligations = await obligationService.getAllObligations({ budgetId });
    const expenditures = await expenditureService.getAllExpenditures({ budgetId });

    const actualAmount = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const plannedAmount = budget.amount;
    const variance = actualAmount - plannedAmount;
    const variancePercentage = (variance / plannedAmount) * 100;

    let status: VarianceStatus;
    if (variancePercentage <= -10) {
      status = VarianceStatus.FAVORABLE;
    } else if (variancePercentage >= 10) {
      status = VarianceStatus.UNFAVORABLE;
    } else if (Math.abs(variancePercentage) >= 20) {
      status = VarianceStatus.CRITICAL;
    } else {
      status = VarianceStatus.NEUTRAL;
    }

    const analysis: VarianceAnalysis = {
      id: uuidv4(),
      budgetId,
      fiscalYearId: budget.fiscalYearId,
      period,
      plannedAmount,
      actualAmount,
      variance,
      variancePercentage,
      status,
      createdAt: new Date(),
    };

    return dataStore.create<VarianceAnalysis>('varianceAnalyses', analysis);
  }

  async getVarianceAnalysis(budgetId: string): Promise<VarianceAnalysis[]> {
    return dataStore.findMany<VarianceAnalysis>(
      'varianceAnalyses',
      va => va.budgetId === budgetId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getFiscalYearVariances(fiscalYearId: string): Promise<VarianceAnalysis[]> {
    return dataStore.findMany<VarianceAnalysis>(
      'varianceAnalyses',
      va => va.fiscalYearId === fiscalYearId
    ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getVarianceSummary(fiscalYearId: string): Promise<{
    totalBudgets: number;
    totalVariance: number;
    averageVariancePercentage: number;
    byStatus: Record<string, number>;
    critical: VarianceAnalysis[];
  }> {
    const variances = await this.getFiscalYearVariances(fiscalYearId);

    const summary = {
      totalBudgets: variances.length,
      totalVariance: 0,
      averageVariancePercentage: 0,
      byStatus: {} as Record<string, number>,
      critical: [] as VarianceAnalysis[],
    };

    variances.forEach(variance => {
      summary.totalVariance += variance.variance;

      summary.byStatus[variance.status] = (summary.byStatus[variance.status] || 0) + 1;

      if (variance.status === VarianceStatus.CRITICAL) {
        summary.critical.push(variance);
      }
    });

    summary.averageVariancePercentage =
      variances.reduce((sum, v) => sum + v.variancePercentage, 0) / variances.length || 0;

    return summary;
  }
}

export const varianceService = new VarianceService();
