// src/components/forms/EditEdgeForm.jsx
import React from "react";
import EdgeForm from "./EdgeForm";

export default function EditEdgeForm({ edge, onClose, onSuccess }) {
  return <EdgeForm initialValues={edge} onClose={onClose} onSuccess={onSuccess} />;
}
