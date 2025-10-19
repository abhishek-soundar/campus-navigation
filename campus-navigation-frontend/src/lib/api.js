// src/lib/api.js
import axios from 'axios';

const env = import.meta.env ?? {};
const raw = env.VITE_API_BASE_URL || env.VITE_API_BASE || '';

// Normalize base: if env contains '/api' at end, keep it; otherwise append '/api'.
// If no env provided, fall back to same-origin /api.
let baseURL = '';
if (raw && typeof raw === 'string' && raw.length) {
  // remove trailing slash(es) then decide
  const trimmed = raw.replace(/\/+$/, '');
  baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
} else {
  baseURL = `${window.location.origin.replace(/\/+$/, '')}/api`;
}

const API = axios.create({
  baseURL
});

// Attach JWT token automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (no response) often means CORS or DNS / unreachable backend
    if (!error.response) {
      console.error('Network/CORS error or backend unreachable:', error);
      // lightweight user feedback (do not be too intrusive)
      // Keep alert for now (you can replace with toast later)
      alert('Network error: could not reach backend. Check backend URL and CORS configuration.');
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      console.warn('⚠️ Unauthorized or expired session. Logging out...');
      localStorage.clear();
      window.location.href = '/';
    } else if (status >= 500) {
      alert('⚠️ Server error. Please try again later.');
    } else if (status === 404) {
      console.warn('⚠️ Resource not found:', error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default API;
