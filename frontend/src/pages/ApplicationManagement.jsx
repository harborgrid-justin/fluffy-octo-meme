import React, { useState, useEffect } from 'react';
import {
  getApplications,
  getApplication,
  assignApplication,
  startReview,
  completeReview,
  approveApplication,
  rejectApplication,
  disburseFunds,
  closeApplication,
  getApplicationStatusHistory,
  addApplicationComment,
  getApplicationComments,
  getApplicationDisbursements,
  getApplicationSummary,
} from '../services/api';

const ApplicationManagement = () => {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: null });
  const [actionData, setActionData] = useState({});

  const [filters, setFilters] = useState({
    status: '',
    applicationType: '',
  });

  useEffect(() => {
    fetchApplications();
    fetchSummary();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await getApplications(filters);
      setApplications(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await getApplicationSummary();
      setSummary(response.data.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  const fetchApplicationDetails = async (id) => {
    try {
      const [appResponse, historyResponse, commentsResponse, disbursementsResponse] = await Promise.all([
        getApplication(id),
        getApplicationStatusHistory(id),
        getApplicationComments(id, true), // Include internal comments for staff
        getApplicationDisbursements(id),
      ]);

      setSelectedApplication(appResponse.data.data);
      setStatusHistory(historyResponse.data.data || []);
      setComments(commentsResponse.data.data || []);
      setDisbursements(disbursementsResponse.data.data || []);
      setShowDetailsModal(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch application details');
    }
  };

  const handleAssign = async (applicationId, assignedToId) => {
    try {
      await assignApplication(applicationId, assignedToId);
      fetchApplications();
      if (selectedApplication && selectedApplication.id === applicationId) {
        fetchApplicationDetails(applicationId);
      }
      setActionModal({ show: false, type: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign application');
    }
  };

  const handleStartReview = async (id) => {
    try {
      await startReview(id);
      fetchApplications();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start review');
    }
  };

  const handleCompleteReview = async (id, recommendApproval, notes) => {
    try {
      await completeReview(id, recommendApproval, notes);
      fetchApplications();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
      setActionModal({ show: false, type: null });
      setActionData({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete review');
    }
  };

  const handleApprove = async (id, approvedAmount, notes) => {
    try {
      await approveApplication(id, parseFloat(approvedAmount), notes);
      fetchApplications();
      fetchSummary();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
      setActionModal({ show: false, type: null });
      setActionData({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      await rejectApplication(id, reason);
      fetchApplications();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
      setActionModal({ show: false, type: null });
      setActionData({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject application');
    }
  };

  const handleDisburseFunds = async (id, amount, paymentMethod, transactionId) => {
    try {
      await disburseFunds(id, parseFloat(amount), paymentMethod, transactionId);
      fetchApplications();
      fetchSummary();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
      setActionModal({ show: false, type: null });
      setActionData({});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to disburse funds');
    }
  };

  const handleClose = async (id) => {
    try {
      await closeApplication(id);
      fetchApplications();
      if (selectedApplication && selectedApplication.id === id) {
        fetchApplicationDetails(id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to close application');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addApplicationComment(selectedApplication.id, newComment, isInternalComment);
      setNewComment('');
      setIsInternalComment(false);
      const response = await getApplicationComments(selectedApplication.id, true);
      setComments(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const openActionModal = (type, application) => {
    setActionModal({ show: true, type });
    setActionData({ applicationId: application.id, ...application });
  };

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      draft: 'badge-draft',
      submitted: 'badge-info',
      under_review: 'badge-warning',
      pending_approval: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      funded: 'badge-success',
      closed: 'badge-secondary',
      cancelled: 'badge-secondary',
    };
    return statusClasses[status] || 'badge-secondary';
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const getAvailableActions = (status) => {
    switch (status) {
      case 'submitted':
        return ['assign', 'start_review', 'reject'];
      case 'under_review':
        return ['complete_review', 'reject'];
      case 'pending_approval':
        return ['approve', 'reject'];
      case 'approved':
        return ['disburse'];
      case 'funded':
      case 'rejected':
        return ['close'];
      default:
        return [];
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Application Management</h1>
          <p className="page-description">
            Review, approve, and manage benefit applications
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn-close" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Applications</h3>
            <div className="summary-value">{summary.total}</div>
          </div>
          <div className="summary-card">
            <h3>Pending Review</h3>
            <div className="summary-value">
              {(summary.byStatus?.submitted || 0) + (summary.byStatus?.under_review || 0)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Pending Approval</h3>
            <div className="summary-value">{summary.byStatus?.pending_approval || 0}</div>
          </div>
          <div className="summary-card">
            <h3>Total Approved</h3>
            <div className="summary-value">{formatCurrency(summary.totalApprovedAmount)}</div>
          </div>
          <div className="summary-card">
            <h3>Total Funded</h3>
            <div className="summary-value">{formatCurrency(summary.totalFundedAmount)}</div>
          </div>
          <div className="summary-card">
            <h3>Avg Processing Time</h3>
            <div className="summary-value">{Math.round(summary.avgProcessingTime)} days</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label htmlFor="statusFilter">Status:</label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="funded">Funded</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="typeFilter">Type:</label>
          <select
            id="typeFilter"
            value={filters.applicationType}
            onChange={(e) => setFilters({ ...filters, applicationType: e.target.value })}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="homeowners_assistance_program">Homeowners Assistance Program</option>
            <option value="disaster_assistance">Disaster Assistance</option>
            <option value="veterans_benefits">Veterans Benefits</option>
            <option value="housing_assistance">Housing Assistance</option>
            <option value="financial_aid">Financial Aid</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="loading">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <p>No applications found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application #</th>
                <th>Type</th>
                <th>Applicant</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Calc. Loss</th>
                <th>Approved</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                const actions = getAvailableActions(app.status);
                return (
                  <tr key={app.id}>
                    <td>{app.applicationNumber}</td>
                    <td>{app.applicationType.replace(/_/g, ' ')}</td>
                    <td>{app.applicantFirstName} {app.applicantLastName}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(app.status)}`}>
                        {app.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{formatDate(app.submittedAt)}</td>
                    <td>{formatCurrency(app.calculatedLoss)}</td>
                    <td>{formatCurrency(app.approvedAmount)}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => fetchApplicationDetails(app.id)}
                      >
                        View
                      </button>
                      {actions.includes('assign') && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openActionModal('assign', app)}
                          style={{ marginLeft: '5px' }}
                        >
                          Assign
                        </button>
                      )}
                      {actions.includes('start_review') && (
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleStartReview(app.id)}
                          style={{ marginLeft: '5px' }}
                        >
                          Start Review
                        </button>
                      )}
                      {actions.includes('complete_review') && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openActionModal('complete_review', app)}
                          style={{ marginLeft: '5px' }}
                        >
                          Complete Review
                        </button>
                      )}
                      {actions.includes('approve') && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openActionModal('approve', app)}
                          style={{ marginLeft: '5px' }}
                        >
                          Approve
                        </button>
                      )}
                      {actions.includes('reject') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => openActionModal('reject', app)}
                          style={{ marginLeft: '5px' }}
                        >
                          Reject
                        </button>
                      )}
                      {actions.includes('disburse') && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => openActionModal('disburse', app)}
                          style={{ marginLeft: '5px' }}
                        >
                          Disburse Funds
                        </button>
                      )}
                      {actions.includes('close') && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleClose(app.id)}
                          style={{ marginLeft: '5px' }}
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Action Modals */}
      {actionModal.show && (
        <div className="modal-overlay" onClick={() => setActionModal({ show: false, type: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {actionModal.type === 'assign' && 'Assign Application'}
                {actionModal.type === 'complete_review' && 'Complete Review'}
                {actionModal.type === 'approve' && 'Approve Application'}
                {actionModal.type === 'reject' && 'Reject Application'}
                {actionModal.type === 'disburse' && 'Disburse Funds'}
              </h2>
              <button className="btn-close" onClick={() => setActionModal({ show: false, type: null })}>×</button>
            </div>

            <div className="modal-body">
              {actionModal.type === 'assign' && (
                <div className="form-group">
                  <label htmlFor="assignTo">Assign to User ID:</label>
                  <input
                    type="text"
                    id="assignTo"
                    value={actionData.assignTo || ''}
                    onChange={(e) => setActionData({ ...actionData, assignTo: e.target.value })}
                    placeholder="Enter user ID"
                  />
                </div>
              )}

              {actionModal.type === 'complete_review' && (
                <>
                  <div className="form-group">
                    <label>Recommendation:</label>
                    <div className="radio-group">
                      <label>
                        <input
                          type="radio"
                          name="recommendation"
                          value="approve"
                          onChange={() => setActionData({ ...actionData, recommendApproval: true })}
                        />
                        Recommend Approval
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="recommendation"
                          value="reject"
                          onChange={() => setActionData({ ...actionData, recommendApproval: false })}
                        />
                        Recommend Rejection
                      </label>
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="reviewNotes">Notes:</label>
                    <textarea
                      id="reviewNotes"
                      value={actionData.notes || ''}
                      onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                      rows="4"
                    />
                  </div>
                </>
              )}

              {actionModal.type === 'approve' && (
                <>
                  <div className="form-group">
                    <label htmlFor="approvedAmount">Approved Amount:</label>
                    <input
                      type="number"
                      id="approvedAmount"
                      value={actionData.approvedAmount || actionData.calculatedLoss || ''}
                      onChange={(e) => setActionData({ ...actionData, approvedAmount: e.target.value })}
                      step="0.01"
                      min="0"
                    />
                    <small>Calculated Loss: {formatCurrency(actionData.calculatedLoss)}</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="approvalNotes">Notes (optional):</label>
                    <textarea
                      id="approvalNotes"
                      value={actionData.notes || ''}
                      onChange={(e) => setActionData({ ...actionData, notes: e.target.value })}
                      rows="3"
                    />
                  </div>
                </>
              )}

              {actionModal.type === 'reject' && (
                <div className="form-group">
                  <label htmlFor="rejectReason">Rejection Reason:</label>
                  <textarea
                    id="rejectReason"
                    value={actionData.reason || ''}
                    onChange={(e) => setActionData({ ...actionData, reason: e.target.value })}
                    rows="4"
                    required
                  />
                </div>
              )}

              {actionModal.type === 'disburse' && (
                <>
                  <div className="form-group">
                    <label htmlFor="disbursementAmount">Amount:</label>
                    <input
                      type="number"
                      id="disbursementAmount"
                      value={actionData.disbursementAmount || actionData.approvedAmount || ''}
                      onChange={(e) => setActionData({ ...actionData, disbursementAmount: e.target.value })}
                      step="0.01"
                      min="0"
                      max={actionData.approvedAmount}
                    />
                    <small>Approved Amount: {formatCurrency(actionData.approvedAmount)}</small>
                  </div>
                  <div className="form-group">
                    <label htmlFor="paymentMethod">Payment Method:</label>
                    <select
                      id="paymentMethod"
                      value={actionData.paymentMethod || 'direct_deposit'}
                      onChange={(e) => setActionData({ ...actionData, paymentMethod: e.target.value })}
                    >
                      <option value="direct_deposit">Direct Deposit</option>
                      <option value="check">Check</option>
                      <option value="wire_transfer">Wire Transfer</option>
                      <option value="eft">EFT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="transactionId">Transaction ID (optional):</label>
                    <input
                      type="text"
                      id="transactionId"
                      value={actionData.transactionId || ''}
                      onChange={(e) => setActionData({ ...actionData, transactionId: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setActionModal({ show: false, type: null });
                  setActionData({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  const { applicationId } = actionData;
                  if (actionModal.type === 'assign') {
                    handleAssign(applicationId, actionData.assignTo);
                  } else if (actionModal.type === 'complete_review') {
                    handleCompleteReview(applicationId, actionData.recommendApproval, actionData.notes);
                  } else if (actionModal.type === 'approve') {
                    handleApprove(applicationId, actionData.approvedAmount, actionData.notes);
                  } else if (actionModal.type === 'reject') {
                    handleReject(applicationId, actionData.reason);
                  } else if (actionModal.type === 'disburse') {
                    handleDisburseFunds(
                      applicationId,
                      actionData.disbursementAmount,
                      actionData.paymentMethod,
                      actionData.transactionId
                    );
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal (similar to Applications.jsx but with internal comments) */}
      {showDetailsModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application {selectedApplication.applicationNumber}</h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Similar structure to Applications.jsx details view */}
              <div className="details-section">
                <h3>Status</h3>
                <p>
                  <span className={`badge ${getStatusBadgeClass(selectedApplication.status)}`}>
                    {selectedApplication.status.replace(/_/g, ' ')}
                  </span>
                </p>
              </div>

              <div className="details-section">
                <h3>Applicant Information</h3>
                <div className="details-grid">
                  <div>
                    <strong>Name:</strong> {selectedApplication.applicantFirstName} {selectedApplication.applicantLastName}
                  </div>
                  <div>
                    <strong>Email:</strong> {selectedApplication.applicantEmail}
                  </div>
                  <div>
                    <strong>Phone:</strong> {selectedApplication.applicantPhone || '-'}
                  </div>
                  <div>
                    <strong>Address:</strong> {selectedApplication.applicantAddress || '-'}
                  </div>
                </div>
              </div>

              {selectedApplication.militaryBranch && (
                <div className="details-section">
                  <h3>Military Information</h3>
                  <div className="details-grid">
                    <div>
                      <strong>Branch:</strong> {selectedApplication.militaryBranch}
                    </div>
                    <div>
                      <strong>Rank:</strong> {selectedApplication.militaryRank || '-'}
                    </div>
                    <div>
                      <strong>Service Number:</strong> {selectedApplication.serviceNumber || '-'}
                    </div>
                    <div>
                      <strong>Affected Base:</strong> {selectedApplication.affectedBase || '-'}
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.propertyAddress && (
                <div className="details-section">
                  <h3>Property & Financial Information</h3>
                  <div className="details-grid">
                    <div>
                      <strong>Property Address:</strong> {selectedApplication.propertyAddress}
                    </div>
                    <div>
                      <strong>Purchase Price:</strong> {formatCurrency(selectedApplication.propertyPurchasePrice)}
                    </div>
                    <div>
                      <strong>Mortgage Balance:</strong> {formatCurrency(selectedApplication.currentMortgageBalance)}
                    </div>
                    <div>
                      <strong>Appraised Value:</strong> {formatCurrency(selectedApplication.propertyAppraisedValue)}
                    </div>
                    <div>
                      <strong>Sale Price:</strong> {formatCurrency(selectedApplication.propertySalePrice)}
                    </div>
                    <div>
                      <strong>Calculated Loss:</strong> {formatCurrency(selectedApplication.calculatedLoss)}
                    </div>
                    <div>
                      <strong>Approved Amount:</strong> {formatCurrency(selectedApplication.approvedAmount)}
                    </div>
                    <div>
                      <strong>Funded Amount:</strong> {formatCurrency(selectedApplication.fundedAmount)}
                    </div>
                  </div>
                </div>
              )}

              <div className="details-section">
                <h3>Comments</h3>
                <div className="comments-section">
                  {comments.map((comment) => (
                    <div key={comment.id} className={`comment ${comment.isInternal ? 'internal-comment' : ''}`}>
                      <div className="comment-header">
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                        {comment.isInternal && <span className="badge badge-warning">Internal</span>}
                      </div>
                      <div className="comment-text">{comment.comment}</div>
                    </div>
                  ))}
                </div>
                <div className="comment-form">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows="3"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <label>
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                      />
                      {' '}Internal Comment (staff only)
                    </label>
                    <button className="btn btn-primary" onClick={handleAddComment}>
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationManagement;
