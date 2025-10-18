// src/pages/Login.jsx
import React, { useEffect } from "react";
import LoginForm from "../components/auth/LoginForm";
import { useNavigate } from "react-router-dom";
import API from "../lib/api";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await API.get('/auth/first-run');
        if (!mounted) return;
        if (res?.data?.needsRegistration) {
          navigate('/register', { replace: true });
        }
      } catch (err) {
        // silently ignore network/errors: default to showing login
        console.warn('first-run check failed', err?.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'linear-gradient(180deg,#07090b,#0b0f13)' }}>
      <div className="w-full max-w-md modal-surface shadow-soft p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-white">Campus Navigation</h1>
          <p className="text-sm text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
