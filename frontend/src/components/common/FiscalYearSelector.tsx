import React from 'react';
import { Select, SelectOption } from '../ui';

interface FiscalYearSelectorProps {
  value: number;
  onChange: (year: number) => void;
  label?: string;
  startYear?: number;
  yearsAhead?: number;
  fullWidth?: boolean;
}

export function FiscalYearSelector({
  value,
  onChange,
  label = 'Fiscal Year',
  startYear = 2020,
  yearsAhead = 5,
  fullWidth = false
}: FiscalYearSelectorProps) {
  const currentYear = new Date().getFullYear();
  const endYear = currentYear + yearsAhead;

  const options: SelectOption[] = [];
  for (let year = startYear; year <= endYear; year++) {
    options.push({
      value: year.toString(),
      label: `FY ${year}`
    });
  }

  return (
    <Select
      label={label}
      value={value.toString()}
      onChange={(e) => onChange(parseInt(e.target.value))}
      options={options}
      fullWidth={fullWidth}
    />
  );
}
