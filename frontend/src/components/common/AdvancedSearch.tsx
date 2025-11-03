import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Input, Select, Button } from '../ui';
import { SearchFilters } from '@/types';
import { FiscalYearSelector } from './FiscalYearSelector';

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onReset: () => void;
  showFiscalYear?: boolean;
  showOrganization?: boolean;
  showStatus?: boolean;
  showDateRange?: boolean;
  showAmountRange?: boolean;
  statusOptions?: { value: string; label: string }[];
}

export function AdvancedSearch({
  onSearch,
  onReset,
  showFiscalYear = true,
  showOrganization = true,
  showStatus = true,
  showDateRange = true,
  showAmountRange = true,
  statusOptions = []
}: AdvancedSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    fiscalYear: undefined,
    organization: '',
    status: [],
    dateFrom: '',
    dateTo: '',
    amountMin: undefined,
    amountMax: undefined
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      query: '',
      fiscalYear: undefined,
      organization: '',
      status: [],
      dateFrom: '',
      dateTo: '',
      amountMin: undefined,
      amountMax: undefined
    });
    onReset();
  };

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader
        title="Advanced Search"
        action={
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        }
      />

      <CardContent>
        {/* Basic Search */}
        <div className="mb-4">
          <Input
            placeholder="Search keywords..."
            value={filters.query || ''}
            onChange={(e) => updateFilter('query', e.target.value)}
            fullWidth
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {showFiscalYear && (
                <FiscalYearSelector
                  value={filters.fiscalYear || new Date().getFullYear()}
                  onChange={(year) => updateFilter('fiscalYear', year)}
                  fullWidth
                />
              )}

              {showOrganization && (
                <Input
                  label="Organization"
                  placeholder="Enter organization"
                  value={filters.organization || ''}
                  onChange={(e) => updateFilter('organization', e.target.value)}
                  fullWidth
                />
              )}

              {showStatus && statusOptions.length > 0 && (
                <Select
                  label="Status"
                  options={statusOptions}
                  value={filters.status?.[0] || ''}
                  onChange={(e) => updateFilter('status', e.target.value ? [e.target.value] : [])}
                  placeholder="Select status"
                  fullWidth
                />
              )}
            </div>

            {showDateRange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Date From"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  fullWidth
                />
                <Input
                  label="Date To"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                  fullWidth
                />
              </div>
            )}

            {showAmountRange && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Min Amount ($)"
                  type="number"
                  placeholder="0.00"
                  value={filters.amountMin || ''}
                  onChange={(e) => updateFilter('amountMin', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
                <Input
                  label="Max Amount ($)"
                  type="number"
                  placeholder="0.00"
                  value={filters.amountMax || ''}
                  onChange={(e) => updateFilter('amountMax', parseFloat(e.target.value) || undefined)}
                  fullWidth
                />
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="ghost" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleSearch}>
            Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
