import React, { useState } from "react";

export default function SearchableSelect({ label, options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {label && <label className="text-xs text-gray-500 mb-1">{label}</label>}
      <input
        list={`${label}-list`}
        value={value ? options.find(o => o._id === value)?.name || "" : query}
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          const found = options.find(o => o.name.toLowerCase() === v.toLowerCase());
          if (found) onChange(found._id);
        }}
        placeholder={placeholder}
        className="p-2 border rounded-lg text-sm bg-white"
      />
      <datalist id={`${label}-list`}>
        {filtered.map(o => (
          <option key={o._id} value={o.name} />
        ))}
      </datalist>
    </div>
  );
}
