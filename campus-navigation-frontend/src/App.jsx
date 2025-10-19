import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/Register"; // ✅ added

import { AuthProvider, AuthContext } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext"; // ✅ import here
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserPage from "./pages/UserPage"; // ✅ added

function PrivateRoute({ children }) {
  const { user } = React.useContext(AuthContext);
  return user ? children : <Navigate to="/" replace />;
}

// ✅ NEW: Redirect logged-in users away from auth pages to their role-specific page
function RedirectIfAuthenticated({ children }) {
  const { user } = React.useContext(AuthContext);
  if (user) {
    const target = user.role === "admin" ? "/dashboard" : "/user";
    return <Navigate to={target} replace />;
  }
  return children;
}

/**
 * Return true if this device (browser) has not visited before.
 * We use a simple localStorage flag "hasVisited" to decide.
 */
function isFirstVisitOnThisDevice() {
  try {
    return !localStorage.getItem("hasVisited");
  } catch {
    return false;
  }
}

function AppRoutes() {
  return (
    <Routes>
      {/* Root: if first visit on this device -> show Register, otherwise show Login.
          Wrapped with RedirectIfAuthenticated so logged-in users are routed to their pages. */}
      <Route
        path="/"
        element={
          <RedirectIfAuthenticated>
            {isFirstVisitOnThisDevice() ? <Register /> : <Login />}
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthenticated>
            <Register />
          </RedirectIfAuthenticated>
        }
      /> {/* ✅ added */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/user"
        element={
          <PrivateRoute>
            <UserPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <MapProvider> {/* ✅ Wrap here */}
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </MapProvider>
    </AuthProvider>
  );
}

export default App;
