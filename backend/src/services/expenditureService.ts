// BE-020: Expenditure Tracking API
import { v4 as uuidv4 } from 'uuid';
import { Expenditure, ExpenditureStatus } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class ExpenditureService {
  async createExpenditure(data: {
    obligationId?: string;
    budgetId: string;
    lineItemId?: string;
    programElementId?: string;
    amount: number;
    description: string;
    vendor?: string;
    invoiceNumber?: string;
    paymentDate: Date | string;
    fiscalYearId: string;
  }, createdBy: string): Promise<Expenditure> {
    const expenditure: Expenditure = {
      id: uuidv4(),
      ...data,
      paymentDate: new Date(data.paymentDate),
      status: ExpenditureStatus.PAID,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<Expenditure>('expenditures', expenditure);
  }

  async getAllExpenditures(filters?: {
    budgetId?: string;
    fiscalYearId?: string;
    status?: ExpenditureStatus;
    programElementId?: string;
    obligationId?: string;
  }): Promise<Expenditure[]> {
    let expenditures = dataStore.findAll<Expenditure>('expenditures');

    if (filters?.budgetId) {
      expenditures = expenditures.filter(e => e.budgetId === filters.budgetId);
    }
    if (filters?.fiscalYearId) {
      expenditures = expenditures.filter(e => e.fiscalYearId === filters.fiscalYearId);
    }
    if (filters?.status) {
      expenditures = expenditures.filter(e => e.status === filters.status);
    }
    if (filters?.programElementId) {
      expenditures = expenditures.filter(e => e.programElementId === filters.programElementId);
    }
    if (filters?.obligationId) {
      expenditures = expenditures.filter(e => e.obligationId === filters.obligationId);
    }

    return expenditures.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  }

  async getExpenditureById(id: string): Promise<Expenditure> {
    const expenditure = dataStore.findById<Expenditure>('expenditures', id);
    if (!expenditure) {
      throw new AppError(404, 'Expenditure not found');
    }
    return expenditure;
  }

  async updateExpenditure(id: string, updates: Partial<Expenditure>): Promise<Expenditure> {
    if (updates.paymentDate) {
      updates.paymentDate = new Date(updates.paymentDate);
    }

    const updatedExpenditure = dataStore.update<Expenditure>('expenditures', id, updates);
    if (!updatedExpenditure) {
      throw new AppError(404, 'Expenditure not found');
    }
    return updatedExpenditure;
  }

  async deleteExpenditure(id: string): Promise<void> {
    const success = dataStore.delete<Expenditure>('expenditures', id);
    if (!success) {
      throw new AppError(404, 'Expenditure not found');
    }
  }

  async getExpenditureSummary(fiscalYearId: string): Promise<{
    totalExpenditures: number;
    totalAmount: number;
    byStatus: Record<string, { count: number; amount: number }>;
    byVendor: Record<string, number>;
    byMonth: Record<string, number>;
  }> {
    const expenditures = await this.getAllExpenditures({ fiscalYearId });

    const summary = {
      totalExpenditures: expenditures.length,
      totalAmount: 0,
      byStatus: {} as Record<string, { count: number; amount: number }>,
      byVendor: {} as Record<string, number>,
      byMonth: {} as Record<string, number>,
    };

    expenditures.forEach(expenditure => {
      summary.totalAmount += expenditure.amount;

      if (!summary.byStatus[expenditure.status]) {
        summary.byStatus[expenditure.status] = { count: 0, amount: 0 };
      }
      summary.byStatus[expenditure.status].count++;
      summary.byStatus[expenditure.status].amount += expenditure.amount;

      if (expenditure.vendor) {
        summary.byVendor[expenditure.vendor] =
          (summary.byVendor[expenditure.vendor] || 0) + expenditure.amount;
      }

      const month = expenditure.paymentDate.toISOString().substring(0, 7);
      summary.byMonth[month] = (summary.byMonth[month] || 0) + expenditure.amount;
    });

    return summary;
  }
}

export const expenditureService = new ExpenditureService();
