// src/components/map/RouteDetails.jsx
import React from 'react';

/**
 * Haversine formula (meters) between two { lat, lng } points.
 * Implemented carefully (step-by-step) to avoid arithmetic mistakes.
 */
function haversineMeters(a, b) {
  if (!a || !b) return 0;
  const toRad = (v) => (v * Math.PI) / 180;

  const R = 6371000; // Earth radius in meters
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const hav = sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  const d = R * c;

  return d;
}

/**
 * Sum pairwise distances along path array as fallback (rounded meters).
 */
function computePathDistanceMeters(path = []) {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i]?.coordinates;
    const b = path[i + 1]?.coordinates;
    if (a && b && typeof a.lat === 'number' && typeof a.lng === 'number' && typeof b.lat === 'number' && typeof b.lng === 'number') {
      total += haversineMeters({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng });
    }
  }
  return Math.round(total);
}

export default function RouteDetails({ result, onHoverStep }) {
  // No route
  if (!result || !Array.isArray(result.path) || result.path.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow" style={{ minWidth: 360 }}>
        <h3 className="text-lg font-semibold text-black">Route Details</h3>
        <p className="mt-2 text-sm text-gray-600">
          No route selected. Pick start and end and click <span className="font-medium">Find route</span>.
        </p>
      </div>
    );
  }

  // Prefer server-provided distance if valid number, otherwise compute fallback.
  const distanceMeters =
    typeof result.distance === 'number' && !Number.isNaN(result.distance)
      ? Math.round(result.distance)
      : computePathDistanceMeters(result.path);

  return (
    <div className="p-6 bg-white rounded-lg shadow space-y-4" style={{ minWidth: 360 }}>
      <h3 className="text-lg font-semibold text-black">Route Details</h3>

      <div>
        <p className="text-sm text-gray-500">Distance</p>
        <p className="text-xl font-bold text-black">{distanceMeters} meters</p>
      </div>

      <div>
        <p className="text-sm text-gray-500">Path</p>
        <ol className="list-decimal ml-5 text-sm text-gray-700">
          {result.path.map((n, i) => {
            const coords = n?.coordinates;
            const lat = coords?.lat;
            const lng = coords?.lng;
            return (
              <li
                key={n._id || `${n.name || 'node'}-${i}`}
                className="py-2 rounded hover:bg-gray-50 cursor-pointer"
                onMouseEnter={() => onHoverStep && onHoverStep(i)}
                onMouseLeave={() => onHoverStep && onHoverStep(null)}
                style={{ paddingLeft: '0.25rem', paddingRight: '0.25rem' }}
              >
                <div className="font-medium text-black">{n?.name || 'Unnamed'}</div>
                <div className="text-xs text-gray-500">
                  {n?.type || '—'}
                  {typeof lat === 'number' && typeof lng === 'number' ? ` • ${lat.toFixed(6)}, ${lng.toFixed(6)}` : ''}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
