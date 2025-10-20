// services/vehiculosApi.ts
import axios from 'axios';

const API_BASE_URL = 'http://apirecoleccion.gonzaloandreslucio.com/api';

// 🔐 Token fijo de autenticación
const TOKEN = '09a3de3c-d389-4049-a670-1081dc02dfed';

// Tipos basados en la API de Recolección de Residuos
export interface Vehiculo {
  id: string; // UUID
  perfil_id: string; // UUID
  placa: string;
  marca?: string;
  modelo?: string; // año
  capacidad?: number;
  tipo_combustible?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateVehiculoDto {
  placa: string;
  marca?: string;
  modelo?: string;
  activo?: boolean;
  perfil_id: string; // UUID requerido
}

export interface UpdateVehiculoDto {
  placa?: string;
  marca?: string;
  modelo?: string;
  activo?: boolean;
  perfil_id?: string;
}

// Configuración de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`, 
  },
});

// Funciones para consumir la API de Vehículos
export const vehiculosApi = {
  // Obtener todos los vehículos (opcionalmente filtrado por perfil)
  getVehiculos: async (perfil_id: string): Promise<Vehiculo[]> => {
    try {
      const response = await api.get(`/vehiculos?perfil_id=${perfil_id}`);
      console.log('Vehículos obtenidos:', response.data); // Puedes dejar este log

      // ✅ devuelve solo el array de vehículos
      return response.data.data; 
    } catch (error: any) {
      if (error.response) {
        console.error('Error al obtener vehículos:', error.response.data);
      } else {
        console.error('Error al obtener vehículos:', error.message);
      }
      throw error;
    }
  },

  // Obtener un vehículo por ID
  getById: async (id: string): Promise<Vehiculo> => {
    try {
      const response = await api.get(`/vehiculos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener vehículo ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo vehículo
create: async (vehiculo: CreateVehiculoDto): Promise<Vehiculo> => {
  try {
    const vehiculoFormateado = {
      ...vehiculo,
      modelo: vehiculo.modelo ? String(vehiculo.modelo) : undefined,
    };

    console.log('📤 Enviando datos de vehículo:', vehiculoFormateado);

    const response = await api.post('/vehiculos', vehiculoFormateado);

    console.log('✅ Vehículo creado con éxito:', response.data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      console.error('❌ Error al crear vehículo:');
      console.error('➡️ Status:', error.response.status);
      console.error('➡️ Data:', error.response.data);
      console.error('➡️ Headers:', error.response.headers);
    } else {
      console.error('⚠️ Error inesperado:', error.message);
    }
    throw error;
  }
},

  // Actualizar un vehículo
  update: async (id: string, vehiculo: UpdateVehiculoDto): Promise<Vehiculo> => {
    try {
      const response = await api.put(`/vehiculos/${id}`, vehiculo);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar vehículo ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un vehículo
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/vehiculos/${id}`);
    } catch (error) {
      console.error(`Error al eliminar vehículo ${id}:`, error);
      throw error;
    }
  },
};

export default vehiculosApi;
