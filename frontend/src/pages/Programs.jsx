import React, { useState, useEffect } from 'react';
import { getPrograms, createProgram, updateProgram, deleteProgram, getFiscalYears } from '../services/api';

function Programs() {
  const [programs, setPrograms] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: '',
    status: '',
    department: ''
  });

  const [formData, setFormData] = useState({
    name: '',
    fiscalYear: '',
    department: '',
    budget: '',
    status: 'planning',
    priority: 'medium',
    startDate: '',
    endDate: '',
    objectives: '',
    milestones: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [programsRes, fiscalYearsRes] = await Promise.all([
        getPrograms(filters),
        getFiscalYears()
      ]);
      setPrograms(programsRes.data);
      setFiscalYears(fiscalYearsRes.data);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProgram) {
        await updateProgram(editingProgram.id, formData);
      } else {
        await createProgram(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving program:', error);
      alert('Error saving program. Please try again.');
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setFormData(program);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      try {
        await deleteProgram(id);
        loadData();
      } catch (error) {
        console.error('Error deleting program:', error);
        alert('Error deleting program. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      fiscalYear: '',
      department: '',
      budget: '',
      status: 'planning',
      priority: 'medium',
      startDate: '',
      endDate: '',
      objectives: '',
      milestones: ''
    });
    setEditingProgram(null);
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
        <h2>Program Planning</h2>
        <p className="page-subtitle">Define and manage federal programs and initiatives</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Programs</h3>
          <button 
            className="btn-add" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + New Program
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
            <label>Department</label>
            <select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">All Departments</option>
              <option value="Defense">Defense</option>
              <option value="Health">Health & Human Services</option>
              <option value="Education">Education</option>
              <option value="Transportation">Transportation</option>
              <option value="Veterans Affairs">Veterans Affairs</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {programs.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Program Name</th>
                  <th>Fiscal Year</th>
                  <th>Department</th>
                  <th>Budget</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((program) => (
                  <tr key={program.id}>
                    <td><strong>{program.name}</strong></td>
                    <td>{program.fiscalYear}</td>
                    <td>{program.department}</td>
                    <td>{formatCurrency(program.budget)}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: program.priority === 'high' ? '#e52207' : 
                               program.priority === 'medium' ? '#936f38' : '#5a6872'
                      }}>
                        {program.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-${program.status}`}>
                        {program.status}
                      </span>
                    </td>
                    <td>{program.createdBy}</td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleEdit(program)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => handleDelete(program.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Programs Found</h3>
            <p>Create your first program to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProgram ? 'Edit Program' : 'Create New Program'}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Program Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
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
                  <label>Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Defense">Defense</option>
                    <option value="Health">Health & Human Services</option>
                    <option value="Education">Education</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Veterans Affairs">Veterans Affairs</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Budget *</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Objectives</label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                  placeholder="Enter program objectives..."
                />
              </div>

              <div className="form-group">
                <label>Key Milestones</label>
                <textarea
                  value={formData.milestones}
                  onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                  placeholder="Enter key milestones..."
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
                  {editingProgram ? 'Update Program' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Programs;
