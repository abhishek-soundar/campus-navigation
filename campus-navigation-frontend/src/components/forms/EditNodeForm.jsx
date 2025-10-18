// src/components/forms/EditNodeForm.jsx
import React from "react";
import NodeForm from "./NodeForm";

export default function EditNodeForm({ node, onClose, onSuccess }) {
  return <NodeForm initialValues={node} onClose={onClose} onSuccess={onSuccess} />;
}
