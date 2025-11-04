const API_BASE_URL = "http://apirecoleccion.gonzaloandreslucio.com/api";

export interface Ruta {
  id: string;
  perfil_id: string;
  nombre_ruta: string;
  color_hex: string;
  shape: string;
  created_at?: string;
  updated_at?: string;
}

export interface CrearRutaData {
  nombre_ruta: string;
  perfil_id: string;
  shape: string;
  calles_ids: string[];
  color_hex?: string;
}

export const rutasApi = {
  // Obtener rutas
  obtenerRutas: async (perfilId: string): Promise<Ruta[]> => {
    try {
      console.log("Obteniendo rutas para perfil:", perfilId);
      
      const response = await fetch(`${API_BASE_URL}/rutas?perfil_id=${perfilId}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      const responseText = await response.text();
      console.log("Respuesta recibida:", responseText.substring(0, 300));
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${responseText}`);
      }
      
      const data = JSON.parse(responseText);
      console.log("Datos parseados:", data);
      
      return data.data || data.rutas || data || [];
    } catch (error) {
      console.error("Error completo al obtener rutas:", error);
      throw error;
    }
  },

  // Crear ruta
  crearRuta: async (rutaData: CrearRutaData): Promise<Ruta> => {
    try {
      console.log("Creando ruta:", rutaData);
      
      const response = await fetch(`${API_BASE_URL}/rutas`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rutaData),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || "Error al crear ruta");
        error.response = { data: errorData };
        throw error;
      }
      
      const data = JSON.parse(responseText);
      return data.data || data;
    } catch (error) {
      console.error("Error al crear ruta:", error);
      throw error;
    }
  },

  // Actualizar ruta
  actualizarRuta: async (id: string, rutaData: Partial<CrearRutaData>): Promise<Ruta> => {
    try {
      console.log("Actualizando ruta:", id, rutaData);
      
      const response = await fetch(`${API_BASE_URL}/rutas/${id}`, {
        method: "PUT",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rutaData),
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || "Error al actualizar ruta");
        error.response = { data: errorData };
        throw error;
      }
      
      const data = JSON.parse(responseText);
      return data.data || data;
    } catch (error) {
      console.error("Error al actualizar ruta:", error);
      throw error;
    }
  },

  // Eliminar ruta
  eliminarRuta: async (id: string, perfilId: string): Promise<void> => {
    try {
      console.log("Eliminando ruta:", id);
      
      const response = await fetch(`${API_BASE_URL}/rutas/${id}?perfil_id=${perfilId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || "Error al eliminar ruta");
        error.response = { data: errorData };
        throw error;
      }
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      throw error;
    }
  },
};