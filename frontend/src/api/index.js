import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to admin requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nora_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public product endpoints
export const getProducts = (category) =>
  api.get('/products', { params: category && category !== 'All' ? { category } : {} });

export const getFeaturedProducts = () => api.get('/products/featured');

export const getCategories = () => api.get('/products/categories');

export const getProduct = (id) => api.get(`/products/${id}`);

// Admin endpoints
export const adminLogin = (email, password) =>
  api.post('/admin/login', { email, password });

export const getDashboard = () => api.get('/admin/dashboard');

export const getAdminProducts = () => api.get('/admin/products');

export const getAdminProduct = (id) => api.get(`/admin/products/${id}`);

export const createProduct = (formData) =>
  api.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const updateProduct = (id, formData) =>
  api.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

export const toggleAvailability = (id, available) =>
  api.patch(`/admin/products/${id}/availability`, { available });

export const deleteProduct = (id) => api.delete(`/admin/products/${id}`);

export const changePassword = (currentPassword, newPassword) =>
  api.post('/admin/change-password', { currentPassword, newPassword });


export default api;
