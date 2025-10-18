// src/lib/api.js
import axios from 'axios';

// ✅ Dynamically use environment variable (works for dev + prod)
const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : 'http://localhost:3000/api';

const API = axios.create({ baseURL });

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

// ✅ Add response interceptor to handle global errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      console.warn("⚠️ Unauthorized or expired session. Logging out...");
      localStorage.clear();
      window.location.href = "/";
    } else if (status >= 500) {
      alert("⚠️ Server error. Please try again later.");
    } else if (status === 404) {
      console.warn("⚠️ Resource not found:", error.config?.url);
    }

    return Promise.reject(error);
  }
);

export default API;
