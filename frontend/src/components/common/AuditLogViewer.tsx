import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Badge, Input } from '../ui';
import { AuditLog } from '@/types';
import { format } from 'date-fns';

interface AuditLogViewerProps {
  logs: AuditLog[];
  pageSize?: number;
}

export function AuditLogViewer({ logs, pageSize = 20 }: AuditLogViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const actions = Array.from(new Set(logs.map(log => log.action)));

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      searchTerm === '' ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterAction === 'all' || log.action === filterAction;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'success';
    if (action.includes('update') || action.includes('edit')) return 'info';
    if (action.includes('delete') || action.includes('remove')) return 'error';
    if (action.includes('approve')) return 'success';
    if (action.includes('reject')) return 'error';
    return 'default';
  };

  return (
    <Card>
      <CardHeader
        title="Audit Log"
        subtitle={`${filteredLogs.length} records`}
      />

      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input
            placeholder="Search logs..."
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

          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterAction}
            onChange={(e) => {
              setFilterAction(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {paginatedLogs.map((log) => (
            <div key={log.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <Badge variant={getActionColor(log.action) as any}>
                    {log.action}
                  </Badge>
                  <div>
                    <div className="font-medium text-gray-900">{log.userName}</div>
                    <div className="text-xs text-gray-500">{log.userId}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Entity Type:</span>
                  <span className="ml-2 font-medium">{log.entityType}</span>
                </div>
                <div>
                  <span className="text-gray-600">Entity ID:</span>
                  <span className="ml-2 font-medium">{log.entityId}</span>
                </div>
                {log.ipAddress && (
                  <div>
                    <span className="text-gray-600">IP Address:</span>
                    <span className="ml-2 font-medium">{log.ipAddress}</span>
                  </div>
                )}
              </div>

              {log.changes && Object.keys(log.changes).length > 0 && (
                <details className="mt-3 pt-3 border-t">
                  <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                    View Changes
                  </summary>
                  <div className="mt-2 bg-gray-50 rounded p-3">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(log.changes, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          ))}

          {paginatedLogs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No audit logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * pageSize) + 1} to{' '}
              {Math.min(currentPage * pageSize, filteredLogs.length)} of{' '}
              {filteredLogs.length} records
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
