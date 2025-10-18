// src/components/auth/LoginForm.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    const res = await login({ email: form.email, password: form.password });
    setLoading(false);

    if (!res.success) {
      setError(res.error || "Login failed");
      return;
    }

    // Success -> navigate to dashboard
    navigate("/dashboard", { replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <div className="text-sm text-red-700 bg-red-50 p-2 rounded">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-white-700 mb-1">Email</label>
        <input
          name="email"
          value={form.email}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white-700 mb-1">Password</label>
        <input
          name="password"
          type="password"
          value={form.password}
          onChange={onChange}
          className="w-full border rounded px-3 py-2"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </form>
  );
}
