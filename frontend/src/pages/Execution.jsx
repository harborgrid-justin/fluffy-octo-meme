import React, { useState, useEffect } from 'react';
import { getExecutionRecords, createExecutionRecord, updateExecutionRecord, getPrograms, getFiscalYears } from '../services/api';

function Execution() {
  const [executionRecords, setExecutionRecords] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: '',
    programId: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    programId: '',
    fiscalYear: '',
    amountSpent: '',
    status: 'on-track',
    executionDate: '',
    description: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [executionRes, programsRes, fiscalYearsRes] = await Promise.all([
        getExecutionRecords(filters),
        getPrograms(),
        getFiscalYears()
      ]);
      setExecutionRecords(executionRes.data);
      setPrograms(programsRes.data);
      setFiscalYears(fiscalYearsRes.data);
    } catch (error) {
      console.error('Error loading execution data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecord) {
        await updateExecutionRecord(editingRecord.id, formData);
      } else {
        await createExecutionRecord(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving execution record:', error);
      alert('Error saving execution record. Please try again.');
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      programId: '',
      fiscalYear: '',
      amountSpent: '',
      status: 'on-track',
      executionDate: '',
      description: '',
      notes: ''
    });
    setEditingRecord(null);
  };

  const getProgramName = (programId) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.name : 'Unknown Program';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Execution Tracking</h2>
        <p className="page-subtitle">Monitor and track program execution and spending</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Execution Records</h3>
          <button 
            className="btn-add" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + New Record
          </button>
        </div>

        <div className="filters">
          <div className="filter-group">
            <label>Fiscal Year</label>
            <select
              value={filters.fiscalYear}
              onChange={(e) => setFilters({ ...filters, fiscalYear: e.target.value })}
            >
              <option value="">All Years</option>
              {fiscalYears.map(fy => (
                <option key={fy.id} value={fy.year}>{fy.year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Program</label>
            <select
              value={filters.programId}
              onChange={(e) => setFilters({ ...filters, programId: e.target.value })}
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>{program.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {executionRecords.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Program</th>
                  <th>Fiscal Year</th>
                  <th>Amount Spent</th>
                  <th>Status</th>
                  <th>Execution Date</th>
                  <th>Description</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {executionRecords.map((record) => (
                  <tr key={record.id}>
                    <td><strong>{getProgramName(record.programId)}</strong></td>
                    <td>{record.fiscalYear}</td>
                    <td>{formatCurrency(record.amountSpent)}</td>
                    <td>
                      <span className={`status-badge status-${record.status}`} style={{
                        backgroundColor: 
                          record.status === 'on-track' ? '#ecf3ec' :
                          record.status === 'at-risk' ? '#fef0cd' :
                          record.status === 'delayed' ? '#f4e3db' :
                          '#e1e7ec',
                        color:
                          record.status === 'on-track' ? '#2e6f3e' :
                          record.status === 'at-risk' ? '#936f38' :
                          record.status === 'delayed' ? '#c3112a' :
                          '#5a6872'
                      }}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.executionDate ? new Date(record.executionDate).toLocaleDateString() : '-'}</td>
                    <td>{record.description}</td>
                    <td>{record.createdBy}</td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleEdit(record)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Execution Records Found</h3>
            <p>Create your first execution record to track program spending</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingRecord ? 'Edit Execution Record' : 'Create New Execution Record'}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Program *</label>
                <select
                  value={formData.programId}
                  onChange={(e) => setFormData({ ...formData, programId: e.target.value })}
                  required
                >
                  <option value="">Select Program</option>
                  {programs.map(program => (
                    <option key={program.id} value={program.id}>{program.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fiscal Year *</label>
                  <select
                    value={formData.fiscalYear}
                    onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                    required
                  >
                    <option value="">Select Year</option>
                    {fiscalYears.map(fy => (
                      <option key={fy.id} value={fy.year}>{fy.year}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount Spent *</label>
                  <input
                    type="number"
                    value={formData.amountSpent}
                    onChange={(e) => setFormData({ ...formData, amountSpent: e.target.value })}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="on-track">On Track</option>
                    <option value="at-risk">At Risk</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Execution Date</label>
                  <input
                    type="date"
                    value={formData.executionDate}
                    onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter execution description..."
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Enter additional notes..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRecord ? 'Update Record' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Execution;
