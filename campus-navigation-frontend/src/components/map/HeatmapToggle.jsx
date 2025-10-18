// src/components/map/HeatmapToggle.jsx
import React from 'react';

export default function HeatmapToggle({ enabled, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-white mb-1">Heatmap</label>
      <button
        onClick={() => onToggle(!enabled)}
        className={`px-3 py-1 rounded-full font-medium transition ${
          enabled ? 'bg-red-500 text-white shadow' : 'bg-gray-200 text-gray-700'
        }`}
      >
        {enabled ? 'On' : 'Off'}
      </button>
    </div>
  );
}
