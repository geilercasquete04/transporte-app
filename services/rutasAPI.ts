// services/rutasAPI.ts
import axios from "axios";

const API_URL = "http://apirecoleccion.gonzaloandreslucio.com/api";

export interface CrearRutaData {
  nombre_ruta: string;
  perfil_id: string;
  color_hex?: string; // Hacerlo opcional
  shape?: string;
  calles_ids?: string[];
}

export interface Ruta {
  id: string;
  nombre_ruta: string;
  perfil_id: string;
  color_hex: string;
  shape?: string;
  created_at?: string;
  updated_at?: string;
}

export const rutasApi = {
  async obtenerRutas(perfil_id: string): Promise<Ruta[]> {
    const res = await axios.get(`${API_URL}/rutas`, {
      params: { perfil_id }
    });

    return res.data.data || [];
  },

  // CREAR RUTA CON FETCH NATIVO (más compatible con React Native)
  async crearRuta(rutaData: CrearRutaData) {
    console.log("📤 Datos originales:", rutaData);

    const tieneShape = !!rutaData.shape;
    const tieneCalles = rutaData.calles_ids?.length;

    if (!tieneShape && !tieneCalles) {
      throw new Error("Debes enviar shape o calles_ids.");
    }

    if (tieneShape && tieneCalles) {
      throw new Error("Debes enviar SOLO shape O SOLO calles_ids.");
    }

    const formData = new FormData();
    
    // Campos obligatorios
    // @ts-ignore
    formData.append("nombre_ruta", rutaData.nombre_ruta);
    // @ts-ignore
    formData.append("perfil_id", rutaData.perfil_id);
    
    // Color - solo si está definido y no es vacío
    if (rutaData.color_hex && rutaData.color_hex.trim()) {
      // @ts-ignore
      formData.append("color_hex", rutaData.color_hex);
      console.log("📤 Enviando color:", rutaData.color_hex);
    } else {
      console.log("⚠️ Color no enviado (vacío o undefined)");
    }

    if (tieneShape) {
      // @ts-ignore
      formData.append("shape", rutaData.shape!);
    }

    if (tieneCalles && rutaData.calles_ids) {
      rutaData.calles_ids.forEach((id) => {
        // @ts-ignore
        formData.append("calles_ids[]", id);
      });
    }

    console.log("📤 FormData a enviar:");
    // @ts-ignore
    for (let pair of formData.entries()) {
      console.log(`  - ${pair[0]}: ${pair[1]}`);
    }

    try {
      // Usar fetch nativo en lugar de axios
      const response = await fetch(`${API_URL}/rutas`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          // NO definir Content-Type - fetch lo hace automáticamente con FormData
        },
        body: formData,
      });

      console.log("📥 Response status:", response.status);
      console.log("📥 Response ok:", response.ok);

      const data = await response.json();
      
      if (!response.ok) {
        console.log("❌ Error response:", data);
        throw new Error(data.message || `HTTP error ${response.status}`);
      }

      console.log("✅ Respuesta exitosa:", data);
      return data;
      
    } catch (error: any) {
      console.log("❌ ERROR completo:", error);
      console.log("❌ Error message:", error.message);
      throw error;
    }
  },

  async obtenerCoordinadasDeRuta(ruta: Ruta) {
    if (!ruta.shape) return [];

    try {
      const geo = JSON.parse(ruta.shape);
      if (geo.type === "LineString" && Array.isArray(geo.coordinates)) {
        return geo.coordinates;
      }
      return [];
    } catch {
      return [];
    }
  },
};

// TESTS DE DIAGNÓSTICO (opcionales)
export const testApi = {
  // Test 0: Solo campos mínimos (sin color)
  async testSinColor() {
    try {
      console.log("🧪 Test 0: POST sin color_hex");
      const formData = new FormData();
      // @ts-ignore
      formData.append("nombre_ruta", "Test Sin Color");
      // @ts-ignore
      formData.append("perfil_id", "09a3de3c-d389-4049-a670-1081dc02dfed");
      // @ts-ignore
      formData.append("calles_ids[]", "813c43d9-5306-4ece-a1a6-2514024d7559");

      const response = await fetch(`${API_URL}/rutas`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log("✅ POST sin color funciona:", response.status, data);
      return true;
    } catch (e: any) {
      console.log("❌ POST sin color falló:", e.message);
      return false;
    }
  },

  // Test 1: POST con JSON simple
  async testPostJSON() {
    try {
      console.log("🧪 Test 1: POST con JSON");
      const res = await axios.post(`${API_URL}/rutas`, {
        nombre_ruta: "Test JSON",
        perfil_id: "09a3de3c-d389-4049-a670-1081dc02dfed",
        color_hex: "#FF5733",
        calles_ids: ["813c43d9-5306-4ece-a1a6-2514024d7559"]
      }, {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      });
      console.log("✅ JSON POST funciona:", res.data);
      return true;
    } catch (e: any) {
      console.log("❌ JSON POST falló:", e.response?.status, e.response?.data || e.message);
      return false;
    }
  },

  // Test 2: POST con fetch y FormData
  async testPostFormDataFetch() {
    try {
      console.log("🧪 Test 2: POST con fetch + FormData");
      const formData = new FormData();
      // @ts-ignore
      formData.append("nombre_ruta", "Test Fetch");
      // @ts-ignore
      formData.append("perfil_id", "09a3de3c-d389-4049-a670-1081dc02dfed");
      // @ts-ignore
      formData.append("color_hex", "#FF5733");
      // @ts-ignore
      formData.append("calles_ids[]", "813c43d9-5306-4ece-a1a6-2514024d7559");

      const response = await fetch(`${API_URL}/rutas`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log("✅ Fetch POST funciona:", response.status, data);
      return true;
    } catch (e: any) {
      console.log("❌ Fetch POST falló:", e.message);
      return false;
    }
  },

  // Test 3: Verificar que el servidor responde
  async testConexion() {
    try {
      console.log("🧪 Test 3: Verificar conexión GET");
      const res = await axios.get(`${API_URL}/rutas`, {
        params: { perfil_id: "09a3de3c-d389-4049-a670-1081dc02dfed" }
      });
      console.log("✅ Conexión GET funciona:", res.data.data?.length, "rutas");
      return true;
    } catch (e: any) {
      console.log("❌ Conexión GET falló:", e.message);
      return false;
    }
  },

  // Ejecutar todos los tests
  async runAllTests() {
    console.log("🚀 Iniciando tests de API...\n");
    
    const test0 = await this.testSinColor();
    console.log("\n");
    
    const test1 = await this.testConexion();
    console.log("\n");
    
    const test2 = await this.testPostJSON();
    console.log("\n");
    
    const test3 = await this.testPostFormDataFetch();
    console.log("\n");
    
    console.log("📊 Resultados:");
    console.log("  POST sin color:", test0 ? "✅" : "❌");
    console.log("  GET rutas:", test1 ? "✅" : "❌");
    console.log("  POST JSON:", test2 ? "✅" : "❌");
    console.log("  POST FormData (fetch):", test3 ? "✅" : "❌");
  }
};