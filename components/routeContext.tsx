// contexts/RouteContext.tsx
import React, { createContext, ReactNode, useContext, useState } from "react";

export interface SelectedRoute {
  id: string;
  perfil_id: string;
  nombre_ruta: string;
  color_hex: string;
  descripcion?: string;
  coordinates: Array<[number, number]>;
}

interface RouteContextType {
  selectedRoute: SelectedRoute | null;
  setSelectedRoute: (route: SelectedRoute | null) => void;

  tracking: boolean;
  setTracking: (t: boolean) => void;

  trail: Array<[number, number]>;
  setTrail: React.Dispatch<React.SetStateAction<Array<[number, number]>>>;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null);

  const [tracking, setTracking] = useState(false);
  const [trail, setTrail] = useState<Array<[number, number]>>([]);

  return (
    <RouteContext.Provider
      value={{
        selectedRoute,
        setSelectedRoute,
        tracking,
        setTracking,
        trail,
        setTrail,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useRoute debe usarse dentro de RouteProvider");
  return context;
};
