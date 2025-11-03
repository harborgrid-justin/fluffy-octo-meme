import React from 'react';
import { Card, CardHeader, CardContent, Badge } from '../ui';
import { Execution, ExecutionStatus } from '@/types';
import { format } from 'date-fns';

interface ExecutionTrackerProps {
  executions: Execution[];
  totalBudget: number;
}

export function ExecutionTracker({ executions, totalBudget }: ExecutionTrackerProps) {
  const totalExecuted = executions
    .filter(e => e.status === ExecutionStatus.COMPLETED)
    .reduce((sum, e) => sum + e.amount, 0);

  const pending = executions.filter(e => e.status === ExecutionStatus.PENDING);
  const approved = executions.filter(e => e.status === ExecutionStatus.APPROVED);
  const completed = executions.filter(e => e.status === ExecutionStatus.COMPLETED);

  const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

  const getStatusVariant = (status: ExecutionStatus) => {
    switch (status) {
      case ExecutionStatus.COMPLETED: return 'success';
      case ExecutionStatus.APPROVED: return 'info';
      case ExecutionStatus.PENDING: return 'warning';
      case ExecutionStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-sm text-gray-600">Total Budget</div>
          <div className="text-2xl font-bold text-gray-900">${totalBudget.toLocaleString()}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Executed</div>
          <div className="text-2xl font-bold text-green-600">${totalExecuted.toLocaleString()}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Remaining</div>
          <div className="text-2xl font-bold text-blue-600">
            ${(totalBudget - totalExecuted).toLocaleString()}
          </div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Execution Rate</div>
          <div className="text-2xl font-bold text-purple-600">{executionRate.toFixed(1)}%</div>
        </Card>
      </div>

      {/* Execution Progress */}
      <Card>
        <CardHeader title="Execution Progress" />
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{executionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    executionRate > 90 ? 'bg-red-500' :
                    executionRate > 75 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(executionRate, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{pending.length}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{approved.length}</div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completed.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution List */}
      <Card>
        <CardHeader
          title="Recent Executions"
          subtitle={`${executions.length} transactions`}
        />
        <CardContent>
          <div className="space-y-3">
            {executions.slice(0, 10).map((execution) => (
              <div key={execution.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{execution.description}</h4>
                    <p className="text-sm text-gray-600">
                      {format(new Date(execution.date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Badge variant={getStatusVariant(execution.status)}>
                    {execution.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Amount</div>
                    <div className="font-medium">${execution.amount.toLocaleString()}</div>
                  </div>
                  {execution.vendor && (
                    <div>
                      <div className="text-gray-600">Vendor</div>
                      <div className="font-medium">{execution.vendor}</div>
                    </div>
                  )}
                  {execution.invoiceNumber && (
                    <div>
                      <div className="text-gray-600">Invoice</div>
                      <div className="font-medium">{execution.invoiceNumber}</div>
                    </div>
                  )}
                  {execution.approvedBy && (
                    <div>
                      <div className="text-gray-600">Approved By</div>
                      <div className="font-medium">{execution.approvedBy}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {executions.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No executions recorded
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
