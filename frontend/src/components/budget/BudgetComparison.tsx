import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Badge } from '../ui';
import { Budget } from '@/types';

interface BudgetComparisonProps {
  budgets: Budget[];
}

export function BudgetComparison({ budgets }: BudgetComparisonProps) {
  const [selectedBudgets, setSelectedBudgets] = useState<string[]>([]);

  const toggleBudget = (id: string) => {
    setSelectedBudgets(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const comparedBudgets = budgets.filter(b => selectedBudgets.includes(b.id));

  return (
    <div className="space-y-6">
      {/* Budget Selection */}
      <Card>
        <CardHeader title="Select Budgets to Compare" subtitle="Choose up to 3 budgets" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => (
              <div
                key={budget.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedBudgets.includes(budget.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleBudget(budget.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{budget.name}</h4>
                  <input
                    type="checkbox"
                    checked={selectedBudgets.includes(budget.id)}
                    onChange={() => {}}
                    className="mt-1"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <div>FY {budget.fiscalYear}</div>
                  <div>${budget.totalAmount.toLocaleString()}</div>
                </div>
                <Badge variant="primary" size="sm" className="mt-2">
                  {budget.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparison View */}
      {comparedBudgets.length > 0 && (
        <Card>
          <CardHeader title="Budget Comparison" subtitle={`Comparing ${comparedBudgets.length} budgets`} />
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Metric
                    </th>
                    {comparedBudgets.map((budget) => (
                      <th
                        key={budget.id}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {budget.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Fiscal Year
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        FY {budget.fiscalYear}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Total Amount
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${budget.totalAmount.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Allocated
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${budget.allocatedAmount.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Remaining
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${budget.remainingAmount.toLocaleString()}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Utilization %
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {((budget.allocatedAmount / budget.totalAmount) * 100).toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Line Items
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {budget.lineItems.length}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Status
                    </td>
                    {comparedBudgets.map((budget) => (
                      <td key={budget.id} className="px-6 py-4 whitespace-nowrap text-sm">
                        <Badge variant="primary" size="sm">{budget.status}</Badge>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
