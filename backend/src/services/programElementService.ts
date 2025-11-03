// BE-007: Program Element Management API
import { v4 as uuidv4 } from 'uuid';
import { ProgramElement, ProgramStatus } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class ProgramElementService {
  async createProgramElement(data: {
    peNumber: string;
    name: string;
    description: string;
    department: string;
    organizationId?: string;
    fiscalYearId: string;
    budget: number;
    status?: ProgramStatus;
    priority?: number;
    startDate: Date | string;
    endDate?: Date | string;
  }, createdBy: string): Promise<ProgramElement> {
    // Check if PE number already exists
    const existing = dataStore.findOne<ProgramElement>(
      'programElements',
      pe => pe.peNumber === data.peNumber && pe.fiscalYearId === data.fiscalYearId
    );

    if (existing) {
      throw new AppError(400, 'Program element with this PE number already exists for this fiscal year');
    }

    const programElement: ProgramElement = {
      id: uuidv4(),
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      obligatedAmount: 0,
      expendedAmount: 0,
      status: data.status || ProgramStatus.PLANNING,
      priority: data.priority || 5,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<ProgramElement>('programElements', programElement);
  }

  async getAllProgramElements(filters?: {
    fiscalYearId?: string;
    department?: string;
    status?: ProgramStatus;
    organizationId?: string;
  }): Promise<ProgramElement[]> {
    let programs = dataStore.findAll<ProgramElement>('programElements');

    if (filters?.fiscalYearId) {
      programs = programs.filter(p => p.fiscalYearId === filters.fiscalYearId);
    }
    if (filters?.department) {
      programs = programs.filter(p => p.department === filters.department);
    }
    if (filters?.status) {
      programs = programs.filter(p => p.status === filters.status);
    }
    if (filters?.organizationId) {
      programs = programs.filter(p => p.organizationId === filters.organizationId);
    }

    return programs.sort((a, b) => a.priority - b.priority);
  }

  async getProgramElementById(id: string): Promise<ProgramElement> {
    const program = dataStore.findById<ProgramElement>('programElements', id);
    if (!program) {
      throw new AppError(404, 'Program element not found');
    }
    return program;
  }

  async updateProgramElement(id: string, updates: Partial<ProgramElement>): Promise<ProgramElement> {
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    const updatedProgram = dataStore.update<ProgramElement>('programElements', id, updates);
    if (!updatedProgram) {
      throw new AppError(404, 'Program element not found');
    }
    return updatedProgram;
  }

  async deleteProgramElement(id: string): Promise<void> {
    const success = dataStore.delete<ProgramElement>('programElements', id);
    if (!success) {
      throw new AppError(404, 'Program element not found');
    }
  }

  async getProgramSummary(fiscalYearId: string): Promise<{
    totalPrograms: number;
    totalBudget: number;
    totalObligated: number;
    totalExpended: number;
    byStatus: Record<string, number>;
    byDepartment: Record<string, { count: number; budget: number }>;
  }> {
    const programs = await this.getAllProgramElements({ fiscalYearId });

    const summary = {
      totalPrograms: programs.length,
      totalBudget: 0,
      totalObligated: 0,
      totalExpended: 0,
      byStatus: {} as Record<string, number>,
      byDepartment: {} as Record<string, { count: number; budget: number }>,
    };

    programs.forEach(program => {
      summary.totalBudget += program.budget;
      summary.totalObligated += program.obligatedAmount;
      summary.totalExpended += program.expendedAmount;

      summary.byStatus[program.status] = (summary.byStatus[program.status] || 0) + 1;

      if (!summary.byDepartment[program.department]) {
        summary.byDepartment[program.department] = { count: 0, budget: 0 };
      }
      summary.byDepartment[program.department].count++;
      summary.byDepartment[program.department].budget += program.budget;
    });

    return summary;
  }
}

export const programElementService = new ProgramElementService();
