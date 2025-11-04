import axios from 'axios';

const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication
export const login = (username, password) => 
  api.post('/auth/login', { username, password });

export const register = (userData) => 
  api.post('/auth/register', userData);

// Budgets
export const getBudgets = (params) => 
  api.get('/budgets', { params });

export const getBudget = (id) => 
  api.get(`/budgets/${id}`);

export const createBudget = (data) => 
  api.post('/budgets', data);

export const updateBudget = (id, data) => 
  api.put(`/budgets/${id}`, data);

export const deleteBudget = (id) => 
  api.delete(`/budgets/${id}`);

// Programs
export const getPrograms = (params) => 
  api.get('/programs', { params });

export const getProgram = (id) => 
  api.get(`/programs/${id}`);

export const createProgram = (data) => 
  api.post('/programs', data);

export const updateProgram = (id, data) => 
  api.put(`/programs/${id}`, data);

export const deleteProgram = (id) => 
  api.delete(`/programs/${id}`);

// Execution
export const getExecutionRecords = (params) => 
  api.get('/execution', { params });

export const getExecutionRecord = (id) => 
  api.get(`/execution/${id}`);

export const createExecutionRecord = (data) => 
  api.post('/execution', data);

export const updateExecutionRecord = (id, data) => 
  api.put(`/execution/${id}`, data);

// Dashboard
export const getDashboardSummary = () => 
  api.get('/dashboard/summary');

export const getBudgetByDepartment = () => 
  api.get('/dashboard/budget-by-department');

export const getExecutionTimeline = () => 
  api.get('/dashboard/execution-timeline');

// Fiscal Years
export const getFiscalYears = () => 
  api.get('/fiscal-years');

// Applications
export const getApplications = (params) => 
  api.get('/applications', { params });

export const getApplication = (id) => 
  api.get(`/applications/${id}`);

export const createApplication = (data) => 
  api.post('/applications', data);

export const updateApplication = (id, data) => 
  api.put(`/applications/${id}`, data);

export const submitApplication = (id) => 
  api.post(`/applications/${id}/submit`);

export const assignApplication = (id, assignedToId) => 
  api.post(`/applications/${id}/assign`, { assignedToId });

export const startReview = (id) => 
  api.post(`/applications/${id}/start-review`);

export const completeReview = (id, recommendApproval, notes) => 
  api.post(`/applications/${id}/complete-review`, { recommendApproval, notes });

export const approveApplication = (id, approvedAmount, notes) => 
  api.post(`/applications/${id}/approve`, { approvedAmount, notes });

export const rejectApplication = (id, reason) => 
  api.post(`/applications/${id}/reject`, { reason });

export const disburseFunds = (id, amount, paymentMethod, transactionId) => 
  api.post(`/applications/${id}/disburse-funds`, { amount, paymentMethod, transactionId });

export const closeApplication = (id) => 
  api.post(`/applications/${id}/close`);

export const cancelApplication = (id, reason) => 
  api.post(`/applications/${id}/cancel`, { reason });

export const getApplicationStatusHistory = (id) => 
  api.get(`/applications/${id}/status-history`);

export const addApplicationComment = (id, comment, isInternal) => 
  api.post(`/applications/${id}/comments`, { comment, isInternal });

export const getApplicationComments = (id, includeInternal) => 
  api.get(`/applications/${id}/comments`, { params: { includeInternal } });

export const getApplicationDisbursements = (id) => 
  api.get(`/applications/${id}/disbursements`);

export const getApplicationSummary = (params) => 
  api.get('/applications/summary', { params });

export default api;
