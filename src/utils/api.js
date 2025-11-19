import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  getCurrentUser: () => api.get('/auth/me'),
  completeRegistration: (token, flatNumber) => 
    api.post('/auth/complete-registration', { token, flatNumber }),
  logout: () => api.post('/auth/logout')
};

export const productAPI = {
  getAllProducts: () => api.get('/api/products'),
  getProduct: (id) => api.get(`/api/products/${id}`)
};

export const orderAPI = {
  createOrder: (orderData) => api.post('/api/orders', orderData),
  getOrderHistory: () => api.get('/api/orders/history'),
  getOrder: (id) => api.get(`/api/orders/${id}`)
};

export default api;
