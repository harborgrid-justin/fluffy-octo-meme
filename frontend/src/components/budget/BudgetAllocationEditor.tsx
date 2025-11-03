import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Input, Button, Badge } from '../ui';
import { BudgetLineItem } from '@/types';

interface AllocationCategory {
  name: string;
  allocated: number;
  percentage: number;
  color: string;
}

interface BudgetAllocationEditorProps {
  totalBudget: number;
  lineItems: BudgetLineItem[];
  onUpdate: (allocations: AllocationCategory[]) => void;
}

export function BudgetAllocationEditor({
  totalBudget,
  lineItems,
  onUpdate
}: BudgetAllocationEditorProps) {
  const [allocations, setAllocations] = useState<AllocationCategory[]>([]);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    // Initialize allocations from line items
    const categoryMap = new Map<string, number>();
    lineItems.forEach(item => {
      const current = categoryMap.get(item.category) || 0;
      categoryMap.set(item.category, current + item.amount);
    });

    const initial: AllocationCategory[] = Array.from(categoryMap.entries()).map(([name, allocated], index) => ({
      name,
      allocated,
      percentage: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    }));

    setAllocations(initial);
  }, [lineItems, totalBudget]);

  const totalAllocated = allocations.reduce((sum, cat) => sum + cat.allocated, 0);
  const remaining = totalBudget - totalAllocated;
  const remainingPercentage = totalBudget > 0 ? (remaining / totalBudget) * 100 : 0;

  const addCategory = () => {
    if (newCategory && !allocations.find(a => a.name === newCategory)) {
      const newAllocation: AllocationCategory = {
        name: newCategory,
        allocated: 0,
        percentage: 0,
        color: CATEGORY_COLORS[allocations.length % CATEGORY_COLORS.length]
      };
      const updated = [...allocations, newAllocation];
      setAllocations(updated);
      setNewCategory('');
      onUpdate(updated);
    }
  };

  const updateAllocation = (index: number, amount: number) => {
    const updated = [...allocations];
    updated[index].allocated = amount;
    updated[index].percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
    setAllocations(updated);
    onUpdate(updated);
  };

  const updatePercentage = (index: number, percentage: number) => {
    const updated = [...allocations];
    const amount = (totalBudget * percentage) / 100;
    updated[index].allocated = amount;
    updated[index].percentage = percentage;
    setAllocations(updated);
    onUpdate(updated);
  };

  const removeCategory = (index: number) => {
    const updated = allocations.filter((_, i) => i !== index);
    setAllocations(updated);
    onUpdate(updated);
  };

  return (
    <Card>
      <CardHeader
        title="Budget Allocation Editor"
        subtitle={`Total Budget: $${totalBudget.toLocaleString()}`}
      />

      <CardContent>
        {/* Summary Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Allocated: ${totalAllocated.toLocaleString()}</span>
            <span>Remaining: ${remaining.toLocaleString()}</span>
          </div>
          <div className="w-full h-8 bg-gray-200 rounded-lg overflow-hidden flex">
            {allocations.map((category, index) => (
              <div
                key={index}
                className="h-full transition-all duration-300"
                style={{
                  width: `${category.percentage}%`,
                  backgroundColor: category.color
                }}
                title={`${category.name}: ${category.percentage.toFixed(1)}%`}
              />
            ))}
            {remainingPercentage > 0 && (
              <div
                className="h-full bg-gray-300"
                style={{ width: `${remainingPercentage}%` }}
                title={`Unallocated: ${remainingPercentage.toFixed(1)}%`}
              />
            )}
          </div>
        </div>

        {/* Allocation List */}
        <div className="space-y-4 mb-6">
          {allocations.map((category, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded mr-2"
                    style={{ backgroundColor: category.color }}
                  />
                  <h4 className="font-semibold">{category.name}</h4>
                </div>
                <button
                  onClick={() => removeCategory(index)}
                  className="text-red-600 hover:text-red-800 text-sm"
                  aria-label={`Remove ${category.name} category`}
                >
                  Remove
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Amount ($)"
                    type="number"
                    value={category.allocated}
                    onChange={(e) => updateAllocation(index, parseFloat(e.target.value) || 0)}
                    fullWidth
                    min={0}
                    max={totalBudget}
                  />
                </div>
                <div>
                  <Input
                    label="Percentage (%)"
                    type="number"
                    value={category.percentage.toFixed(2)}
                    onChange={(e) => updatePercentage(index, parseFloat(e.target.value) || 0)}
                    fullWidth
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Category */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Add Category</h4>
          <div className="flex space-x-3">
            <Input
              placeholder="Category name"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              fullWidth
            />
            <Button onClick={addCategory} disabled={!newCategory}>
              Add
            </Button>
          </div>
        </div>

        {/* Validation Messages */}
        {remaining < 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            Over-allocated by ${Math.abs(remaining).toLocaleString()}
          </div>
        )}

        {remaining > 0 && totalAllocated > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            ${remaining.toLocaleString()} remaining to be allocated
          </div>
        )}

        {remaining === 0 && totalAllocated > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            Budget fully allocated
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const CATEGORY_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];
