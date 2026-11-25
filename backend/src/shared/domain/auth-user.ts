export const ROLES = ['ADMIN', 'COORDINADOR', 'TECNICO', 'CLIENTE'] as const;
export type Rol = (typeof ROLES)[number];

/** Roles de gestión: ven y operan sobre todas las solicitudes. */
export const ROLES_GESTION: readonly Rol[] = ['ADMIN', 'COORDINADOR'];

/** Identidad autenticada resuelta en cada petición a partir del token JWT. */
export interface AuthUser {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  clienteId: number | null;
  tecnicoId: number | null;
}

export function esGestion(user: Pick<AuthUser, 'rol'>): boolean {
  return ROLES_GESTION.includes(user.rol);
}
