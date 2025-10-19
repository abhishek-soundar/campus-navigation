import React, { useState, useEffect } from "react";  // ✅ add useEffect
import { useNavigate, Link } from "react-router-dom";
import API from "../lib/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user", // default role
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ✅ Mark this device as visited so Register won't show again automatically
  useEffect(() => {
    try {
      localStorage.setItem("hasVisited", "1");
    } catch {}
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await API.post("/auth/register", form);
      setMessage("✅ Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/"), 1500); // redirect to login
    } catch (err) {
      console.error("Register error:", err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center text-white"
      style={{ background: "linear-gradient(180deg,#07090b,#0b0f13)" }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6 border border-gray-800"
      >
        <h2 className="text-2xl font-bold text-center text-blue-400">
          Create an Account
        </h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        {message && <p className="text-green-500 text-sm text-center">{message}</p>}

        <div>
          <label className="block text-sm mb-1 text-gray-300">Full Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg text-black focus:outline-none"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg text-black focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 rounded-lg text-black focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm mb-1 text-gray-300">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg text-black focus:outline-none"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium shadow transition disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="text-center text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/" className="text-blue-400 hover:underline">
            Login here
          </Link>
        </p>
      </form>
    </div>
  );
}
