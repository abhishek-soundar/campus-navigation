import React, { useContext } from "react";
import LoginForm from "../components/auth/LoginForm";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Redirect user based on role after login
  if (user) {
    const target = user.role === "admin" ? "/dashboard" : "/user";
    navigate(target, { replace: true });
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ background: "linear-gradient(180deg,#07090b,#0b0f13)" }}
    >
      <div className="w-full max-w-md modal-surface shadow-soft p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-white">Campus Navigation</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in to continue
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
