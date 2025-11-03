// BE-006: Fiscal Year Management API
import { v4 as uuidv4 } from 'uuid';
import { FiscalYear, FiscalYearStatus } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class FiscalYearService {
  async createFiscalYear(data: {
    year: number;
    name: string;
    status: FiscalYearStatus;
    startDate: Date | string;
    endDate: Date | string;
    totalBudget?: number;
  }): Promise<FiscalYear> {
    // Check if fiscal year already exists
    const existing = dataStore.findOne<FiscalYear>(
      'fiscalYears',
      fy => fy.year === data.year
    );

    if (existing) {
      throw new AppError(400, 'Fiscal year already exists');
    }

    const fiscalYear: FiscalYear = {
      id: uuidv4(),
      year: data.year,
      name: data.name,
      status: data.status,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      totalBudget: data.totalBudget || 0,
      allocatedBudget: 0,
      obligatedBudget: 0,
      expendedBudget: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<FiscalYear>('fiscalYears', fiscalYear);
  }

  async getAllFiscalYears(): Promise<FiscalYear[]> {
    return dataStore.findAll<FiscalYear>('fiscalYears')
      .sort((a, b) => b.year - a.year);
  }

  async getFiscalYearById(id: string): Promise<FiscalYear> {
    const fiscalYear = dataStore.findById<FiscalYear>('fiscalYears', id);
    if (!fiscalYear) {
      throw new AppError(404, 'Fiscal year not found');
    }
    return fiscalYear;
  }

  async getFiscalYearByYear(year: number): Promise<FiscalYear> {
    const fiscalYear = dataStore.findOne<FiscalYear>(
      'fiscalYears',
      fy => fy.year === year
    );

    if (!fiscalYear) {
      throw new AppError(404, 'Fiscal year not found');
    }
    return fiscalYear;
  }

  async getCurrentFiscalYear(): Promise<FiscalYear> {
    const current = dataStore.findOne<FiscalYear>(
      'fiscalYears',
      fy => fy.status === FiscalYearStatus.CURRENT
    );

    if (!current) {
      throw new AppError(404, 'No current fiscal year found');
    }
    return current;
  }

  async updateFiscalYear(id: string, updates: Partial<FiscalYear>): Promise<FiscalYear> {
    const updatedFY = dataStore.update<FiscalYear>('fiscalYears', id, updates);
    if (!updatedFY) {
      throw new AppError(404, 'Fiscal year not found');
    }
    return updatedFY;
  }

  async deleteFiscalYear(id: string): Promise<void> {
    const success = dataStore.delete<FiscalYear>('fiscalYears', id);
    if (!success) {
      throw new AppError(404, 'Fiscal year not found');
    }
  }

  async closeFiscalYear(id: string): Promise<FiscalYear> {
    return this.updateFiscalYear(id, { status: FiscalYearStatus.CLOSED });
  }

  async setCurrentFiscalYear(id: string): Promise<FiscalYear> {
    // Set all other fiscal years to non-current
    const allFY = await this.getAllFiscalYears();
    allFY.forEach(fy => {
      if (fy.id !== id && fy.status === FiscalYearStatus.CURRENT) {
        dataStore.update<FiscalYear>('fiscalYears', fy.id, { status: FiscalYearStatus.CLOSED });
      }
    });

    return this.updateFiscalYear(id, { status: FiscalYearStatus.CURRENT });
  }
}

export const fiscalYearService = new FiscalYearService();
