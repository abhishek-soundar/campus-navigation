// src/components/map/MapView.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { useMapRefresh } from "../../context/MapContext";
import API from '../../lib/api';
import RouteDetails from './RouteDetails';
import HeatmapToggle from './HeatmapToggle';
import '../../styles/map.css';
import { AuthContext } from '../../context/AuthContext';
import Modal from "../common/Modal";
import EdgeForm from "../forms/EdgeForm";
import NodeForm from "../forms/NodeForm";

// import marker images...
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitBounds({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds || !bounds.length) return;
    const latlngs = bounds.map(b => [b.lat, b.lng]);
    map.fitBounds(latlngs, { padding: [40, 40] });
  }, [bounds, map]);
  return null;
}

export default function MapView() {
  const { user } = useContext(AuthContext);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [result, setResult] = useState(null);
  const [heatEnabled, setHeatEnabled] = useState(false);
  const heatLayerRef = useRef(null);
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [editingEdge, setEditingEdge] = useState(null);

  // addNodeCoords and hoveredStep kept unchanged
  const [addNodeCoords, setAddNodeCoords] = useState(null);
  const [hoveredStep, setHoveredStep] = useState(null);

  // Simulation state (dev-only). Toggle by dispatching window event 'toggleSimulation'
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const simIntervalRef = useRef(null);
  const heatAnimationFrameRef = useRef(null);
  const lastHeatBuildRef = useRef(0);

  // --- NEW: Geolocation / tracking state ---
  const [userPos, setUserPos] = useState(null); // { lat, lng, accuracy }
  const watchIdRef = useRef(null);
  const [following, setFollowing] = useState(true); // when true, auto-center on updates

  // --- NEW CONFIG: snapping thresholds (meters) ---
  const NODE_SNAP_THRESHOLD = 40;  // if within 40m, snap to node
  const EDGE_SNAP_THRESHOLD = 120; // if within 120m to edge projection, treat as on-path

  // --- Simple toast utility (non-blocking, unobtrusive) ---
  const showToast = (msg, type = 'info', ttl = 3000) => {
    try {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      const el = document.createElement('div');
      el.id = id;
      el.innerText = msg;
      el.style.position = 'fixed';
      el.style.top = '16px';
      el.style.right = '16px';
      el.style.zIndex = 999999;
      el.style.background = type === 'error' ? 'rgba(220,38,38,0.95)' : 'rgba(17,24,39,0.95)';
      el.style.color = '#fff';
      el.style.padding = '10px 14px';
      el.style.borderRadius = '8px';
      el.style.boxShadow = '0 6px 18px rgba(2,6,23,0.6)';
      el.style.fontSize = '14px';
      el.style.maxWidth = '320px';
      el.style.opacity = '0';
      el.style.transition = 'opacity 220ms ease, transform 220ms ease';
      el.style.transform = 'translateY(-6px)';
      document.body.appendChild(el);
      // show
      requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
      setTimeout(() => {
        // hide
        el.style.opacity = '0';
        el.style.transform = 'translateY(-6px)';
        setTimeout(() => {
          try { document.body.removeChild(el); } catch (e) { /* ignore */ }
        }, 250);
      }, ttl);
    } catch (err) {
      // fallback
      try { console.warn('Toast error', err); } catch {}
    }
  };

  const fetchGraph = async () => {
    try {
      const [{ data: nodesRes }, { data: edgesRes }] = await Promise.all([
        API.get('/nodes'),
        API.get('/edges'),
      ]);
      setNodes(nodesRes.data || []);
      setEdges(edgesRes.data || []);
    } catch (err) {
      console.error('Failed to fetch graph', err);
      showToast('Failed to load map data', 'error');
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  // listen for global graphUpdated to refetch
  useEffect(() => {
    const onGraphUpdated = (ev) => {
      fetchGraph();
    };
    window.addEventListener('graphUpdated', onGraphUpdated);
    return () => window.removeEventListener('graphUpdated', onGraphUpdated);
  }, []);

  // ------------------------------
  // NEW: accept control events from Dashboard sidebar
  // - setStart: { detail: { id } } OR { detail: { name } }
  // - setEnd: same
  // - findRoute: no detail
  // - toggleHeat: { detail: { enabled } }
  useEffect(() => {
    const findNodeById = (id) => nodes.find(n => n._id === id);
    const findNodeByName = (name) => nodes.find(n => n.name && n.name.toLowerCase() === String(name || '').toLowerCase());

    const handleSetStart = (ev) => {
      const { id, name } = ev.detail || {};
      if (id) {
        const node = findNodeById(id);
        if (node) setStart(node);
      } else if (name) {
        const node = findNodeByName(name);
        if (node) setStart(node);
      }
    };
    const handleSetEnd = (ev) => {
      const { id, name } = ev.detail || {};
      if (id) {
        const node = findNodeById(id);
        if (node) setEnd(node);
      } else if (name) {
        const node = findNodeByName(name);
        if (node) setEnd(node);
      }
    };
    const handleFindRouteEvent = () => {
      // call existing handler
      if (start && end) {
        // call same function used by UI (defined below)
        handleFindRoute();
      } else {
        // try to run anyway so UI shows missing selection alert
        handleFindRoute();
      }
    };
    const handleToggleHeat = (ev) => {
      const enabled = ev.detail?.enabled;
      if (typeof enabled === 'boolean') setHeatEnabled(enabled);
      else setHeatEnabled(prev => !prev);
    };

    window.addEventListener('setStart', handleSetStart);
    window.addEventListener('setEnd', handleSetEnd);
    window.addEventListener('findRoute', handleFindRouteEvent);
    window.addEventListener('toggleHeat', handleToggleHeat);

    // listen for simulation toggle dev event
    const handleToggleSim = (ev) => {
      // only toggle if in development (safety)
      if (process.env.NODE_ENV !== 'development') return;
      // if detail.enabled provided use it, else toggle
      const provided = ev?.detail?.enabled;
      if (typeof provided === 'boolean') setSimulationEnabled(provided);
      else setSimulationEnabled(prev => !prev);
    };
    window.addEventListener('toggleSimulation', handleToggleSim);

    return () => {
      window.removeEventListener('setStart', handleSetStart);
      window.removeEventListener('setEnd', handleSetEnd);
      window.removeEventListener('findRoute', handleFindRouteEvent);
      window.removeEventListener('toggleHeat', handleToggleHeat);
      window.removeEventListener('toggleSimulation', handleToggleSim);
    };
  }, [nodes, start, end]); // rerun when nodes change so name/ID matching works
  // ------------------------------

  // --- Helper: haversine (meters) ---
  function haversineMeters(a, b) {
    if (!a || !b) return Infinity;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000;
    const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
    const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
    const sinDLat = Math.sin(dLat / 2), sinDLon = Math.sin(dLon / 2);
    const hav = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
    return R * c;
  }

  // --- Helper: project P onto segment AB; return { lat, lng, t, dist } where t in [0,1] ---
  function projectPointToSegment(P, A, B) {
    // Use simple equirectangular projection relative to A lat for short distances (campus scale)
    const latRad = (A.lat + B.lat) * Math.PI / 360;
    const cosLat = Math.cos(latRad);
    const toXY = ({ lat, lng }) => ({ x: lng * cosLat, y: lat });
    const p = toXY(P), a = toXY(A), b = toXY(B);
    const abx = b.x - a.x, aby = b.y - a.y;
    const ab2 = abx * abx + aby * aby;
    let t = 0;
    if (ab2 > 0) t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / ab2;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const projX = a.x + abx * t;
    const projY = a.y + aby * t;
    const lng = projX / cosLat;
    const lat = projY;
    const projected = { lat, lng };
    const dist = haversineMeters(P, projected);
    return { lat, lng, t, dist };
  }

  // --- Helper: find nearest node (within nodeThreshold) or best projection onto edges (within edgeThreshold) ---
  function findNearestNodeOrEdge(nodesArr, edgesArr, point, nodeThreshold = NODE_SNAP_THRESHOLD, edgeThreshold = EDGE_SNAP_THRESHOLD) {
    // nearest node
    let bestNode = null;
    let bestNodeDist = Infinity;
    for (const n of nodesArr) {
      if (!n?.coordinates) continue;
      const d = haversineMeters(point, n.coordinates);
      if (d < bestNodeDist) { bestNodeDist = d; bestNode = n; }
    }
    if (bestNode && bestNodeDist <= nodeThreshold) {
      return { type: 'node', node: bestNode, distance: bestNodeDist };
    }

    // nearest projection onto edges
    let bestProj = null;
    for (const e of edgesArr) {
      const A = e.from?.coordinates;
      const B = e.to?.coordinates;
      if (!A || !B) continue;
      const proj = projectPointToSegment(point, A, B);
      if (!bestProj || proj.dist < bestProj.dist) {
        bestProj = { ...proj, edge: e, endpoints: [e.from, e.to] };
      }
    }
    if (bestProj && bestProj.dist <= edgeThreshold) {
      return { type: 'edge', projection: bestProj, distance: bestProj.dist };
    }

    return { type: 'none' };
  }

  // improved heatmap: time-varying and blocked-aware intensity
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // cleanup previous layer
    if (heatLayerRef.current) {
      heatLayerRef.current.remove();
      heatLayerRef.current = null;
    }

    // if not enabled, nothing to do
    if (!heatEnabled) return;

    // build heat points with improved formula
    const buildHeatPoints = () => {
      const now = Date.now();
      lastHeatBuildRef.current = now;
      const heatPoints = [];

      // Edges: midpoint intensity
      for (let i = 0; i < edges.length; i++) {
        const e = edges[i];
        const from = e.from?.coordinates;
        const to = e.to?.coordinates;
        if (!from || !to) continue;

        // base intensity inversely proportional to distance (shorter edges => higher intensity)
        // we compute base = clamp( k / distance , min, max )
        const k = 150; // tuning constant (smaller than previous to avoid oversaturation)
        const raw = k / (e.distance || 1); // avoid divide by zero
        const base = Math.max(0.05, Math.min(0.95, raw));

        // blocked edges are considered congested: multiply
        const blockedMultiplier = e.blocked ? 1.65 : 1.0;

        // subtle time-varying noise to animate: phase depends on index
        const phase = (now / 1000) + i * 0.37;
        const noise = 1 + Math.sin(phase) * 0.08; // +/- 8%

        // final intensity clamped to [0.05, 1.0]
        const intensity = Math.max(0.05, Math.min(1, base * blockedMultiplier * noise));

        const midLat = (from.lat + to.lat) / 2;
        const midLng = (from.lng + to.lng) / 2;
        heatPoints.push([midLat, midLng, intensity]);
      }

      // Nodes provide small background intensity
      for (let n of nodes) {
        if (n?.coordinates) heatPoints.push([n.coordinates.lat, n.coordinates.lng, 0.08]);
      }

      // remove existing and add fresh layer
      if (heatLayerRef.current) {
        heatLayerRef.current.remove();
        heatLayerRef.current = null;
      }
      heatLayerRef.current = L.heatLayer(heatPoints, { radius: 26, blur: 34 }).addTo(map);
    };

    // initial build
    buildHeatPoints();

    // If simulation is enabled, animate heatmap more frequently; otherwise update at a slower reasonable cadence
    // Use requestAnimationFrame-like loop but throttled to avoid heavy CPU use.
    let rafId = null;
    let lastTick = 0;

    const tick = () => {
      const now = Date.now();
      const dt = now - lastTick;
      // choose cadence: faster if simulation on (500ms), else 1500ms
      const cadence = simulationEnabled ? 600 : 1500;
      if (!lastTick || dt >= cadence) {
        buildHeatPoints();
        lastTick = now;
      }
      rafId = window.setTimeout(() => {
        requestAnimationFrame(tick);
      }, 60); // small delay to keep loop responsive but not tight
    };

    // start the tick loop
    tick();

    // also rebuild while nodes/edges change (depend on edges/nodes)
    // cleanup on effect end
    return () => {
      if (rafId) {
        clearTimeout(rafId);
        rafId = null;
      }
      if (heatLayerRef.current) {
        heatLayerRef.current.remove();
        heatLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [heatEnabled, edges, nodes, simulationEnabled]);

  const { refreshKey } = useMapRefresh();
  useEffect(() => {
    fetchGraph();
  }, [refreshKey]);

  // Simulation: randomly toggle edges (dev-only).
  // Controlled via simulationEnabled state. Uses same patch endpoint as admin block/unblock.
  useEffect(() => {
    // safety: only allow simulation in development environment
    if (process.env.NODE_ENV !== 'development') return;

    // clear existing if any
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }

    if (!simulationEnabled) return;

    // pick a cadence depending on whether heat is enabled (slower if heat disabled)
    const cadence = heatEnabled ? 1200 : 2000;

    simIntervalRef.current = setInterval(async () => {
      try {
        // choose a random edge with valid ids
        const valid = edges.filter(e => e && e._id && e.from && e.to);
        if (!valid.length) return;
        const idx = Math.floor(Math.random() * valid.length);
        const chosen = valid[idx];
        // toggle blocked status
        const newBlocked = !chosen.blocked;
        // fire the same API the UI uses
        await API.patch(`/edges/${chosen._id}/block`, { blocked: newBlocked });
        // optimistic: update local edges quickly by refetching graph
        await fetchGraph();
        // broadcast for other components
        window.dispatchEvent(new CustomEvent('graphUpdated', { detail: { action: 'simulate', id: chosen._id, blocked: newBlocked } }));
      } catch (err) {
        console.error('Simulation error:', err);
      }
    }, cadence);

    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
        simIntervalRef.current = null;
      }
    };
  }, [simulationEnabled, edges, heatEnabled]); // restart interval when dependencies change

  // ✅ Listen for hover events from RouteDetails (via Dashboard) to highlight a segment
  useEffect(() => {
    const onHighlight = (ev) => {
      const step = typeof ev?.detail?.step === 'number' ? ev.detail.step : null;
      setHoveredStep(step);
    };
    window.addEventListener('highlightRouteStep', onHighlight);
    return () => window.removeEventListener('highlightRouteStep', onHighlight);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // center fallback if nodes available
    if (nodes.length && !result) {
      const n = nodes[0];
      map.setView([n.coordinates.lat, n.coordinates.lng], 18);
    }
  }, [nodes, result]);

  // --- NEW: Geolocation handlers ---
  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation not available in this browser.', 'error');
      return;
    }
    if (watchIdRef.current != null) return; // already watching

    try {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setUserPos({ lat, lng, accuracy });
          if (following && mapRef.current) {
            try {
              mapRef.current.setView([lat, lng], mapRef.current.getZoom());
            } catch (err) { /* ignore */ }
          }
        },
        (err) => {
          console.error('Geolocation error:', err);
          if (err.code === 1) {
            // permission denied
            showToast('Location permission denied. Enable location to use tracking.', 'error');
          } else {
            // other errors
            showToast('Location error: ' + (err.message || 'unknown'), 'error');
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      watchIdRef.current = id;
      // if we start tracking, enable following by default
      setFollowing(true);
      showToast('Started location tracking', 'info', 1800);
    } catch (err) {
      console.error('Failed to start geolocation watch', err);
      showToast('Failed to start location tracking', 'error');
    }
  };

  const stopTracking = () => {
    if (watchIdRef.current != null && 'geolocation' in navigator) {
      try {
        navigator.geolocation.clearWatch(watchIdRef.current);
      } catch (err) {
        console.warn('clearWatch error', err);
      }
      watchIdRef.current = null;
    }
    // keep last-known position visible but disable auto-follow
    setFollowing(false);
    showToast('Stopped location tracking', 'info', 1200);
  };

  const centerToUser = () => {
    if (!userPos || !mapRef.current) {
      showToast('No known current location', 'error');
      return;
    }
    try {
      mapRef.current.setView([userPos.lat, userPos.lng], 18);
    } catch (err) {
      console.warn('Center error', err);
    }
  };

  // cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current != null && 'geolocation' in navigator) {
        try {
          navigator.geolocation.clearWatch(watchIdRef.current);
        } catch (err) {
          // ignore
        }
        watchIdRef.current = null;
      }
    };
  }, []);

  const handleFindRoute = async () => {
    // If start not explicitly selected but user position exists, try to snap to nearest node/edge.
    let effectiveStart = start;
    let usedCoords = null;

    if (!effectiveStart && userPos) {
      const choice = findNearestNodeOrEdge(nodes, edges, { lat: userPos.lat, lng: userPos.lng }, NODE_SNAP_THRESHOLD, EDGE_SNAP_THRESHOLD);
      if (choice.type === 'node') {
        effectiveStart = choice.node;
        setStart(choice.node); // update UI so the select shows the picked node
        showToast(`Using nearest node "${choice.node.name}" as start (~${Math.round(choice.distance)} m).`);
      } else if (choice.type === 'edge') {
        // instead of picking a fixed endpoint, prefer server-side routing from exact projected coordinates.
        usedCoords = { lat: choice.projection.lat, lng: choice.projection.lng, approxDist: Math.round(choice.distance) };
        showToast(`Using your location projected onto nearby path (~${usedCoords.approxDist} m).`);
      } else {
        // no nearby feature found — fall back to original missing-selection behavior
      }
    }

    if (!effectiveStart && !usedCoords) {
      showToast('Please select both start and end nodes', 'error');
      return;
    }
    if (!end) {
      showToast('Please select both start and end nodes', 'error');
      return;
    }

    setLoading(true);
    try {
      // If we have coordinates to use as start, call server with fromLat/fromLng
      let resp;
      if (usedCoords) {
        resp = await API.get('/path', { params: { fromLat: usedCoords.lat, fromLng: usedCoords.lng, to: end._id } });
      } else {
        resp = await API.get('/path', { params: { from: effectiveStart._id, to: end._id } });
      }
      setResult(resp.data.data);

      // dispatch routeFound so other UI (UserPage) can show RouteDetails
      window.dispatchEvent(new CustomEvent('routeFound', { detail: { result: resp.data.data } }));

      if (mapRef.current && resp.data.data && resp.data.data.path.length) {
        const bounds = resp.data.data.path.map(p => ({ lat: p.coordinates.lat, lng: p.coordinates.lng }));
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    } catch (err) {
      console.error('Find route error', err);
      showToast(err.response?.data?.error || 'No path found or server error', 'error');
      setResult(null);

      window.dispatchEvent(new CustomEvent('routeFound', { detail: { result: null } }));
    } finally {
      setLoading(false);
    }
  };

  const handleBlockEdge = async (edgeId, blocked) => {
    try {
      await API.patch(`/edges/${edgeId}/block`, { blocked });
      await fetchGraph();
      if (result) handleFindRoute();
    } catch (err) {
      console.error('Block error', err);
      showToast('Failed to toggle edge block: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  // helper to find node by id used in internal selects (kept for compatibility)
  const findNodeById = (id) => nodes.find(n => n._id === id);

  const edgeLines = edges
    .filter(e => !e.blocked && e?.from && e?.to && e.from.coordinates && e.to.coordinates)
    .map(e => {
      const a = e.from.coordinates;
      const b = e.to.coordinates;
      return {
        id: e._id,
        latlngs: [[a.lat, a.lng], [b.lat, b.lng]],
        distance: e.distance,
        blocked: e.blocked,
        raw: e
      };
    });

  const center = nodes.length ? [nodes[0].coordinates.lat, nodes[0].coordinates.lng] : [12.9716, 77.5946];

  return (
    <div className="grid grid-cols-1 gap-6">
      <div>
        <div className="mb-3 flex flex-wrap gap-3 items-center justify-between">
          {/* KEEP your original selects (they still work if used) */}
          <div className="flex gap-3 items-center">
            <div className="flex flex-col">
              <label className="text-sm text-white mb-1">Start</label>
              <select
                value={start?._id || ''}
                onChange={(e) => setStart(findNodeById(e.target.value))}
                className="p-2 border rounded-lg bg-white text-black"
              >
                <option value="">Select start</option>
                {nodes.map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-white mb-1">Destination</label>
              <select
                value={end?._id || ''}
                onChange={(e) => setEnd(findNodeById(e.target.value))}
                className="p-2 border rounded-lg bg-white text-black"
              >
                <option value="">Select destination</option>
                {nodes.map(n => <option key={n._id} value={n._id}>{n.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={handleFindRoute}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Finding...' : 'Find route'}
            </button>

            <HeatmapToggle enabled={heatEnabled} onToggle={setHeatEnabled} />

            {/* --- NEW: Location controls (non-intrusive) --- */}
            <div className="flex items-center gap-2 ml-2">
              {/* Track / Stop toggle */}
              {watchIdRef.current == null ? (
                <button
                  onClick={startTracking}
                  className="px-3 py-1 bg-sky-600 text-white rounded hover:bg-sky-700"
                  title="Start tracking your location"
                >
                  Track
                </button>
              ) : (
                <button
                  onClick={stopTracking}
                  className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-gray-300"
                  title="Stop tracking"
                >
                  Stop
                </button>
              )}

              {/* Follow toggle */}
              <button
                onClick={() => setFollowing(prev => !prev)}
                className={`px-2 py-1 rounded ${following ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-black'}`}
                title="Toggle follow (auto-center when tracking)"
              >
                {following ? 'Following' : 'Follow Off'}
              </button>

              {/* Center to current location */}
              <button
                onClick={centerToUser}
                className="px-2 py-1 bg-white text-black rounded hover:bg-gray-100"
                title="Center map to current location"
              >
                Center
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <MapContainer
          center={center}
          zoom={18}
          whenCreated={(mapInstance) => { mapRef.current = mapInstance; }}
          className="rounded-lg shadow"
          style={{ height: 760 }}
          onClick={(e) => {
            if (user?.role === "admin") {
              const { lat, lng } = e.latlng;
              setAddNodeCoords({ lat, lng });
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {edgeLines.map(line => (
            <Polyline key={line.id} positions={line.latlngs} pathOptions={{ color: '#9CA3AF', weight: 3, opacity: 0.9 }} />
          ))}

          {nodes.map(n => (
            <Marker key={n._id} position={[n.coordinates.lat, n.coordinates.lng]}>
              <Popup>
                <div className="min-w-[180px]" style={{ color: '#000' }}>
                  <div className="font-semibold">{n.name}</div>
                  <div className="text-xs text-gray-600">{n.type}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => { setStart(n); showToast(`Start set to ${n.name}`); }} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Start</button>
                    <button onClick={() => { setEnd(n); showToast(`Destination set to ${n.name}`); }} className="px-2 py-1 bg-green-600 text-white rounded text-sm">End</button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* --- NEW: user position marker (CircleMarker) --- */}
          {userPos && (
            <>
              <CircleMarker
                center={[userPos.lat, userPos.lng]}
                radius={8}
                pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.9 }}
              />
            </>
          )}

          {hoveredStep !== null && result?.path?.[hoveredStep] && result?.path?.[hoveredStep + 1] && (
            <Polyline
              positions={[
                [result.path[hoveredStep].coordinates.lat, result.path[hoveredStep].coordinates.lng],
                [result.path[hoveredStep + 1].coordinates.lat, result.path[hoveredStep + 1].coordinates.lng],
              ]}
              pathOptions={{ color: 'orange', weight: 8, opacity: 0.8 }}
            />
          )}

          {result && result.path && result.path.length > 0 && (
            <>
              <Polyline positions={result.path.map(n => [n.coordinates.lat, n.coordinates.lng])} pathOptions={{ color: '#2563EB', weight: 6, opacity: 0.95 }} />
              <FitBounds bounds={result.path.map(p => ({ lat: p.coordinates.lat, lng: p.coordinates.lng }))} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Right panel (edges etc.) kept as separate consumer in Dashboard — MapView still renders the edit edge modal */}
      <div>
        {editingEdge && (
          <Modal open={!!editingEdge} onClose={() => setEditingEdge(null)} title="Edit Edge">
            <EdgeForm
              initialValues={editingEdge}
              onSuccess={() => { setEditingEdge(null); fetchGraph(); }}
              onClose={() => setEditingEdge(null)}
            />
          </Modal>
        )}

        {addNodeCoords && (
          <Modal
            open={!!addNodeCoords}
            onClose={() => setAddNodeCoords(null)}
            title="Add Node at Selected Location"
          >
            <NodeForm
              initialValues={{
                name: "",
                type: "building",
                coordinates: addNodeCoords,
              }}
              onSuccess={() => {
                setAddNodeCoords(null);
                fetchGraph();
                window.dispatchEvent(new CustomEvent('graphUpdated', { detail: { action: 'createNode' } }));
              }}
              onClose={() => setAddNodeCoords(null)}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
