// Tipos de la API de solicitudes
// Fuente: openapi.yaml y el backend de Integrante 3

export type Estado =
  | 'REGISTRADA'
  | 'APROBADA'
  | 'ASIGNADA'
  | 'EN_PROCESO'
  | 'PENDIENTE_INFO'
  | 'RESUELTA'
  | 'CERRADA'
  | 'CANCELADA';

export type EstadoPlazo = 'A_TIEMPO' | 'POR_VENCER' | 'VENCIDA' | 'CUMPLIDA' | 'INCUMPLIDA' | 'NO_APLICA';

export interface Solicitud {
  id: number;
  codigo: string;
  titulo: string;
  descripcion: string;
  equipo_afectado: string;
  cliente_id: number;
  cliente_nombre: string;
  sede_id: number;
  sede_nombre: string;
  categoria_id: number;
  categoria_nombre: string;
  prioridad_id: number;
  prioridad: string;
  prioridad_solicitada: string;
  horas_plazo: number;
  estado: Estado;
  estado_plazo: EstadoPlazo;
  horas_restantes: number;
  tecnico_id: number | null;
  tecnico_nombre: string | null;
  resolucion: string | null;
  fecha_limite: string;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
  creado_por: number;
  version: number;
  created_at: string;
}

export interface Adjunto {
  id: number;
  solicitud_id: number;
  nombre_original: string;
  mime_type: string;
  tamano_bytes: number;
  subido_por_nombre: string;
  created_at: string;
}

export interface AsignacionVista {
  id: number;
  tecnico_id: number;
  tecnico_nombre: string;
  asignado_por_nombre: string;
  motivo: string | null;
  activa: boolean;
  fecha_asignacion: string;
  fecha_fin: string | null;
}

export interface AccionesSolicitud {
  transiciones: Estado[];
  puedeAsignar: boolean;
  puedeReabrir: boolean;
  puedeComentar: boolean;
  puedeAdjuntar: boolean;
}

export interface SolicitudDetalle extends Solicitud {
  adjuntos: Adjunto[];
  asignaciones: AsignacionVista[];
  acciones: AccionesSolicitud;
}

export interface HistorialItem {
  id: number;
  accion: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
  comentario: string | null;
  detalle: Record<string, unknown> | null;
  usuario_nombre: string;
  usuario_rol: string;
  fecha: string;
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

export interface FiltroSolicitudes {
  page?: number;
  limit?: number;
  /** Códigos separados por comas, p. ej. `REGISTRADA,APROBADA`. */
  estado?: string;
  prioridad?: string;
  categoria_id?: number | string;
  sede_id?: number | string;
  cliente_id?: number | string;
  tecnico_id?: number | string;
  desde?: string;
  hasta?: string;
  q?: string;
  vencimiento?: 'vencida' | 'por_vencer' | '';
  orden?: 'recientes' | 'antiguas' | 'vencimiento' | 'prioridad';
}

export interface SolicitudNueva {
  cliente_id?: number;
  sede_id: number;
  categoria_id: number;
  prioridad_id: number;
  titulo: string;
  descripcion: string;
  equipo_afectado: string;
}
