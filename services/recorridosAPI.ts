import axios from "axios";

const API_URL = "https://apirecoleccion.gonzaloandreslucio.com/api";

export const recorridosApi = {
  async getMisRecorridos(perfil_id: string) {
    const { data } = await axios.get(`${API_URL}/misrecorridos`, {
      params: { perfil_id },
    });
    return data;
  },
};
