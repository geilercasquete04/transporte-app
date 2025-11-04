const API_BASE_URL = "http://apirecoleccion.gonzaloandreslucio.com/api";

export interface Vehiculo {
  id: string;
  placa: string;
  marca?: string;
  modelo?: string;
  capacidad?: number;
  tipo_combustible?: string;
  estado?: string;
  perfil_id?: string;
}

export const vehiculosApi = {
  // Obtener vehículos
  getVehiculos: async (perfilId: string): Promise<Vehiculo[]> => {
    try {
      console.log("Obteniendo vehículos para perfil:", perfilId);
      
      const response = await fetch(`${API_BASE_URL}/vehiculos?perfil_id=${perfilId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      return data.data || data.vehiculos || data || [];
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
      throw error;
    }
  },

  // Crear vehículo
  create: async (vehiculoData: Partial<Vehiculo>): Promise<Vehiculo> => {
    try {
      console.log("Creando vehículo:", vehiculoData);
      
      const response = await fetch(`${API_BASE_URL}/vehiculos`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehiculoData),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || "Error al crear vehículo");
        error.response = { data: errorData };
        throw error;
      }
      
      const data = JSON.parse(responseText);
      return data.data || data;
    } catch (error) {
      console.error("Error al crear vehículo:", error);
      throw error;
    }
  },

  // Actualizar vehículo
  update: async (id: string, vehiculoData: Partial<Vehiculo>): Promise<Vehiculo> => {
    try {
      console.log("Actualizando vehículo:", id, vehiculoData);
      
      const response = await fetch(`${API_BASE_URL}/vehiculos/${id}`, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehiculoData),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || "Error al actualizar vehículo");
        error.response = { data: errorData };
        throw error;
      }
      
      const data = JSON.parse(responseText);
      return data.data || data;
    } catch (error) {
      console.error("Error al actualizar vehículo:", error);
      throw error;
    }
  },

// Eliminar vehículo
delete: async (id: string, perfilId: string): Promise<void> => {
  try {
    console.log("Eliminando vehículo:", id);
    
    const response = await fetch(`${API_BASE_URL}/vehiculos/${id}?perfil_id=${perfilId}`, {
      method: "DELETE",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      const errorData = JSON.parse(responseText);
      const error: any = new Error(errorData.message || "Error al eliminar vehículo");
      error.response = { data: errorData };
      throw error;
    }
  } catch (error) {
    console.error("Error al eliminar vehículo:", error);
    throw error;
  }
},
};