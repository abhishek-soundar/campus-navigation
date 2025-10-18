import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { LogOut, Plus, RefreshCw, Search } from "lucide-react";
import MapView from "../components/map/MapView";
import Modal from "../components/common/Modal";
import NodeForm from "../components/forms/NodeForm";
import EdgeForm from "../components/forms/EdgeForm";
import HeatmapToggle from "../components/map/HeatmapToggle";
import API from "../lib/api";
import RouteDetails from "../components/map/RouteDetails";

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  // Modals
  const [openNodeModal, setOpenNodeModal] = useState(false);
  const [openEdgeModal, setOpenEdgeModal] = useState(false);
  const [editingNode, setEditingNode] = useState(null);

  // Data
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]); // ✅ new state for edges
  const [filter, setFilter] = useState("");
  const [heatEnabledLocal, setHeatEnabledLocal] = useState(false);

  // Route state
  const [routeResult, setRouteResult] = useState(null);
  const [routeCollapsed, setRouteCollapsed] = useState(false);

  const fetchNodes = async () => {
    try {
      const res = await API.get("/nodes");
      setNodes(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch nodes", err);
    }
  };

  // ✅ fetchEdges
  const fetchEdges = async () => {
    try {
      const res = await API.get("/edges");
      setEdges(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch edges", err);
    }
  };

  useEffect(() => {
    fetchNodes();
    fetchEdges();

    const onGraphUpdated = () => {
      fetchNodes();
      fetchEdges();
    };
    const onRouteFound = (e) => {
      setRouteResult(e?.detail?.result || null);
      setRouteCollapsed(false);
    };

    window.addEventListener("graphUpdated", onGraphUpdated);
    window.addEventListener("routeFound", onRouteFound);

    return () => {
      window.removeEventListener("graphUpdated", onGraphUpdated);
      window.removeEventListener("routeFound", onRouteFound);
    };
  }, []);

  const filteredNodes = nodes.filter(
    (n) =>
      !filter ||
      n?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      n?.type?.toLowerCase().includes(filter.toLowerCase())
  );

  const handleFindRouteClick = () => {
    setRouteResult(null);
    setRouteCollapsed(false);
    window.dispatchEvent(new CustomEvent("findRoute"));
  };

  const handleToggleHeat = (enabled) => {
    setHeatEnabledLocal(enabled);
    window.dispatchEvent(new CustomEvent("toggleHeat", { detail: { enabled } }));
  };

  // ✅ toggle edge block
  const handleBlockEdge = async (edgeId, blocked) => {
    try {
      await API.patch(`/edges/${edgeId}/block`, { blocked });
      fetchEdges();
      window.dispatchEvent(
        new CustomEvent("graphUpdated", { detail: { action: "blockEdge", id: edgeId } })
      );
    } catch (err) {
      console.error("Failed to toggle edge block", err);
      alert("Failed to toggle edge block");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col text-white"
      style={{ background: "linear-gradient(180deg,#07090b,#0b0f13)" }}
    >
      {/* HEADER */}
      <header className="flex justify-between items-center p-6 bg-transparent backdrop-blur-sm">
        <div>
          <h1 className="text-2xl font-bold">
            👋 Welcome, <span className="text-blue-400">{user?.name}</span>
          </h1>
          <div className="text-sm text-gray-400 mt-1">
            Role: <span className="font-medium text-gray-200">{user?.role}</span>
          </div>
        </div>

        {/* Logout at top-right */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT SIDEBAR */}
          <aside className="lg:col-span-1 space-y-6">
            <div
              className="p-6 rounded-lg shadow"
              style={{
                background: "#0f1720",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div className="font-medium text-gray-100 mb-3">Hello, {user?.name}</div>

              {user?.role === "admin" && (
                <div className="flex flex-col gap-2 mb-4">
                  <button
                    onClick={() => setOpenNodeModal(true)}
                    className="px-3 py-2 bg-blue-600 rounded text-white"
                  >
                    + Node
                  </button>
                  <button
                    onClick={() => setOpenEdgeModal(true)}
                    className="px-3 py-2 bg-indigo-600 rounded text-white"
                  >
                    + Edge
                  </button>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div
              className="p-4 rounded-lg shadow"
              style={{
                background: "#0f1720",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div className="text-sm text-gray-400 mb-2">Quick Stats</div>
              <div className="text-lg font-semibold text-gray-100">
                {nodes.length} nodes
              </div>
            </div>

            {/* ✅ EDGES LIST PANEL */}
            <div
              className="p-6 rounded-lg shadow space-y-3"
              style={{
                background: "#0f1720",
                border: "1px solid rgba(255,255,255,0.03)",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-100">Edges</h4>
                <button
                  onClick={fetchEdges}
                  title="Refresh edges"
                  aria-label="Refresh edges"
                  className="flex items-center gap-2 px-2 py-1 border rounded hover:bg-gray-800"
                  style={{ borderColor: "rgba(255,255,255,0.04)" }}
                >
                  <RefreshCw className="w-4 h-4 text-gray-300" />
                </button>
              </div>

              {edges.length === 0 ? (
                <p className="text-sm text-gray-400">No edges available</p>
              ) : (
                <ul className="space-y-3">
                  {edges.map((edge) => (
                    <li
                      key={edge._id}
                      className="p-3 rounded-lg border border-gray-800 hover:bg-gray-800 transition"
                    >
                      <div className="text-sm font-medium text-gray-100 mb-1">
                        {edge.from?.name || "Unknown"} → {edge.to?.name || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        {edge.distance || 0} meters •{" "}
                        {edge.blocked ? (
                          <span className="text-red-400">Blocked</span>
                        ) : (
                          <span className="text-green-400">Open</span>
                        )}
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleBlockEdge(edge._id, !edge.blocked)
                            }
                            className={`px-3 py-1 rounded text-white ${
                              edge.blocked
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            }`}
                          >
                            {edge.blocked ? "Unblock" : "Block"}
                          </button>
                          <button
                            onClick={() =>
                              alert(
                                `Edit Edge not implemented in this panel — use edge modal`
                              )
                            }
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* CENTER MAP */}
          <div className="lg:col-span-2">
            <MapView />
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-1 space-y-4">
            <div
              className="rounded-lg shadow overflow-hidden"
              style={{
                background: "#ffffff",
                color: "black",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: "rgba(0,0,0,0.06)" }}
              >
                <div className="text-sm font-semibold text-black">
                  Route Details
                </div>
                <button
                  onClick={() => setRouteCollapsed((s) => !s)}
                  className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                >
                  {routeCollapsed ? "Show" : "Hide"}
                </button>
              </div>
              {!routeCollapsed && (
                <div className="p-4">
                  <RouteDetails
                    result={routeResult}
                    onHoverStep={(step) =>
                      window.dispatchEvent(
                        new CustomEvent("highlightRouteStep", { detail: { step } })
                      )
                    }
                  />
                </div>
              )}
            </div>

            {/* Nodes List */}
            <div
              className="p-6 rounded-lg shadow"
              style={{
                background: "#0f1720",
                border: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-100">Nodes</h4>
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-2 border rounded px-2 py-1"
                    style={{
                      background: "#071021",
                      borderColor: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <Search className="w-4 h-4 text-gray-400" />
                    <input
                      aria-label="Search nodes"
                      className="w-44 bg-transparent text-sm outline-none text-gray-100 placeholder:text-gray-400"
                      placeholder="Search name or type"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={fetchNodes}
                    title="Refresh nodes"
                    aria-label="Refresh nodes"
                    className="flex items-center gap-2 px-2 py-1 border rounded hover:bg-gray-800"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <RefreshCw className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-400 mb-3">
                Showing{" "}
                <span className="font-medium text-gray-200">
                  {filteredNodes.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-gray-200">{nodes.length}</span>{" "}
                nodes
              </div>

              <ul className="space-y-3 max-h-[720px] overflow-auto nodes-list">
                {filteredNodes.map((node) => (
                  <li
                    key={node._id}
                    className="p-4 rounded-lg border hover:bg-gray-800 transition flex items-center justify-between"
                    style={{ borderColor: "rgba(255,255,255,0.03)" }}
                  >
                    <div>
                      <div className="font-medium text-gray-100">
                        {node.name}
                      </div>
                      <div className="text-xs text-gray-400">{node.type}</div>
                    </div>

                    {user?.role === "admin" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingNode(node)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            const ok = window.confirm(
                              `Delete node "${node.name}"?`
                            );
                            if (!ok) return;
                            try {
                              await API.delete(`/nodes/${node._id}`);
                              window.dispatchEvent(
                                new CustomEvent("graphUpdated", {
                                  detail: {
                                    action: "deleteNode",
                                    id: node._id,
                                  },
                                })
                              );
                            } catch (err) {
                              alert("Failed to delete node");
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <Modal open={openNodeModal} onClose={() => setOpenNodeModal(false)} title="Add Node">
        <NodeForm
          onClose={() => setOpenNodeModal(false)}
          onSuccess={() => setOpenNodeModal(false)}
        />
      </Modal>

      <Modal open={openEdgeModal} onClose={() => setOpenEdgeModal(false)} title="Create Edge">
        <EdgeForm
          onClose={() => setOpenEdgeModal(false)}
          onSuccess={() => setOpenEdgeModal(false)}
        />
      </Modal>

      {editingNode && (
        <Modal open={!!editingNode} onClose={() => setEditingNode(null)} title="Edit Node">
          <NodeForm
            initialValues={editingNode}
            onSuccess={() => {
              setEditingNode(null);
              fetchNodes();
            }}
            onClose={() => setEditingNode(null)}
          />
        </Modal>
      )}
    </div>
  );
}
