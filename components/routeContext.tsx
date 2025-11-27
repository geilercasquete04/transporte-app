// contexts/RouteContext.tsx
import React, { createContext, ReactNode, useContext, useState } from 'react';

export interface SelectedRoute {
  id: string;
  nombre_ruta: string;
  color_hex: string;
  coordinates: Array<[number, number]>;
}

interface RouteContextType {
  selectedRoute: SelectedRoute | null;
  setSelectedRoute: (route: SelectedRoute | null) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null);

  return (
    <RouteContext.Provider value={{ selectedRoute, setSelectedRoute }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute debe ser usado dentro de un RouteProvider');
  }
  return context;
};