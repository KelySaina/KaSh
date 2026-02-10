import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: () => {
    window.location.href = `${API_BASE_URL}/auth/login`;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  me: () => api.get('/auth/me'),
};

// Accounts API
export const accountsAPI = {
  getAll: () => api.get('/api/accounts'),
  getById: (id) => api.get(`/api/accounts/${id}`),
  create: (data) => api.post('/api/accounts', data),
  update: (id, data) => api.put(`/api/accounts/${id}`, data),
  delete: (id) => api.delete(`/api/accounts/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/api/transactions', { params }),
  getById: (id) => api.get(`/api/transactions/${id}`),
  create: (data) => api.post('/api/transactions', data),
  update: (id, data) => api.put(`/api/transactions/${id}`, data),
  delete: (id) => api.delete(`/api/transactions/${id}`),
  getCategories: (type) => api.get('/api/transactions/categories/list', { params: { type } }),
  createCategory: (data) => api.post('/api/transactions/categories', data),
};

// Budgets API
export const budgetsAPI = {
  getAll: () => api.get('/api/budgets'),
  getById: (id) => api.get(`/api/budgets/${id}`),
  create: (data) => api.post('/api/budgets', data),
  update: (id, data) => api.put(`/api/budgets/${id}`, data),
  delete: (id) => api.delete(`/api/budgets/${id}`),
};

// Reports API
export const reportsAPI = {
  getSummary: (params) => api.get('/api/reports/summary', { params }),
  getSpendingByCategory: (params) => api.get('/api/reports/spending-by-category', { params }),
  getIncomeVsExpense: (params) => api.get('/api/reports/income-vs-expense', { params }),
  getBudgetProgress: (params) => api.get('/api/reports/budget-progress', { params }),
};

export default api;
