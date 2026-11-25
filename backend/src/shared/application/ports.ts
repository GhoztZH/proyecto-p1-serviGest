import type { Rol } from '../domain/auth-user.js';

/**
 * Puertos e interfaces compartidas entre módulos para desacoplar implementaciones.
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

/** Placeholder hasta que el módulo de auditoría persista en base de datos. */
export const noopAuditLogger: AuditLogger = {
  async registrar(registro): Promise<void> {
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
  eliminarODesactivar(id: number): Promise<void>;
}

/** Historial inalterable de la solicitud (tabla `historial_solicitudes`). */
export type AccionHistorial =
  | 'CREACION'
  | 'CAMBIO_ESTADO'
  | 'ASIGNACION'
  | 'REASIGNACION'
  | 'COMENTARIO'
  | 'REAPERTURA'
  | 'ADJUNTO'
  | 'CAMBIO_PRIORIDAD';

export interface EntradaHistorial {
  solicitudId: number;
  usuarioId: number;
  accion: AccionHistorial;
  estadoAnterior?: string | null;
  estadoNuevo?: string | null;
  comentario?: string | null;
  detalle?: Record<string, unknown> | null;
}

export interface HistorialItem {
  id: number;
  accion: AccionHistorial;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  comentario: string | null;
  detalle: Record<string, unknown> | null;
  usuario_nombre: string;
  usuario_rol: Rol;
  fecha: Date;
}

export interface HistorialSolicitudes {
  registrar(entrada: EntradaHistorial): Promise<void>;
  listar(solicitudId: number): Promise<HistorialItem[]>;
}

/** Evento de negocio sobre una solicitud; lo consume el módulo de notificaciones. */
export type TipoEventoSolicitud =
  | 'REGISTRO'
  | 'CAMBIO_ESTADO'
  | 'ASIGNACION'
  | 'REASIGNACION'
  | 'COMENTARIO'
  | 'REAPERTURA'
  | 'ADJUNTO';

export interface EventoSolicitud {
  tipo: TipoEventoSolicitud;
  actorId: number;
  actorNombre: string;
  solicitud: {
    id: number;
    codigo: string;
    titulo: string;
    clienteId: number;
    tecnicoId: number | null;
    estado: string;
  };
  estadoAnterior?: string;
  tecnicoAnteriorId?: number | null;
  comentario?: string | null;
}

export interface EventosSolicitud {
  publicar(evento: EventoSolicitud): Promise<void>;
}

/** Lectura de parámetros operativos. */
export interface ParametrosOperativos {
  numero(clave: string, porDefecto: number): Promise<number>;
}
