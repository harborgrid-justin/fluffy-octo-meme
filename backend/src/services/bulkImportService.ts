// BE-024: Bulk Import/Export Service
// BE-025: Data Validation Service
import { dataStore } from './dataStore';
import { budgetService } from './budgetService';
import { lineItemService } from './lineItemService';
import { programElementService } from './programElementService';
import { obligationService } from './obligationService';
import { expenditureService } from './expenditureService';
import { AppError } from '../middleware/errorHandler';
import {
  createBudgetSchema,
  createLineItemSchema,
  createProgramElementSchema,
  createObligationSchema,
  createExpenditureSchema,
} from '../validation/schemas';

export class BulkImportService {
  async importData(
    entityType: 'budgets' | 'lineitems' | 'programs' | 'obligations' | 'expenditures',
    data: any[],
    userId: string,
    validateOnly: boolean = false
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ row: number; error: string; data: any }>;
    imported?: any[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as Array<{ row: number; error: string; data: any }>,
      imported: [] as any[],
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const item = data[i];

        // Validate
        this.validateItem(entityType, item);

        if (!validateOnly) {
          // Import
          const imported = await this.importItem(entityType, item, userId);
          results.imported.push(imported);
        }

        results.successful++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
          data: data[i],
        });
      }
    }

    return results;
  }

  async exportData(
    entityType: 'budgets' | 'lineitems' | 'programs' | 'obligations' | 'expenditures',
    filters?: any
  ): Promise<any[]> {
    let data: any[] = [];

    switch (entityType) {
      case 'budgets':
        data = await budgetService.getAllBudgets(filters);
        break;
      case 'lineitems':
        if (filters?.budgetId) {
          data = await lineItemService.getLineItemsByBudget(filters.budgetId);
        }
        break;
      case 'programs':
        data = await programElementService.getAllProgramElements(filters);
        break;
      case 'obligations':
        data = await obligationService.getAllObligations(filters);
        break;
      case 'expenditures':
        data = await expenditureService.getAllExpenditures(filters);
        break;
    }

    return data;
  }

  private validateItem(entityType: string, item: any): void {
    switch (entityType) {
      case 'budgets':
        createBudgetSchema.parse(item);
        break;
      case 'lineitems':
        createLineItemSchema.parse(item);
        break;
      case 'programs':
        createProgramElementSchema.parse(item);
        break;
      case 'obligations':
        createObligationSchema.parse(item);
        break;
      case 'expenditures':
        createExpenditureSchema.parse(item);
        break;
      default:
        throw new AppError(400, 'Invalid entity type');
    }
  }

  private async importItem(entityType: string, item: any, userId: string): Promise<any> {
    switch (entityType) {
      case 'budgets':
        return await budgetService.createBudget(item, userId);
      case 'lineitems':
        return await lineItemService.createLineItem(item, userId);
      case 'programs':
        return await programElementService.createProgramElement(item, userId);
      case 'obligations':
        return await obligationService.createObligation(item, userId);
      case 'expenditures':
        return await expenditureService.createExpenditure(item, userId);
      default:
        throw new AppError(400, 'Invalid entity type');
    }
  }

  async validateBulkData(
    entityType: 'budgets' | 'lineitems' | 'programs' | 'obligations' | 'expenditures',
    data: any[]
  ): Promise<{
    valid: boolean;
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const errors: Array<{ row: number; error: string }> = [];

    data.forEach((item, index) => {
      try {
        this.validateItem(entityType, item);
      } catch (error: any) {
        errors.push({
          row: index + 1,
          error: error.message || 'Validation failed',
        });
      }
    });

    return {
      valid: errors.length === 0,
      totalRecords: data.length,
      validRecords: data.length - errors.length,
      invalidRecords: errors.length,
      errors,
    };
  }
}

export const bulkImportService = new BulkImportService();
