// src/pages/UserPage.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import MapView from "../components/map/MapView";
import RouteDetails from "../components/map/RouteDetails";
import { LogOut } from "lucide-react";

export default function UserPage() {
  const { user, logout } = useContext(AuthContext);
  const [result, setResult] = useState(null);

  useEffect(() => {
    // Listen for MapView's 'routeFound' event and store latest result
    const onRouteFound = (ev) => {
      const r = ev?.detail?.result ?? null;
      setResult(r);
    };
    window.addEventListener("routeFound", onRouteFound);
    return () => window.removeEventListener("routeFound", onRouteFound);
  }, []);

  // Forward hover events from RouteDetails to the map so it can highlight segments
  const handleHoverStep = (step) => {
    window.dispatchEvent(new CustomEvent("highlightRouteStep", { detail: { step } }));
  };

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{ background: 'linear-gradient(180deg,#07090b,#0b0f13)' }}
    >
      {/* Simple header for normal users */}
      <header className="flex items-center justify-between p-6 bg-transparent backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold">
            🧭 Find your way, <span className="text-blue-400">{user?.name}</span>
          </h1>
          <div className="text-sm text-gray-400 mt-1">
            Role: <span className="font-medium text-gray-200">{user?.role || 'user'}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Responsive split: Map (main) + RouteDetails (side) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MapView />
            </div>

            <div>
              {/* Show RouteDetails (will show "No route selected" if result is null) */}
              <RouteDetails result={result} onHoverStep={handleHoverStep} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
