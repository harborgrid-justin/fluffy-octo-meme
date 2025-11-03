// BE-022: Appropriation Validation Service
// BE-023: Fund Availability Checking
import { v4 as uuidv4 } from 'uuid';
import { Appropriation, AppropriationType } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class AppropriationService {
  async createAppropriation(data: {
    fiscalYearId: string;
    code: string;
    name: string;
    amount: number;
    expirationDate: Date | string;
    type: AppropriationType;
    restrictions?: string[];
  }): Promise<Appropriation> {
    const appropriation: Appropriation = {
      id: uuidv4(),
      ...data,
      expirationDate: new Date(data.expirationDate),
      allocatedAmount: 0,
      availableAmount: data.amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<Appropriation>('appropriations', appropriation);
  }

  async getAllAppropriations(fiscalYearId?: string): Promise<Appropriation[]> {
    let appropriations = dataStore.findAll<Appropriation>('appropriations');

    if (fiscalYearId) {
      appropriations = appropriations.filter(a => a.fiscalYearId === fiscalYearId);
    }

    return appropriations;
  }

  async getAppropriationById(id: string): Promise<Appropriation> {
    const appropriation = dataStore.findById<Appropriation>('appropriations', id);
    if (!appropriation) {
      throw new AppError(404, 'Appropriation not found');
    }
    return appropriation;
  }

  async getAppropriationByCode(code: string, fiscalYearId: string): Promise<Appropriation> {
    const appropriation = dataStore.findOne<Appropriation>(
      'appropriations',
      a => a.code === code && a.fiscalYearId === fiscalYearId
    );

    if (!appropriation) {
      throw new AppError(404, 'Appropriation not found');
    }

    return appropriation;
  }

  async updateAppropriation(id: string, updates: Partial<Appropriation>): Promise<Appropriation> {
    if (updates.expirationDate) {
      updates.expirationDate = new Date(updates.expirationDate);
    }

    const updatedAppropriation = dataStore.update<Appropriation>('appropriations', id, updates);
    if (!updatedAppropriation) {
      throw new AppError(404, 'Appropriation not found');
    }
    return updatedAppropriation;
  }

  async deleteAppropriation(id: string): Promise<void> {
    const success = dataStore.delete<Appropriation>('appropriations', id);
    if (!success) {
      throw new AppError(404, 'Appropriation not found');
    }
  }

  async checkFundAvailability(appropriationCode: string, fiscalYearId: string, amount: number): Promise<{
    available: boolean;
    appropriation: Appropriation;
    requestedAmount: number;
    availableAmount: number;
    shortage: number;
  }> {
    const appropriation = await this.getAppropriationByCode(appropriationCode, fiscalYearId);

    // Check if expired
    if (new Date() > appropriation.expirationDate) {
      throw new AppError(400, 'Appropriation has expired');
    }

    const available = appropriation.availableAmount >= amount;

    return {
      available,
      appropriation,
      requestedAmount: amount,
      availableAmount: appropriation.availableAmount,
      shortage: available ? 0 : amount - appropriation.availableAmount,
    };
  }

  async allocateFunds(appropriationId: string, amount: number): Promise<Appropriation> {
    const appropriation = await this.getAppropriationById(appropriationId);

    if (appropriation.availableAmount < amount) {
      throw new AppError(400, 'Insufficient funds available');
    }

    return this.updateAppropriation(appropriationId, {
      allocatedAmount: appropriation.allocatedAmount + amount,
      availableAmount: appropriation.availableAmount - amount,
    });
  }

  async deallocateFunds(appropriationId: string, amount: number): Promise<Appropriation> {
    const appropriation = await this.getAppropriationById(appropriationId);

    return this.updateAppropriation(appropriationId, {
      allocatedAmount: Math.max(0, appropriation.allocatedAmount - amount),
      availableAmount: appropriation.availableAmount + amount,
    });
  }

  async validateAppropriation(code: string, fiscalYearId: string): Promise<{
    valid: boolean;
    appropriation?: Appropriation;
    reason?: string;
  }> {
    const appropriation = dataStore.findOne<Appropriation>(
      'appropriations',
      a => a.code === code && a.fiscalYearId === fiscalYearId
    );

    if (!appropriation) {
      return { valid: false, reason: 'Appropriation not found' };
    }

    if (new Date() > appropriation.expirationDate) {
      return { valid: false, appropriation, reason: 'Appropriation has expired' };
    }

    if (appropriation.availableAmount <= 0) {
      return { valid: false, appropriation, reason: 'No funds available' };
    }

    return { valid: true, appropriation };
  }
}

export const appropriationService = new AppropriationService();
