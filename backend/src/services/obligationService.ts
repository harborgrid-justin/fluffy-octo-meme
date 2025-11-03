// BE-019: Obligation Tracking API
import { v4 as uuidv4 } from 'uuid';
import { Obligation, ObligationStatus } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class ObligationService {
  async createObligation(data: {
    budgetId: string;
    lineItemId?: string;
    programElementId?: string;
    documentNumber: string;
    amount: number;
    description: string;
    vendor?: string;
    obligationDate: Date | string;
    fiscalYearId: string;
  }, createdBy: string): Promise<Obligation> {
    const obligation: Obligation = {
      id: uuidv4(),
      ...data,
      obligationDate: new Date(data.obligationDate),
      status: ObligationStatus.OBLIGATED,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<Obligation>('obligations', obligation);
  }

  async getAllObligations(filters?: {
    budgetId?: string;
    fiscalYearId?: string;
    status?: ObligationStatus;
    programElementId?: string;
  }): Promise<Obligation[]> {
    let obligations = dataStore.findAll<Obligation>('obligations');

    if (filters?.budgetId) {
      obligations = obligations.filter(o => o.budgetId === filters.budgetId);
    }
    if (filters?.fiscalYearId) {
      obligations = obligations.filter(o => o.fiscalYearId === filters.fiscalYearId);
    }
    if (filters?.status) {
      obligations = obligations.filter(o => o.status === filters.status);
    }
    if (filters?.programElementId) {
      obligations = obligations.filter(o => o.programElementId === filters.programElementId);
    }

    return obligations.sort((a, b) => b.obligationDate.getTime() - a.obligationDate.getTime());
  }

  async getObligationById(id: string): Promise<Obligation> {
    const obligation = dataStore.findById<Obligation>('obligations', id);
    if (!obligation) {
      throw new AppError(404, 'Obligation not found');
    }
    return obligation;
  }

  async updateObligation(id: string, updates: Partial<Obligation>): Promise<Obligation> {
    if (updates.obligationDate) {
      updates.obligationDate = new Date(updates.obligationDate);
    }

    const updatedObligation = dataStore.update<Obligation>('obligations', id, updates);
    if (!updatedObligation) {
      throw new AppError(404, 'Obligation not found');
    }
    return updatedObligation;
  }

  async deleteObligation(id: string): Promise<void> {
    const success = dataStore.delete<Obligation>('obligations', id);
    if (!success) {
      throw new AppError(404, 'Obligation not found');
    }
  }

  async getObligationSummary(fiscalYearId: string): Promise<{
    totalObligations: number;
    totalAmount: number;
    byStatus: Record<string, { count: number; amount: number }>;
    byVendor: Record<string, number>;
  }> {
    const obligations = await this.getAllObligations({ fiscalYearId });

    const summary = {
      totalObligations: obligations.length,
      totalAmount: 0,
      byStatus: {} as Record<string, { count: number; amount: number }>,
      byVendor: {} as Record<string, number>,
    };

    obligations.forEach(obligation => {
      summary.totalAmount += obligation.amount;

      if (!summary.byStatus[obligation.status]) {
        summary.byStatus[obligation.status] = { count: 0, amount: 0 };
      }
      summary.byStatus[obligation.status].count++;
      summary.byStatus[obligation.status].amount += obligation.amount;

      if (obligation.vendor) {
        summary.byVendor[obligation.vendor] =
          (summary.byVendor[obligation.vendor] || 0) + obligation.amount;
      }
    });

    return summary;
  }
}

export const obligationService = new ObligationService();
