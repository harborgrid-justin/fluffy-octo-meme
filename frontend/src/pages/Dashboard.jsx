import React, { useState, useEffect } from 'react';
import { getDashboardSummary, getBudgetByDepartment } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [departmentBudgets, setDepartmentBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [summaryRes, deptBudgetsRes] = await Promise.all([
        getDashboardSummary(),
        getBudgetByDepartment()
      ]);
      setSummary(summaryRes.data);
      setDepartmentBudgets(deptBudgetsRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p className="page-subtitle">Real-time insights into federal budget planning and execution</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Budget</div>
          <div className="stat-value">{formatCurrency(summary?.totalBudget || 0)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Programs</div>
          <div className="stat-value">{summary?.activePrograms || 0}</div>
          <div className="stat-change">of {summary?.totalPrograms || 0} total</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Budget Executed</div>
          <div className="stat-value">{formatCurrency(summary?.totalExecuted || 0)}</div>
          <div className="stat-change">
            {summary?.budgetUtilization || 0}% utilization
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">{summary?.pendingApprovals || 0}</div>
          <div className="stat-change">requiring action</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Budget by Department</h3>
        </div>

        {departmentBudgets.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Budget Allocation</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {departmentBudgets.map((dept, index) => {
                  const percentage = summary?.totalBudget > 0 
                    ? ((dept.amount / summary.totalBudget) * 100).toFixed(1)
                    : 0;
                  return (
                    <tr key={index}>
                      <td><strong>{dept.department}</strong></td>
                      <td>{formatCurrency(dept.amount)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#e1e7ec',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: '#005ea2',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                          <span style={{ fontWeight: 600, minWidth: '50px' }}>{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <h3>No Department Data Available</h3>
            <p>Start by creating budgets for different departments</p>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">System Status</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#ecf3ec', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#2e6f3e', fontWeight: 600 }}>System Status</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2e6f3e', marginTop: '0.5rem' }}>Operational</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#e7f6f8', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#2e6f8e', fontWeight: 600 }}>Departments</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2e6f8e', marginTop: '0.5rem' }}>{summary?.departments || 0}</div>
          </div>
          <div style={{ padding: '1rem', backgroundColor: '#fef0cd', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.875rem', color: '#936f38', fontWeight: 600 }}>Last Updated</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#936f38', marginTop: '0.5rem' }}>
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
