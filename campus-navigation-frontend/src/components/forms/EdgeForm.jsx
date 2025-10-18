// src/components/forms/EdgeForm.jsx
import React, { useState, useEffect } from "react";
import API from "../../lib/api";

/**
 * EdgeForm
 * Props:
 *  - initialValues: optional { _id, from, to, distance }
 *  - onSuccess: optional callback (receives created/updated edge)
 *  - onClose: optional callback to close modal
 */
export default function EdgeForm({ initialValues = null, onSuccess = null, onClose = null }) {
  const [nodes, setNodes] = useState([]);
  const [form, setForm] = useState({
    from: "",
    to: "",
    distance: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/nodes");
        setNodes(res.data.data || []);
      } catch (err) {
        console.error("Failed to load nodes for edge form", err);
      }
    })();
  }, []);

  useEffect(() => {
    if (initialValues) {
      setForm({
        from: initialValues.from?._id || initialValues.from || "",
        to: initialValues.to?._id || initialValues.to || "",
        distance: initialValues.distance ?? ""
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitCreate = async () => {
    const res = await API.post("/edges", {
      from: form.from,
      to: form.to,
      distance: parseFloat(form.distance),
    });
    return res.data.data;
  };

  const submitUpdate = async (id) => {
    const res = await API.put(`/edges/${id}`, {
      from: form.from,
      to: form.to,
      distance: parseFloat(form.distance),
    });
    return res.data.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.from || !form.to || !form.distance) {
      setError("Please fill all fields");
      return;
    }

    if (form.from === form.to) {
      setError("From and To nodes must be different");
      return;
    }

    try {
      setLoading(true);
      let edge;
      if (initialValues && initialValues._id) {
        edge = await submitUpdate(initialValues._id);
        setMessage("✅ Edge updated successfully");
      } else {
        edge = await submitCreate();
        setMessage("✅ Edge created successfully");
      }

      // dispatch update
      window.dispatchEvent(new CustomEvent("graphUpdated", { detail: { action: initialValues?._id ? "updateEdge" : "createEdge", edge } }));

      if (onSuccess) onSuccess(edge);
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save edge");
      console.error("EdgeForm error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{initialValues ? "Edit Edge" : "Add New Edge"}</h3>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">From Node</label>
        <select name="from" value={form.from} onChange={handleChange} className="w-full border rounded-lg p-2">
          <option value="">Select source</option>
          {nodes.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">To Node</label>
        <select name="to" value={form.to} onChange={handleChange} className="w-full border rounded-lg p-2">
          <option value="">Select destination</option>
          {nodes.map((n) => <option key={n._id} value={n._id}>{n.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Distance (meters)</label>
        <input type="number" name="distance" value={form.distance} onChange={handleChange} className="w-full border rounded-lg p-2" placeholder="100" />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={() => { if (onClose) onClose(); }} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-60">
          {loading ? (initialValues ? "Updating..." : "Creating...") : (initialValues ? "Update Edge" : "Create Edge")}
        </button>
      </div>
    </form>
  );
}
