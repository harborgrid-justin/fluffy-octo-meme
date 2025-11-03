import React, { useState, useEffect } from 'react';
import { getBudgets, createBudget, updateBudget, deleteBudget, getFiscalYears } from '../services/api';

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: '',
    department: '',
    status: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    fiscalYear: '',
    department: '',
    amount: '',
    category: '',
    status: 'draft',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [budgetsRes, fiscalYearsRes] = await Promise.all([
        getBudgets(filters),
        getFiscalYears()
      ]);
      setBudgets(budgetsRes.data);
      setFiscalYears(fiscalYearsRes.data);
    } catch (error) {
      console.error('Error loading budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, formData);
      } else {
        await createBudget(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving budget:', error);
      alert('Error saving budget. Please try again.');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData(budget);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await deleteBudget(id);
        loadData();
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Error deleting budget. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      fiscalYear: '',
      department: '',
      amount: '',
      category: '',
      status: 'draft',
      description: ''
    });
    setEditingBudget(null);
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
        <h2>Budget Management</h2>
        <p className="page-subtitle">Plan and manage federal budgets across fiscal years</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Budget Allocations</h3>
          <button 
            className="btn-add" 
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + New Budget
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
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>
        </div>

        {budgets.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Fiscal Year</th>
                  <th>Department</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => (
                  <tr key={budget.id}>
                    <td><strong>{budget.title}</strong></td>
                    <td>{budget.fiscalYear}</td>
                    <td>{budget.department}</td>
                    <td>{formatCurrency(budget.amount)}</td>
                    <td>{budget.category}</td>
                    <td>
                      <span className={`status-badge status-${budget.status}`}>
                        {budget.status}
                      </span>
                    </td>
                    <td>{budget.createdBy}</td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        onClick={() => handleEdit(budget)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-danger" 
                        onClick={() => handleDelete(budget.id)}
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
            <h3>No Budgets Found</h3>
            <p>Create your first budget allocation to get started</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  <label>Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="Operations">Operations</option>
                    <option value="Personnel">Personnel</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Research">Research & Development</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter budget description and notes..."
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
                  {editingBudget ? 'Update Budget' : 'Create Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Budgets;
