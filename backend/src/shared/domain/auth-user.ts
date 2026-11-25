export const ROLES = ['ADMIN', 'COORDINADOR', 'TECNICO', 'CLIENTE'] as const;
export type Rol = (typeof ROLES)[number];

/** Roles de gestión: ven y operan sobre todas las solicitudes. */
export const ROLES_GESTION: readonly Rol[] = ['ADMIN', 'COORDINADOR'];

/**
 * Identidad autenticada que viaja por los casos de uso.
 * La crea el middleware `authenticate` del módulo auth (Int. 1).
 *
 * ⚠️  DEPENDENCIA_INT1: El middleware `authenticate` debe adjuntar este objeto
 * en `req.auth` antes de que llegue a las rutas de solicitudes.
 */
export interface AuthUser {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  /** Solo presente cuando rol === 'CLIENTE' */
  clienteId?: number | null;
  /** Solo presente cuando rol === 'TECNICO' */
  tecnicoId?: number | null;
}

/** ¿Es admin o coordinador? */
export function esGestion(user: AuthUser): boolean {
  return ROLES_GESTION.includes(user.rol);
}
