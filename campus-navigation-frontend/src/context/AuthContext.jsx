// src/context/AuthContext.jsx
import React, { createContext, useEffect, useState } from "react";
import API from "../lib/api";

export const AuthContext = createContext({
  user: null,
  login: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // Ensure axios uses token on startup if present
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      API.defaults.headers = API.defaults.headers || {};
      API.defaults.headers.Authorization = `Bearer ${token}`;
    }
  }, []);

  /**
   * login({ email, password })
   * returns { success: true, user } or { success: false, error }
   * Does NOT perform navigation — caller should navigate (useNavigate in LoginForm)
   */
  const login = async ({ email, password }) => {
    try {
      const res = await API.post("/auth/login", { email, password });
      const data = res?.data;

      if (!data || !data.token) {
        return { success: false, error: data?.error || "Invalid server response" };
      }

      // Persist token + user
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user || {}));
      setUser(data.user || {});

      // Ensure axios default header is set immediately
      API.defaults.headers = API.defaults.headers || {};
      API.defaults.headers.Authorization = `Bearer ${data.token}`;

      return { success: true, user: data.user };
    } catch (err) {
      console.error("Auth login error:", err);
      const message = err?.response?.data?.error || err?.message || "Login failed";
      return { success: false, error: message };
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(null);
      if (API.defaults && API.defaults.headers) delete API.defaults.headers.Authorization;
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
