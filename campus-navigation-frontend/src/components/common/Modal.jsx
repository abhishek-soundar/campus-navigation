// src/components/common/Modal.jsx
import React from 'react';

export default function Modal({ open, onClose, title, children, size = 'max-w-2xl' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal box */}
      <div
        className={`relative w-full ${size} rounded-lg shadow-xl z-10 overflow-visible`}
        style={{
          backgroundColor: '#f3f4f6', // light gray background
          color: '#000000',           // full black text everywhere
          maxWidth: '820px',          // allow wider modal so form fields are not cramped
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'rgba(0,0,0,0.15)', color: '#000' }}
        >
          <h3 className="text-lg font-semibold" style={{ color: '#000' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className="hover:text-red-600 transition font-bold"
            aria-label="Close modal"
            style={{ color: '#000' }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div
          className="p-6 space-y-6"
          style={{
            color: '#000',              // make sure text inside is black
          }}
        >
          {/* Force black text and white inputs for all children */}
          <style>
            {`
              .modal-content * {
                color: #000 !important;
              }
              .modal-content input,
              .modal-content select,
              .modal-content textarea {
                color: #000 !important;
                background-color: #fff !important;
                border: 1px solid rgba(0,0,0,0.2) !important;
              }
              .modal-content label {
                color: #000 !important;
                font-weight: 500 !important;
              }
              .modal-content button {
                color: #000 !important;
              }
              .modal-content option {
                color: #000 !important;
                background-color: #fff !important;
              }
              /* ensure the modal children are centered and have adequate max width */
              .modal-content {
                max-width: 760px;
                margin: 0 auto;
              }
            `}
          </style>

          <div className="modal-content">{children}</div>
        </div>
      </div>
    </div>
  );
}
