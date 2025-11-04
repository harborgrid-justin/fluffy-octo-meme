import React, { useState, useEffect } from 'react';
import {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  submitApplication,
  cancelApplication,
  getApplicationStatusHistory,
  addApplicationComment,
  getApplicationComments,
  getApplicationDisbursements,
} from '../services/api';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    applicationType: '',
  });

  const [formData, setFormData] = useState({
    applicationType: 'homeowners_assistance_program',
    applicantFirstName: '',
    applicantLastName: '',
    applicantEmail: '',
    applicantPhone: '',
    applicantAddress: '',
    militaryBranch: '',
    militaryRank: '',
    serviceNumber: '',
    baseClosureDate: '',
    affectedBase: '',
    propertyAddress: '',
    propertyPurchaseDate: '',
    propertyPurchasePrice: '',
    currentMortgageBalance: '',
    propertyAppraisedValue: '',
    propertySalePrice: '',
    propertySaleDate: '',
    lossCalculationType: 'market_value_decline',
    description: '',
    justification: '',
  });

  useEffect(() => {
    fetchApplications();
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

  const fetchApplicationDetails = async (id) => {
    try {
      const [appResponse, historyResponse, commentsResponse, disbursementsResponse] = await Promise.all([
        getApplication(id),
        getApplicationStatusHistory(id),
        getApplicationComments(id, false),
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        tenantId: 'default-tenant', // Would come from auth context
        propertyPurchasePrice: formData.propertyPurchasePrice ? parseFloat(formData.propertyPurchasePrice) : undefined,
        currentMortgageBalance: formData.currentMortgageBalance ? parseFloat(formData.currentMortgageBalance) : undefined,
        propertyAppraisedValue: formData.propertyAppraisedValue ? parseFloat(formData.propertyAppraisedValue) : undefined,
        propertySalePrice: formData.propertySalePrice ? parseFloat(formData.propertySalePrice) : undefined,
        propertyPurchaseDate: formData.propertyPurchaseDate || undefined,
        propertySaleDate: formData.propertySaleDate || undefined,
        baseClosureDate: formData.baseClosureDate || undefined,
      };

      await createApplication(dataToSubmit);
      setShowModal(false);
      resetForm();
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create application');
    }
  };

  const handleSubmitApplication = async (id) => {
    if (window.confirm('Are you sure you want to submit this application? You will not be able to edit it after submission.')) {
      try {
        await submitApplication(id);
        fetchApplications();
        if (selectedApplication && selectedApplication.id === id) {
          fetchApplicationDetails(id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to submit application');
      }
    }
  };

  const handleCancelApplication = async (id) => {
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (reason) {
      try {
        await cancelApplication(id, reason);
        fetchApplications();
        if (selectedApplication && selectedApplication.id === id) {
          fetchApplicationDetails(id);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to cancel application');
      }
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await addApplicationComment(selectedApplication.id, newComment, false);
      setNewComment('');
      const response = await getApplicationComments(selectedApplication.id, false);
      setComments(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const resetForm = () => {
    setFormData({
      applicationType: 'homeowners_assistance_program',
      applicantFirstName: '',
      applicantLastName: '',
      applicantEmail: '',
      applicantPhone: '',
      applicantAddress: '',
      militaryBranch: '',
      militaryRank: '',
      serviceNumber: '',
      baseClosureDate: '',
      affectedBase: '',
      propertyAddress: '',
      propertyPurchaseDate: '',
      propertyPurchasePrice: '',
      currentMortgageBalance: '',
      propertyAppraisedValue: '',
      propertySalePrice: '',
      propertySaleDate: '',
      lossCalculationType: 'market_value_decline',
      description: '',
      justification: '',
    });
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

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Benefit Applications</h1>
          <p className="page-description">
            Submit and track your benefit applications
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          New Application
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button className="btn-close" onClick={() => setError(null)}>×</button>
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
          <p>No applications found. Click "New Application" to get started.</p>
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
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
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
                  <td>
                    {app.approvedAmount ? formatCurrency(app.approvedAmount) : 
                     app.calculatedLoss ? formatCurrency(app.calculatedLoss) : '-'}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => fetchApplicationDetails(app.id)}
                    >
                      View
                    </button>
                    {app.status === 'draft' && (
                      <>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleSubmitApplication(app.id)}
                          style={{ marginLeft: '5px' }}
                        >
                          Submit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancelApplication(app.id)}
                          style={{ marginLeft: '5px' }}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Application Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Benefit Application</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <h3>Application Type</h3>
                <div className="form-group">
                  <label htmlFor="applicationType">Type of Benefit *</label>
                  <select
                    id="applicationType"
                    name="applicationType"
                    value={formData.applicationType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="homeowners_assistance_program">Homeowners Assistance Program (DoD HAP)</option>
                    <option value="disaster_assistance">Disaster Assistance</option>
                    <option value="veterans_benefits">Veterans Benefits</option>
                    <option value="housing_assistance">Housing Assistance</option>
                    <option value="financial_aid">Financial Aid</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <h3>Applicant Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="applicantFirstName">First Name *</label>
                    <input
                      type="text"
                      id="applicantFirstName"
                      name="applicantFirstName"
                      value={formData.applicantFirstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="applicantLastName">Last Name *</label>
                    <input
                      type="text"
                      id="applicantLastName"
                      name="applicantLastName"
                      value={formData.applicantLastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="applicantEmail">Email *</label>
                    <input
                      type="email"
                      id="applicantEmail"
                      name="applicantEmail"
                      value={formData.applicantEmail}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="applicantPhone">Phone</label>
                    <input
                      type="tel"
                      id="applicantPhone"
                      name="applicantPhone"
                      value={formData.applicantPhone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="applicantAddress">Address</label>
                  <textarea
                    id="applicantAddress"
                    name="applicantAddress"
                    value={formData.applicantAddress}
                    onChange={handleInputChange}
                    rows="2"
                  />
                </div>

                {formData.applicationType === 'homeowners_assistance_program' && (
                  <>
                    <h3>Military Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="militaryBranch">Branch</label>
                        <select
                          id="militaryBranch"
                          name="militaryBranch"
                          value={formData.militaryBranch}
                          onChange={handleInputChange}
                        >
                          <option value="">Select Branch</option>
                          <option value="Army">Army</option>
                          <option value="Navy">Navy</option>
                          <option value="Air Force">Air Force</option>
                          <option value="Marine Corps">Marine Corps</option>
                          <option value="Space Force">Space Force</option>
                          <option value="Coast Guard">Coast Guard</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="militaryRank">Rank</label>
                        <input
                          type="text"
                          id="militaryRank"
                          name="militaryRank"
                          value={formData.militaryRank}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="serviceNumber">Service Number</label>
                        <input
                          type="text"
                          id="serviceNumber"
                          name="serviceNumber"
                          value={formData.serviceNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="affectedBase">Affected Base</label>
                        <input
                          type="text"
                          id="affectedBase"
                          name="affectedBase"
                          value={formData.affectedBase}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="baseClosureDate">Base Closure Date</label>
                      <input
                        type="date"
                        id="baseClosureDate"
                        name="baseClosureDate"
                        value={formData.baseClosureDate}
                        onChange={handleInputChange}
                      />
                    </div>

                    <h3>Property Information</h3>
                    <div className="form-group">
                      <label htmlFor="propertyAddress">Property Address</label>
                      <textarea
                        id="propertyAddress"
                        name="propertyAddress"
                        value={formData.propertyAddress}
                        onChange={handleInputChange}
                        rows="2"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="propertyPurchaseDate">Purchase Date</label>
                        <input
                          type="date"
                          id="propertyPurchaseDate"
                          name="propertyPurchaseDate"
                          value={formData.propertyPurchaseDate}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="propertyPurchasePrice">Purchase Price</label>
                        <input
                          type="number"
                          id="propertyPurchasePrice"
                          name="propertyPurchasePrice"
                          value={formData.propertyPurchasePrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="currentMortgageBalance">Current Mortgage Balance</label>
                        <input
                          type="number"
                          id="currentMortgageBalance"
                          name="currentMortgageBalance"
                          value={formData.currentMortgageBalance}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="propertyAppraisedValue">Appraised Value</label>
                        <input
                          type="number"
                          id="propertyAppraisedValue"
                          name="propertyAppraisedValue"
                          value={formData.propertyAppraisedValue}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="propertySalePrice">Sale Price</label>
                        <input
                          type="number"
                          id="propertySalePrice"
                          name="propertySalePrice"
                          value={formData.propertySalePrice}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="propertySaleDate">Sale Date</label>
                        <input
                          type="date"
                          id="propertySaleDate"
                          name="propertySaleDate"
                          value={formData.propertySaleDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="lossCalculationType">Loss Calculation Type</label>
                      <select
                        id="lossCalculationType"
                        name="lossCalculationType"
                        value={formData.lossCalculationType}
                        onChange={handleInputChange}
                      >
                        <option value="market_value_decline">Market Value Decline</option>
                        <option value="forced_sale">Forced Sale</option>
                        <option value="relocation_costs">Relocation Costs</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}

                <h3>Additional Information</h3>
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Provide a brief description of your situation"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="justification">Justification</label>
                  <textarea
                    id="justification"
                    name="justification"
                    value={formData.justification}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Explain why you need this assistance"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      {showDetailsModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application {selectedApplication.applicationNumber}</h2>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>

            <div className="modal-body">
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
                    <div>
                      <strong>Base Closure Date:</strong> {formatDate(selectedApplication.baseClosureDate)}
                    </div>
                  </div>
                </div>
              )}

              {selectedApplication.propertyAddress && (
                <div className="details-section">
                  <h3>Property Information</h3>
                  <div className="details-grid">
                    <div>
                      <strong>Address:</strong> {selectedApplication.propertyAddress}
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
                  </div>
                </div>
              )}

              <div className="details-section">
                <h3>Financial Information</h3>
                <div className="details-grid">
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

              {selectedApplication.description && (
                <div className="details-section">
                  <h3>Description</h3>
                  <p>{selectedApplication.description}</p>
                </div>
              )}

              {selectedApplication.justification && (
                <div className="details-section">
                  <h3>Justification</h3>
                  <p>{selectedApplication.justification}</p>
                </div>
              )}

              {disbursements.length > 0 && (
                <div className="details-section">
                  <h3>Disbursements</h3>
                  <table className="details-table">
                    <thead>
                      <tr>
                        <th>Disbursement #</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {disbursements.map((disb) => (
                        <tr key={disb.id}>
                          <td>{disb.disbursementNumber}</td>
                          <td>{formatCurrency(disb.amount)}</td>
                          <td>{formatDate(disb.disbursementDate)}</td>
                          <td>{disb.paymentMethod}</td>
                          <td><span className="badge badge-success">{disb.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="details-section">
                <h3>Status History</h3>
                <div className="timeline">
                  {statusHistory.map((history) => (
                    <div key={history.id} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-title">
                          {history.fromStatus && `${history.fromStatus.replace(/_/g, ' ')} → `}
                          {history.toStatus.replace(/_/g, ' ')}
                        </div>
                        <div className="timeline-date">{formatDate(history.changedAt)}</div>
                        {history.reason && <div className="timeline-description">{history.reason}</div>}
                        {history.notes && <div className="timeline-notes">{history.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="details-section">
                <h3>Comments</h3>
                <div className="comments-section">
                  {comments.map((comment) => (
                    <div key={comment.id} className="comment">
                      <div className="comment-date">{formatDate(comment.createdAt)}</div>
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
                  <button className="btn btn-primary" onClick={handleAddComment}>
                    Add Comment
                  </button>
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

export default Applications;
