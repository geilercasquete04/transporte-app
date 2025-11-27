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

export interface Calle {
  id: string;
  nombre: string;
  shape: string;
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

  // Obtener coordenadas de las calles de una ruta
  obtenerCoordinadasDeRuta: async (ruta: Ruta): Promise<Array<[number, number]>> => {
    try {
      console.log("=== EXTRAYENDO COORDENADAS DE RUTA ===");
      console.log("Ruta:", ruta.nombre_ruta);
      
      // 1. Parsear el shape de la ruta
      let shapeData;
      try {
        shapeData = typeof ruta.shape === 'string' ? JSON.parse(ruta.shape) : ruta.shape;
        console.log("Shape parseado:", shapeData);
      } catch (e) {
        console.error("Error parseando shape:", e);
        return [];
      }

      // 2. Obtener IDs de calles del shape
      let callesIds: string[] = [];
      
      if (shapeData.calles && Array.isArray(shapeData.calles)) {
        callesIds = shapeData.calles;
        console.log("Calles encontradas en shape.calles:", callesIds);
      }
      
      if (callesIds.length === 0) {
        console.log("❌ No se encontraron calles asociadas a esta ruta");
        console.log("Estructura del shape:", JSON.stringify(shapeData, null, 2));
        return [];
      }

      // 3. Obtener todas las calles de la API
      console.log("Obteniendo todas las calles...");
      const callesResponse = await fetch(`${API_BASE_URL}/calles`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      if (!callesResponse.ok) {
        throw new Error("Error al obtener calles");
      }
      
      const callesData = await callesResponse.json();
      const todasLasCalles: Calle[] = callesData.data || callesData.calles || callesData || [];
      console.log(`Total de calles disponibles: ${todasLasCalles.length}`);
      
      // 4. Filtrar solo las calles de esta ruta
      const callesDeRuta = todasLasCalles.filter((calle: Calle) => 
        callesIds.includes(calle.id)
      );
      
      console.log(`✅ Encontradas ${callesDeRuta.length} calles para la ruta`);
      console.log("Calles de la ruta:", callesDeRuta.map(c => c.nombre));
      
      if (callesDeRuta.length === 0) {
        console.log("⚠️ Ninguna calle coincide con los IDs de la ruta");
        console.log("IDs buscados:", callesIds);
        return [];
      }
      
      // 5. Extraer coordenadas de cada calle
      const todasLasCoordenadas: Array<[number, number]> = [];
      
      for (const calle of callesDeRuta) {
        try {
          const calleShape = typeof calle.shape === 'string' 
            ? JSON.parse(calle.shape) 
            : calle.shape;
          
          console.log(`Procesando calle: ${calle.nombre} (${calleShape.type})`);
          
          if (calleShape.coordinates && Array.isArray(calleShape.coordinates)) {
            if (calleShape.type === 'LineString') {
              todasLasCoordenadas.push(...calleShape.coordinates);
              console.log(`  ✓ ${calleShape.coordinates.length} puntos agregados`);
            } else if (calleShape.type === 'MultiLineString') {
              for (const lineString of calleShape.coordinates) {
                todasLasCoordenadas.push(...lineString);
              }
              console.log(`  ✓ Múltiples líneas procesadas`);
            }
          }
        } catch (e) {
          console.error(`Error parseando calle ${calle.nombre}:`, e);
        }
      }
      
      console.log(`\n🎯 TOTAL DE COORDENADAS EXTRAÍDAS: ${todasLasCoordenadas.length}`);
      
      if (todasLasCoordenadas.length > 0) {
        console.log("Primeras 3 coordenadas:", todasLasCoordenadas.slice(0, 3));
      }
      
      return todasLasCoordenadas;
      
    } catch (error) {
      console.error("❌ ERROR al obtener coordenadas de ruta:", error);
      throw error;
    }
  },

  // Crear ruta - VERSIÓN CORREGIDA
  crearRuta: async (rutaData: CrearRutaData): Promise<Ruta> => {
    try {
      console.log("=== INTENTANDO CREAR RUTA ===");
      console.log("Datos recibidos:", rutaData);
      
      // Intento 1: perfil_id en el body
      let bodyData: any = {
        nombre_ruta: rutaData.nombre_ruta,
        perfil_id: rutaData.perfil_id,
        shape: rutaData.shape,
        calles_ids: rutaData.calles_ids,
        color_hex: rutaData.color_hex || "#FF5733",
      };
      
      console.log("Body (Intento 1 - perfil_id en body):", JSON.stringify(bodyData, null, 2));
      
      let response = await fetch(`${API_BASE_URL}/rutas`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
      
      let responseText = await response.text();
      console.log("Respuesta (Intento 1):", responseText);
      
      // Si falla, intentar con perfil_id como query parameter
      if (!response.ok && responseText.includes("perfil")) {
        console.log("⚠️ Intento 1 falló. Probando con perfil_id en query params...");
        
        // Quitar perfil_id del body
        bodyData = {
          nombre_ruta: rutaData.nombre_ruta,
          shape: rutaData.shape,
          calles_ids: rutaData.calles_ids,
          color_hex: rutaData.color_hex || "#FF5733",
        };
        
        console.log("Body (Intento 2 - sin perfil_id):", JSON.stringify(bodyData, null, 2));
        console.log("URL (Intento 2):", `${API_BASE_URL}/rutas?perfil_id=${rutaData.perfil_id}`);
        
        response = await fetch(`${API_BASE_URL}/rutas?perfil_id=${rutaData.perfil_id}`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        });
        
        responseText = await response.text();
        console.log("Respuesta (Intento 2):", responseText);
      }
      
      // Si aún falla, intentar con todos los formatos posibles
      if (!response.ok && responseText.includes("perfil")) {
        console.log("⚠️ Intento 2 falló. Probando con FormData...");
        
        // Intento 3: Usando FormData
        const formData = new FormData();
        formData.append('nombre_ruta', rutaData.nombre_ruta);
        formData.append('perfil_id', rutaData.perfil_id);
        formData.append('shape', rutaData.shape);
        formData.append('color_hex', rutaData.color_hex || "#FF5733");
        
        // Agregar calles_ids como array
        rutaData.calles_ids.forEach((calleId, index) => {
          formData.append(`calles_ids[${index}]`, calleId);
        });
        
        console.log("Intento 3 - FormData enviado");
        
        response = await fetch(`${API_BASE_URL}/rutas`, {
          method: "POST",
          headers: {
            "Accept": "application/json",
          },
          body: formData,
        });
        
        responseText = await response.text();
        console.log("Respuesta (Intento 3):", responseText);
      }
      
      if (!response.ok) {
        console.error("❌ Todos los intentos fallaron. Error HTTP:", response.status);
        console.error("Última respuesta:", responseText);
        const errorData = JSON.parse(responseText);
        const error: any = new Error(errorData.message || errorData.error || "Error al crear ruta");
        error.response = { data: errorData, status: response.status };
        throw error;
      }
      
      const data = JSON.parse(responseText);
      console.log("✅ Ruta creada exitosamente:", data);
      return data.data || data;
      
    } catch (error: any) {
      console.error("❌ ERROR COMPLETO al crear ruta:", {
        message: error.message,
        response: error.response,
      });
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