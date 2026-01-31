import axios from 'axios';

const api = axios.create({
  baseURL: 'http://apirecoleccion.gonzaloandreslucio.com/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Si usas autenticación con token:
api.interceptors.request.use(
  async (config) => {
    const token = '09a3de3c-d389-4049-a670-1081dc02dfed';
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
