// src/components/forms/NodeForm.jsx
import React, { useState, useEffect } from "react";
import API from "../../lib/api";

/**
 * NodeForm
 * Props:
 *  - initialValues: optional object { name, type, coordinates: { lat, lng } }
 *  - onSuccess: optional callback called after successful create/update (receives created/updated node)
 *  - onClose: optional callback to close modal
 */
export default function NodeForm({ initialValues = null, onSuccess = null, onClose = null }) {
  const [form, setForm] = useState({
    name: "",
    type: "building",
    lat: "",
    lng: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (initialValues) {
      setForm({
        name: initialValues.name || "",
        type: initialValues.type || "building",
        lat: initialValues.coordinates?.lat ?? "",
        lng: initialValues.coordinates?.lng ?? "",
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitCreate = async () => {
    const res = await API.post("/nodes", {
      name: form.name,
      type: form.type,
      coordinates: {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      },
    });
    return res.data.data;
  };

  const submitUpdate = async (id) => {
    const res = await API.put(`/nodes/${id}`, {
      name: form.name,
      type: form.type,
      coordinates: {
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      },
    });
    return res.data.data;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage("");
    if (!form.name || !form.lat || !form.lng) {
      setError("Please fill all required fields");
      return;
    }

    try {
      setLoading(true);
      let node;
      if (initialValues && initialValues._id) {
        node = await submitUpdate(initialValues._id);
        setMessage(`✅ Node '${node.name}' updated successfully`);
      } else {
        node = await submitCreate();
        setMessage(`✅ Node '${node.name}' created successfully`);
      }

      // dispatch global event so MapView / other components refresh
      window.dispatchEvent(new CustomEvent("graphUpdated", { detail: { action: initialValues?._id ? "updateNode" : "createNode", node } }));

      if (onSuccess) onSuccess(node);

      // close modal automatically if onClose provided
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save node");
      console.error("NodeForm error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{initialValues ? "Edit Node" : "Add New Node"}</h3>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {message && <p className="text-green-600 text-sm">{message}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Node Name
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
          placeholder="e.g. Library"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Type
        </label>
        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border rounded-lg p-2"
        >
          <option value="building">Building</option>
          <option value="classroom">Classroom</option>
          <option value="lab">Lab</option>
          <option value="canteen">Canteen</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude
          </label>
          <input
            type="number"
            name="lat"
            step="any"
            value={form.lat}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            placeholder="12.9716"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude
          </label>
          <input
            type="number"
            name="lng"
            step="any"
            value={form.lng}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
            placeholder="77.5946"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => { if (onClose) onClose(); }}
          className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? (initialValues ? "Updating..." : "Creating...") : (initialValues ? "Update Node" : "Create Node")}
        </button>
      </div>
    </form>
  );
}
