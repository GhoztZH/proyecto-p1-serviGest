/**
 * Tipos oficiales del contrato de la API (docs/api/openapi.yaml).
 */

export type Rol = 'ADMIN' | 'COORDINADOR' | 'TECNICO' | 'CLIENTE';

export interface Perfil {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  clienteId: number | null;
  tecnicoId: number | null;
}

export interface Meta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Pagina<T> {
  data: T[];
  meta: Meta;
}

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  ultimo_acceso: string | null;
  created_at: string;
}
