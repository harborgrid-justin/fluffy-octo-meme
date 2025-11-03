// BE-005: Budget Line Item Management API
import { v4 as uuidv4 } from 'uuid';
import { BudgetLineItem } from '../types';
import { dataStore } from './dataStore';
import { AppError } from '../middleware/errorHandler';

export class LineItemService {
  async createLineItem(data: {
    budgetId: string;
    lineNumber: string;
    description: string;
    amount: number;
    appropriation: string;
    bpac: string;
    category: string;
    subcategory?: string;
    status?: string;
  }, createdBy: string): Promise<BudgetLineItem> {
    const lineItem: BudgetLineItem = {
      id: uuidv4(),
      ...data,
      obligatedAmount: 0,
      expendedAmount: 0,
      status: data.status || 'active',
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return dataStore.create<BudgetLineItem>('budgetLineItems', lineItem);
  }

  async getLineItemsByBudget(budgetId: string): Promise<BudgetLineItem[]> {
    return dataStore.findMany<BudgetLineItem>(
      'budgetLineItems',
      item => item.budgetId === budgetId
    );
  }

  async getLineItemById(id: string): Promise<BudgetLineItem> {
    const lineItem = dataStore.findById<BudgetLineItem>('budgetLineItems', id);
    if (!lineItem) {
      throw new AppError(404, 'Line item not found');
    }
    return lineItem;
  }

  async updateLineItem(id: string, updates: Partial<BudgetLineItem>): Promise<BudgetLineItem> {
    const updatedItem = dataStore.update<BudgetLineItem>('budgetLineItems', id, updates);
    if (!updatedItem) {
      throw new AppError(404, 'Line item not found');
    }
    return updatedItem;
  }

  async deleteLineItem(id: string): Promise<void> {
    const success = dataStore.delete<BudgetLineItem>('budgetLineItems', id);
    if (!success) {
      throw new AppError(404, 'Line item not found');
    }
  }

  async getLineItemSummary(budgetId: string): Promise<{
    totalAmount: number;
    obligatedAmount: number;
    expendedAmount: number;
    availableAmount: number;
    byCategory: Record<string, number>;
    count: number;
  }> {
    const items = await this.getLineItemsByBudget(budgetId);

    const summary = {
      totalAmount: 0,
      obligatedAmount: 0,
      expendedAmount: 0,
      availableAmount: 0,
      byCategory: {} as Record<string, number>,
      count: items.length,
    };

    items.forEach(item => {
      summary.totalAmount += item.amount;
      summary.obligatedAmount += item.obligatedAmount;
      summary.expendedAmount += item.expendedAmount;

      summary.byCategory[item.category] =
        (summary.byCategory[item.category] || 0) + item.amount;
    });

    summary.availableAmount = summary.totalAmount - summary.obligatedAmount;

    return summary;
  }
}

export const lineItemService = new LineItemService();
