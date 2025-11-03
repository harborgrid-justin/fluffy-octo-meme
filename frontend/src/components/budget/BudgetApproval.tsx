import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Button, Badge } from '../ui';
import { Budget, Approval } from '@/types';
import { format } from 'date-fns';

interface BudgetApprovalProps {
  budget: Budget;
  currentUser: string;
  onApprove: (comments?: string) => void;
  onReject: (comments: string) => void;
  onRequestChanges: (comments: string) => void;
}

export function BudgetApproval({
  budget,
  currentUser,
  onApprove,
  onReject,
  onRequestChanges
}: BudgetApprovalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'changes' | null>(null);
  const [comments, setComments] = useState('');

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(comments || undefined);
    } else if (action === 'reject' && comments) {
      onReject(comments);
    } else if (action === 'changes' && comments) {
      onRequestChanges(comments);
    }

    setAction(null);
    setComments('');
  };

  const pendingApprovals = budget.approvals?.filter(a => a.status === 'pending') || [];
  const completedApprovals = budget.approvals?.filter(a => a.status !== 'pending') || [];

  return (
    <div className="space-y-6">
      {/* Budget Summary */}
      <Card>
        <CardHeader
          title={`Budget Approval: ${budget.name}`}
          subtitle={`FY ${budget.fiscalYear} • ${budget.organization}`}
        />
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-600">Total Budget</div>
              <div className="text-xl font-semibold">${budget.totalAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Allocated</div>
              <div className="text-xl font-semibold text-blue-600">${budget.allocatedAmount.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Line Items</div>
              <div className="text-xl font-semibold">{budget.lineItems.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <Badge variant="warning">{budget.status}</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Budget Line Items</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {budget.lineItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border rounded p-3 text-sm">
                  <div>
                    <div className="font-medium">{item.category}</div>
                    <div className="text-gray-600">{item.description}</div>
                  </div>
                  <div className="font-semibold">${item.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval History */}
      {completedApprovals.length > 0 && (
        <Card>
          <CardHeader title="Approval History" />
          <CardContent>
            <div className="space-y-3">
              {completedApprovals.map((approval) => (
                <div key={approval.id} className="border-l-4 pl-4 py-2" style={{
                  borderColor: approval.status === 'approved' ? '#10b981' : '#ef4444'
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{approval.approver}</div>
                    <Badge variant={approval.status === 'approved' ? 'success' : 'error'}>
                      {approval.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(approval.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                  {approval.comments && (
                    <div className="mt-2 text-sm bg-gray-50 rounded p-2">
                      {approval.comments}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approval Actions */}
      <Card>
        <CardHeader title="Your Approval" subtitle="Review and approve or reject this budget" />
        <CardContent>
          {!action ? (
            <div className="space-y-3">
              <p className="text-gray-700 mb-4">
                Please review the budget details above and choose an action:
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="success"
                  onClick={() => setAction('approve')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve Budget
                </Button>

                <Button
                  variant="warning"
                  onClick={() => setAction('changes')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Request Changes
                </Button>

                <Button
                  variant="error"
                  onClick={() => setAction('reject')}
                >
                  Reject Budget
                </Button>
              </div>

              {pendingApprovals.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                  <h5 className="font-medium text-blue-900 mb-2">Pending Approvals</h5>
                  <ul className="list-disc list-inside text-sm text-blue-800">
                    {pendingApprovals.map((approval) => (
                      <li key={approval.id}>{approval.approver}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">
                  {action === 'approve' && 'Approve Budget'}
                  {action === 'reject' && 'Reject Budget'}
                  {action === 'changes' && 'Request Changes'}
                </h4>
                <button
                  onClick={() => {
                    setAction(null);
                    setComments('');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments {action !== 'approve' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder={
                    action === 'approve'
                      ? 'Optional comments...'
                      : action === 'reject'
                      ? 'Please explain why you are rejecting this budget...'
                      : 'Please specify what changes are needed...'
                  }
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  required={action !== 'approve'}
                />
              </div>

              {action === 'approve' && (
                <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-800">
                  By approving, you confirm that you have reviewed the budget and approve the allocation of funds as specified.
                </div>
              )}

              {action === 'reject' && (
                <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
                  <strong>Warning:</strong> Rejecting this budget will return it to draft status. The submitter will need to make revisions and resubmit.
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setAction(null);
                    setComments('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={action === 'approve' ? 'success' : action === 'reject' ? 'error' : 'warning'}
                  onClick={handleSubmit}
                  disabled={action !== 'approve' && !comments}
                  className={
                    action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : action === 'reject'
                      ? ''
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }
                >
                  {action === 'approve' && 'Confirm Approval'}
                  {action === 'reject' && 'Confirm Rejection'}
                  {action === 'changes' && 'Submit Changes Request'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
