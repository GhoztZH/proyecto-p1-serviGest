import type { Rol } from '../../../shared/domain/auth-user.js';

/** Cuenta de acceso. Nunca incluye el hash de la contraseña. */
export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  ultimo_acceso: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** Vista interna para autenticación: añade credenciales y vínculos de perfil. */
export interface UsuarioConCredenciales extends Usuario {
  password_hash: string;
  cliente_id: number | null;
  tecnico_id: number | null;
}

/** Roles que se administran desde el módulo de usuarios (cuentas internas). */
export const ROLES_INTERNOS = ['ADMIN', 'COORDINADOR'] as const;
export type RolInterno = (typeof ROLES_INTERNOS)[number];

export interface FiltroUsuarios {
  q?: string;
  rol?: Rol;
  activo?: boolean;
  limit: number;
  offset: number;
}

export interface UserRepository {
  listar(filtro: FiltroUsuarios): Promise<{ filas: Usuario[]; total: number }>;
  buscarPorId(id: number): Promise<Usuario | undefined>;
  buscarCredencialesPorEmail(email: string): Promise<UsuarioConCredenciales | undefined>;
  buscarCredencialesPorId(id: number): Promise<UsuarioConCredenciales | undefined>;
  existeEmail(email: string, exceptoId?: number): Promise<boolean>;
  crear(datos: { email: string; passwordHash: string; nombre: string; rol: Rol }): Promise<number>;
  actualizar(id: number, cambios: { nombre?: string; email?: string; activo?: boolean }): Promise<void>;
  cambiarPassword(id: number, passwordHash: string): Promise<void>;
  registrarAcceso(id: number): Promise<void>;
  contarAdminsActivos(exceptoId?: number): Promise<number>;
  eliminarSiSinRastro(id: number): Promise<boolean>;
  idsActivosPorRol(roles: Rol[]): Promise<number[]>;
}
