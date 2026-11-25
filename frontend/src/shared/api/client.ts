import axios from 'axios';

/**
 * Cliente HTTP unificado para consumir la API de ServiGest.
 * - Base URL: '/api' (redirigida en desarrollo por Vite hacia http://localhost:3000)
 * - Inyecta automáticamente el token Bearer si existe en localStorage
 */
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de respuesta para manejar sesiones expiradas (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

/** Limpia parámetros query vacíos o nulos antes de enviarlos en GET. */
export function limpiarParams(params: Record<string, unknown>): Record<string, unknown> {
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== null && v !== undefined) limpio[k] = v;
  }
  return limpio;
}
