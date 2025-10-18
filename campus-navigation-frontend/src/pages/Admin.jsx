// src/pages/Admin.jsx
import React, { useState } from 'react';
import NodeForm from '../components/forms/NodeForm';
import EdgeForm from '../components/forms/EdgeForm';
import Modal from '../components/common/Modal';

export default function AdminPage() {
  const [openNode, setOpenNode] = useState(false);
  const [openEdge, setOpenEdge] = useState(false);

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-3">
          <button onClick={() => setOpenNode(true)} className="px-4 py-2 bg-blue-600 text-white rounded shadow">Add Node</button>
          <button onClick={() => setOpenEdge(true)} className="px-4 py-2 bg-indigo-600 text-white rounded shadow">Add Edge</button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold mb-2">Map / Controls</h2>
          <p className="text-sm text-gray-500">Open the map page to visually inspect nodes and edges. Use Add Node / Add Edge to mutate graph.</p>
        </div>

        <aside className="bg-white rounded-lg p-4 shadow space-y-3">
          <h3 className="font-semibold">Quick actions</h3>
          <p className="text-sm text-gray-500">Use these to quickly add new nodes/edges. Changes will reflect on the map automatically.</p>
          <div className="flex gap-2">
            <button onClick={() => setOpenNode(true)} className="px-3 py-2 bg-blue-50 text-blue-700 border rounded">New Node</button>
            <button onClick={() => setOpenEdge(true)} className="px-3 py-2 bg-indigo-50 text-indigo-700 border rounded">New Edge</button>
          </div>
        </aside>
      </section>

      <Modal open={openNode} onClose={() => setOpenNode(false)} title="Add Node">
        <NodeForm onClose={() => setOpenNode(false)} />
      </Modal>

      <Modal open={openEdge} onClose={() => setOpenEdge(false)} title="Create Edge">
        <EdgeForm onClose={() => setOpenEdge(false)} />
      </Modal>
    </div>
  );
}
