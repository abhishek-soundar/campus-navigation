// src/components/map/SimulationToggle.jsx
import React from "react";

/**
 * Dev-only Simulation toggle.
 * Props:
 *  - enabled: boolean
 *  - onToggle: function(enabled:boolean)
 *
 * Renders a small pill toggle, but only active in development builds (safety).
 */
export default function SimulationToggle({ enabled, onToggle }) {
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-white mb-1">
        Simulation
      </label>

      {isDev ? (
        <button
          onClick={() => onToggle(!enabled)}
          className={`px-3 py-1 rounded-full font-medium transition ${
            enabled ? "bg-green-600 text-white shadow" : "bg-gray-200 text-gray-700"
          }`}
          aria-pressed={enabled}
          title="Toggle simulation (dev only)"
        >
          {enabled ? "On" : "Off"}
        </button>
      ) : (
        <div className="text-xs text-gray-400 italic">Dev only</div>
      )}
    </div>
  );
}
