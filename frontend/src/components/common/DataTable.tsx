import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardContent, Input, Button } from '../ui';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  subtitle?: string;
  searchable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  actions?: React.ReactNode;
}

type SortDirection = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  searchable = true,
  pageSize = 10,
  onRowClick,
  actions
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    return data.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    const columnKey = column.key as string;

    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getValue = (row: T, key: keyof T | string): any => {
    if (typeof key === 'string' && key.includes('.')) {
      // Support nested properties like "user.name"
      return key.split('.').reduce((obj, prop) => obj?.[prop], row);
    }
    return row[key as keyof T];
  };

  return (
    <Card>
      {(title || actions) && (
        <CardHeader title={title || ''} subtitle={subtitle} action={actions} />
      )}

      <CardContent>
        {searchable && (
          <div className="mb-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              fullWidth
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.header}</span>
                      {column.sortable && (
                        <span className="text-gray-400">
                          {sortColumn === column.key && sortDirection === 'asc' && '↑'}
                          {sortColumn === column.key && sortDirection === 'desc' && '↓'}
                          {sortColumn !== column.key && '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.length > 0 ? (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column, colIndex) => {
                      const value = getValue(row, column.key);
                      return (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {column.render ? column.render(value, row) : value}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    No data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first, last, current, and adjacent pages
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 py-1 text-gray-400">...</span>
                    )}
                    <Button
                      size="sm"
                      variant={currentPage === page ? 'primary' : 'ghost'}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  </React.Fragment>
                ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
