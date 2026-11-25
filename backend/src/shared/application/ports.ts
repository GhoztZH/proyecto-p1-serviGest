import type { Rol } from '../domain/auth-user.js';

/**
 * Contratos e interfaces compartidas entre módulos para desacoplar implementaciones.
 */

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(hash: string, plain: string): Promise<boolean>;
}

export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** Auditoría general (tabla `auditoria`): catálogos, usuarios y seguridad. */
export interface RegistroAuditoria {
  usuarioId: number | null;
  entidad: string;
  entidadId?: string | number | null;
  accion: string;
  antes?: unknown;
  despues?: unknown;
  ip?: string | null;
}

export interface AuditLogger {
  registrar(registro: RegistroAuditoria): Promise<void>;
}

/**
 * Placeholder/Noop de AuditLogger para cuando el módulo 'audit' no esté conectado aún.
 * NOTA: El Integrante 4 implementará el módulo completo de auditoría.
 */
export const noopAuditLogger: AuditLogger = {
  async registrar(registro: RegistroAuditoria): Promise<void> {
    // Registro en log temporal de consola en desarrollo hasta que el módulo audit persista en BD
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUDIT PLACEHOLDER] ${registro.accion} en ${registro.entidad} por usuario ${registro.usuarioId ?? 'anónimo'}`);
    }
  },
};

/** Gestión de cuentas de acceso que otros módulos (clientes, técnicos) necesitan. */
export interface CuentaNueva {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
}

export interface CuentasUsuario {
  crear(cuenta: CuentaNueva): Promise<number>;
  actualizar(id: number, cambios: { nombre?: string; email?: string; activo?: boolean }): Promise<void>;
  /** Elimina la cuenta si no dejó rastro operativo; en caso contrario la desactiva. */
  eliminarODesactivar(id: number): Promise<void>;
}
