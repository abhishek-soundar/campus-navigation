// src/lib/api.js
import axios from 'axios';

// Use VITE_API_BASE (set in Render / env) with sensible fallback
const base = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

const API = axios.create({
  baseURL: base
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
// src/lib/api.js
import axios from 'axios';

const envBase = import.meta.env?.VITE_API_BASE;

// If VITE_API_BASE is set (recommended) use that.
// Otherwise fall back to attempting same-origin /api (useful for local dev when backend is proxied).
const baseURL = envBase || `${window.location.origin}/api`;

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
    } else if (!error.response) {
      // Network or CORS error
      console.error("Network or CORS error:", error);
      alert("Network error. Could not reach backend API. Check backend URL / CORS settings.");
    }

    return Promise.reject(error);
  }
);

export default API;
