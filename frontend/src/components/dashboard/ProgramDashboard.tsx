import React from 'react';
import { Card, CardHeader, CardContent, Badge } from '../ui';
import { Program, ProgramStatus } from '@/types';

interface ProgramDashboardProps {
  programs: Program[];
  onProgramClick?: (program: Program) => void;
}

export function ProgramDashboard({ programs, onProgramClick }: ProgramDashboardProps) {
  const totalBudget = programs.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = programs.reduce((sum, p) => sum + p.spent, 0);
  const activePrograms = programs.filter(p => p.status === ProgramStatus.ACTIVE).length;

  const getStatusVariant = (status: ProgramStatus) => {
    switch (status) {
      case ProgramStatus.ACTIVE: return 'success';
      case ProgramStatus.PLANNING: return 'info';
      case ProgramStatus.ON_HOLD: return 'warning';
      case ProgramStatus.COMPLETED: return 'default';
      case ProgramStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="text-sm text-gray-600">Total Programs</div>
          <div className="text-3xl font-bold text-gray-900">{programs.length}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Active Programs</div>
          <div className="text-3xl font-bold text-green-600">{activePrograms}</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Total Budget</div>
          <div className="text-3xl font-bold text-blue-600">${(totalBudget / 1000000).toFixed(1)}M</div>
        </Card>

        <Card padding="md">
          <div className="text-sm text-gray-600">Budget Utilization</div>
          <div className="text-3xl font-bold text-purple-600">
            {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}%
          </div>
        </Card>
      </div>

      {/* Programs List */}
      <Card>
        <CardHeader title="Programs Overview" subtitle={`${programs.length} total programs`} />
        <CardContent>
          <div className="space-y-4">
            {programs.map((program) => {
              const budgetUtilization = program.budget > 0 ? (program.spent / program.budget) * 100 : 0;
              const remaining = program.budget - program.spent;

              return (
                <div
                  key={program.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onProgramClick?.(program)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{program.name}</h3>
                      <p className="text-sm text-gray-600">{program.code}</p>
                    </div>
                    <Badge variant={getStatusVariant(program.status)}>
                      {program.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{program.description}</p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-gray-600">Manager</div>
                      <div className="font-medium">{program.manager}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Budget</div>
                      <div className="font-medium">${program.budget.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Spent</div>
                      <div className="font-medium">${program.spent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Remaining</div>
                      <div className="font-medium">${remaining.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Budget Utilization Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Budget Utilization</span>
                      <span>{budgetUtilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          budgetUtilization > 90 ? 'bg-red-500' :
                          budgetUtilization > 75 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(budgetUtilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones */}
                  {program.milestones && program.milestones.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600 mb-2">Milestones</div>
                      <div className="flex flex-wrap gap-2">
                        {program.milestones.slice(0, 3).map((milestone) => (
                          <Badge key={milestone.id} size="sm" variant={
                            milestone.status === 'completed' ? 'success' :
                            milestone.status === 'delayed' ? 'error' :
                            'default'
                          }>
                            {milestone.name}
                          </Badge>
                        ))}
                        {program.milestones.length > 3 && (
                          <Badge size="sm" variant="default">
                            +{program.milestones.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {programs.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p>No programs found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
