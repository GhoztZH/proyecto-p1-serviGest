/**
 * Tipos transversales para toda la aplicación.
 * Fuente: docs/api/openapi.yaml y docs/design/design-system.md
 */

// Los 4 roles oficiales del sistema
export type UserRole = 'ADMIN' | 'COORDINADOR' | 'TECNICO' | 'CLIENTE';

// Representación del usuario en sesión
export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: UserRole;
}

// Formato unificado de respuesta de error de la API (openapi.yaml)
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
