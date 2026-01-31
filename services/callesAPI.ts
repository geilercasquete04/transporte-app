const API_BASE_URL = "http://apirecoleccion.gonzaloandreslucio.com/api";

export interface Calle {
  coordenadas: never[];
  id: string;
  nombre: string;
  shape: string;
}

export interface Ruta {
  id: string;
  perfil_id: string;
  nombre_ruta: string;
  color_hex: string;
  shape: string;
  created_at: string;
  updated_at: string;
}

export const callesApi = {
  // Obtener todas las calles
  getCalles: async (): Promise<Calle[]> => {
    try {
      console.log("Obteniendo calles");
      
      const response = await fetch(`${API_BASE_URL}/calles`, {
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
      return data.data || data.calles || data || [];
    } catch (error) {
      console.error("Error al obtener calles:", error);
      throw error;
    }
  },
};