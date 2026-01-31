import axios from "axios";

const API_URL = "https://apirecoleccion.gonzaloandreslucio.com/api";

export interface Ruta {
  color_hex: string;
  id: string;
  nombre_ruta: string;
  perfil_id: string;
  shape: any;               // 👈 AHORA ES JSON OBJETO
  calles_ids: string[];
  descripcion?: string;
  created_at: string;
  updated_at: string;
}

export const rutasApi = {
  async getRutas(perfil_id: string): Promise<Ruta[]> {
    const res = await axios.get(`${API_URL}/rutas`, {
      params: { perfil_id },
    });

    return res.data.data;
  },

  async deleteRuta(id: string, perfil_id: string) {
    return axios.delete(`${API_URL}/rutas/${id}`, {
      params: { perfil_id },
    });
  },

  async createRuta(data: {
    nombre_ruta: string;
    perfil_id: string;
    shape: any;            // 👈 AHORA TAMBIÉN ACEPTA OBJETO
    calles_ids: string[];
  }) {
    return axios.post(`${API_URL}/rutas`, data, {
      headers: { "Content-Type": "application/json" },
    });
  },
};
