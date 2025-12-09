import React, { createContext, ReactNode, useContext, useState } from "react";

export interface SelectedRoute {
  id: string;
  perfil_id: string;
  nombre_ruta: string;
  color_hex: string;
  descripcion?: string;
  coordinates: Array<[number, number]>;
}

export interface VehiculoSeleccionado {
  id: string;
  placa: string;
}

interface RouteContextType {
  // Ruta seleccionada
  selectedRoute: SelectedRoute | null;
  setSelectedRoute: (route: SelectedRoute | null) => void;

  // Vehículo seleccionado
  selectedVehiculo: VehiculoSeleccionado | null;
  setSelectedVehiculo: (v: VehiculoSeleccionado | null) => void;

  // Tracking GPS
  tracking: boolean;
  setTracking: (t: boolean) => void;

  // Coordenadas del recorrido actual
  trail: Array<[number, number]>;
  setTrail: React.Dispatch<React.SetStateAction<Array<[number, number]>>>;

  // ID del recorrido iniciado en la API
  currentRecorridoId: string | null;
  setCurrentRecorridoId: (id: string | null) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedRoute, setSelectedRoute] = useState<SelectedRoute | null>(null);
  const [selectedVehiculo, setSelectedVehiculo] = useState<VehiculoSeleccionado | null>(null);

  const [tracking, setTracking] = useState(false);
  const [trail, setTrail] = useState<Array<[number, number]>>([]);

  const [currentRecorridoId, setCurrentRecorridoId] = useState<string | null>(null);

  return (
    <RouteContext.Provider
      value={{
        selectedRoute,
        setSelectedRoute,
        selectedVehiculo,
        setSelectedVehiculo,
        tracking,
        setTracking,
        trail,
        setTrail,
        currentRecorridoId,
        setCurrentRecorridoId,
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const ctx = useContext(RouteContext);
  if (!ctx) throw new Error("useRoute debe usarse dentro de RouteProvider");
  return ctx;
};
