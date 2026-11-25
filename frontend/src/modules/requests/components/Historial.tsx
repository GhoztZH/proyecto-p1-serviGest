import type { HistorialItem } from '../types/solicitud.types';

const NOMBRE_ACCION: Record<string, string> = {
  CREACION: 'Registrada',
  CAMBIO_ESTADO: 'Cambio de estado',
  ASIGNACION: 'Asignada',
  REASIGNACION: 'Reasignada',
  COMENTARIO: 'Comentario',
  REAPERTURA: 'Reabierta',
  ADJUNTO: 'Archivos adjuntos',
  CAMBIO_PRIORIDAD: 'Prioridad ajustada',
};

const NOMBRE_ESTADO: Record<string, string> = {
  REGISTRADA: 'Registrada',
  APROBADA: 'Aprobada',
  ASIGNADA: 'Asignada',
  EN_PROCESO: 'En proceso',
  PENDIENTE_INFO: 'Pendiente de información',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
  CANCELADA: 'Cancelada',
};

const NOMBRE_ROL: Record<string, string> = {
  ADMIN: 'Admin',
  COORDINADOR: 'Coordinador',
  TECNICO: 'Técnico',
  CLIENTE: 'Cliente',
};

function fechaRelativa(fechaStr: string): string {
  const ahora = Date.now();
  const fecha = new Date(fechaStr).getTime();
  const diff = ahora - fecha;
  const minutos = Math.floor(diff / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias !== 1 ? 's' : ''}`;
}

function formatoFechaHora(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(fechaStr));
}

function tituloDe(e: HistorialItem): string {
  const d = e.detalle ?? {};
  switch (e.accion) {
    case 'CREACION': return 'Registrada';
    case 'ASIGNACION': return `Asignada a ${String(d.tecnico_nombre ?? 'un técnico')}`;
    case 'REASIGNACION': return `Reasignada a ${String(d.tecnico_nombre ?? 'otro técnico')}`;
    case 'COMENTARIO': return 'Comentario';
    case 'REAPERTURA': return 'Reabierta';
    case 'ADJUNTO': return `Archivos adjuntos: ${Array.isArray(d.archivos) ? d.archivos.join(', ') : ''}`;
    case 'CAMBIO_PRIORIDAD': return `Prioridad ajustada`;
    default:
      if (e.estado_nuevo) return NOMBRE_ESTADO[e.estado_nuevo] ?? e.estado_nuevo;
      return NOMBRE_ACCION[e.accion] ?? e.accion;
  }
}

export function Historial({ entradas }: { entradas: HistorialItem[] }) {
  if (!entradas.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--color-text-muted, #9ca3af)', padding: '24px', fontSize: '13px' }}>
        Sin eventos todavía
      </div>
    );
  }

  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {[...entradas].reverse().map((e) => (
        <li
          key={e.id}
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-fill-subtle, #f9fafb)',
            borderLeft: '3px solid var(--color-accent, #3b82f6)',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text, #374151)', marginBottom: 2 }}>
            {tituloDe(e)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #9ca3af)' }}>
            {NOMBRE_ROL[e.usuario_rol] ?? e.usuario_rol} {e.usuario_nombre} ·{' '}
            <time dateTime={e.fecha} title={formatoFechaHora(e.fecha)}>
              {fechaRelativa(e.fecha)}
            </time>
          </div>
          {e.comentario && (
            <div
              style={{
                marginTop: '6px',
                padding: '6px 10px',
                backgroundColor: 'var(--color-surface, #fff)',
                borderRadius: '4px',
                fontSize: '12px',
                color: 'var(--color-text, #374151)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {e.comentario}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
