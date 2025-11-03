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

export default api;
