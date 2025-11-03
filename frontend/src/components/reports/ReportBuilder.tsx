import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Input, Select, Badge } from '../ui';
import { ReportConfig, ReportColumn } from '@/types';

interface ReportBuilderProps {
  onGenerateReport: (config: ReportConfig) => void;
  onSaveReport: (config: ReportConfig) => void;
}

const AVAILABLE_FIELDS = [
  { value: 'name', label: 'Name', format: undefined },
  { value: 'fiscalYear', label: 'Fiscal Year', format: 'number' },
  { value: 'totalAmount', label: 'Total Amount', format: 'currency' },
  { value: 'allocatedAmount', label: 'Allocated Amount', format: 'currency' },
  { value: 'remainingAmount', label: 'Remaining Amount', format: 'currency' },
  { value: 'status', label: 'Status', format: undefined },
  { value: 'createdAt', label: 'Created Date', format: 'date' },
  { value: 'updatedAt', label: 'Updated Date', format: 'date' },
  { value: 'organization', label: 'Organization', format: undefined },
];

const AGGREGATE_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'count', label: 'Count' },
];

export function ReportBuilder({ onGenerateReport, onSaveReport }: ReportBuilderProps) {
  const [config, setConfig] = useState<ReportConfig>({
    id: '',
    name: '',
    type: 'budget',
    filters: {},
    columns: [],
    groupBy: undefined,
    sortBy: undefined,
    sortOrder: 'asc'
  });

  const [selectedField, setSelectedField] = useState('');

  const addColumn = () => {
    if (!selectedField) return;

    const field = AVAILABLE_FIELDS.find(f => f.value === selectedField);
    if (!field) return;

    const newColumn: ReportColumn = {
      field: field.value,
      header: field.label,
      format: field.format as any,
      aggregate: undefined
    };

    setConfig({
      ...config,
      columns: [...config.columns, newColumn]
    });

    setSelectedField('');
  };

  const removeColumn = (index: number) => {
    setConfig({
      ...config,
      columns: config.columns.filter((_, i) => i !== index)
    });
  };

  const updateColumn = (index: number, updates: Partial<ReportColumn>) => {
    const newColumns = [...config.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    setConfig({ ...config, columns: newColumns });
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === config.columns.length - 1)
    ) {
      return;
    }

    const newColumns = [...config.columns];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newColumns[index], newColumns[newIndex]] = [newColumns[newIndex], newColumns[index]];
    setConfig({ ...config, columns: newColumns });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Report Configuration" subtitle="Configure your custom report" />
        <CardContent>
          <div className="space-y-4">
            <Input
              label="Report Name"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              placeholder="e.g., FY2025 Budget Summary"
              fullWidth
              required
            />

            <Select
              label="Report Type"
              value={config.type}
              onChange={(e) => setConfig({ ...config, type: e.target.value as any })}
              options={[
                { value: 'budget', label: 'Budget Report' },
                { value: 'execution', label: 'Execution Report' },
                { value: 'program', label: 'Program Report' },
                { value: 'custom', label: 'Custom Report' },
              ]}
              fullWidth
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Report Columns" subtitle="Select and configure columns" />
        <CardContent>
          {/* Add Column */}
          <div className="flex space-x-3 mb-6">
            <Select
              placeholder="Select field to add"
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              options={AVAILABLE_FIELDS.filter(
                f => !config.columns.find(c => c.field === f.value)
              )}
              fullWidth
            />
            <Button onClick={addColumn} disabled={!selectedField}>
              Add Column
            </Button>
          </div>

          {/* Columns List */}
          {config.columns.length > 0 ? (
            <div className="space-y-3">
              {config.columns.map((column, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => moveColumn(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          ▲
                        </button>
                        <button
                          onClick={() => moveColumn(index, 'down')}
                          disabled={index === config.columns.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          ▼
                        </button>
                      </div>
                      <div>
                        <h4 className="font-semibold">{column.header}</h4>
                        <p className="text-sm text-gray-600">{column.field}</p>
                      </div>
                      {column.format && (
                        <Badge size="sm" variant="info">{column.format}</Badge>
                      )}
                    </div>
                    <button
                      onClick={() => removeColumn(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label="Column Header"
                      value={column.header}
                      onChange={(e) => updateColumn(index, { header: e.target.value })}
                      fullWidth
                    />
                    <Input
                      label="Width (optional)"
                      type="number"
                      value={column.width || ''}
                      onChange={(e) => updateColumn(index, { width: parseInt(e.target.value) || undefined })}
                      placeholder="Auto"
                      fullWidth
                    />
                    <Select
                      label="Aggregate"
                      value={column.aggregate || ''}
                      onChange={(e) => updateColumn(index, { aggregate: e.target.value as any || undefined })}
                      options={AGGREGATE_OPTIONS}
                      fullWidth
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No columns added yet. Select fields above to build your report.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="Sorting & Grouping" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Group By"
              value={config.groupBy || ''}
              onChange={(e) => setConfig({ ...config, groupBy: e.target.value || undefined })}
              options={[
                { value: '', label: 'None' },
                ...config.columns.map(c => ({ value: c.field, label: c.header }))
              ]}
              fullWidth
            />

            <Select
              label="Sort By"
              value={config.sortBy || ''}
              onChange={(e) => setConfig({ ...config, sortBy: e.target.value || undefined })}
              options={[
                { value: '', label: 'None' },
                ...config.columns.map(c => ({ value: c.field, label: c.header }))
              ]}
              fullWidth
            />

            <Select
              label="Sort Order"
              value={config.sortOrder || 'asc'}
              onChange={(e) => setConfig({ ...config, sortOrder: e.target.value as any })}
              options={[
                { value: 'asc', label: 'Ascending' },
                { value: 'desc', label: 'Descending' }
              ]}
              fullWidth
              disabled={!config.sortBy}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="ghost"
          onClick={() => onSaveReport(config)}
          disabled={!config.name || config.columns.length === 0}
        >
          Save Configuration
        </Button>
        <Button
          onClick={() => onGenerateReport(config)}
          disabled={!config.name || config.columns.length === 0}
        >
          Generate Report
        </Button>
      </div>
    </div>
  );
}
