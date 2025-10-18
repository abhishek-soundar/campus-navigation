// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/global.css";
import { MapProvider } from "./context/MapContext";
import { Toaster } from "sonner"; // if using sonner toasts
import ErrorBoundary from "./components/common/ErrorBoundary"; // ✅ added

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary> {/* ✅ global crash handler */}
      <MapProvider>
        <App />
        <Toaster position="top-right" />
      </MapProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
