// src/context/MapContext.jsx
import React, { createContext, useContext, useState, useCallback } from "react";

const MapContext = createContext();

export const MapProvider = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  // Simple trigger function to notify map components
  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <MapContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapRefresh = () => useContext(MapContext);
