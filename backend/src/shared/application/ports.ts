/**
 * Puertos e interfaces compartidas entre módulos para desacoplar implementaciones.
 */

export interface AuditLogger {
  log(evento: {
    usuarioId?: number;
    accion: string;
    entidad: string;
    entidadId?: string | number;
    detalles?: Record<string, unknown>;
  }): Promise<void>;
}

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
