import { Fragment, useState, type CSSProperties } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { useSolicitud, useCambioSolicitud } from '../hooks/useSolicitud';
import { solicitudService } from '../services/solicitud.service';
import { Adjuntos } from '../components/Adjuntos';
import { Historial } from '../components/Historial';
import type { Estado, SolicitudDetalle } from '../types/solicitud.types';

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

const TONO_ESTADO: Record<string, string> = {
  REGISTRADA: '#f59e0b',
  APROBADA: '#3b82f6',
  ASIGNADA: '#8b5cf6',
  EN_PROCESO: '#06b6d4',
  PENDIENTE_INFO: '#f97316',
  RESUELTA: '#10b981',
  CERRADA: '#6b7280',
  CANCELADA: '#ef4444',
};

function formatoFechaHora(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(fechaStr));
}

function NOMBRE_PLAZO(ep: string): { texto: string; color: string } {
  switch (ep) {
    case 'A_TIEMPO': return { texto: 'A tiempo', color: '#10b981' };
    case 'POR_VENCER': return { texto: 'Por vencer', color: '#f97316' };
    case 'VENCIDA': return { texto: 'Vencida', color: '#ef4444' };
    case 'CUMPLIDA': return { texto: 'Cumplida', color: '#10b981' };
    case 'INCUMPLIDA': return { texto: 'Incumplida', color: '#ef4444' };
    default: return { texto: '-', color: '#9ca3af' };
  }
}

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--color-surface, #fff)',
  border: '1px solid var(--color-border, #e5e7eb)',
  borderRadius: '12px',
  padding: '20px',
};

const tituloCardStyle: CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-text-muted, #6b7280)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '16px',
};

/** Panel de acciones para el Coordinador */
function PanelCoordinador({ solicitud, alCambiar }: { solicitud: SolicitudDetalle; alCambiar: () => void }) {
  const { ejecutar, cargando, error } = useCambioSolicitud(alCambiar);
  const [comentario, setComentario] = useState('');

  const { acciones } = solicitud;
  if (!acciones.transiciones.length && !acciones.puedeReabrir) return null;

  const cambiar = (estado: Estado) =>
    ejecutar(() => solicitudService.cambiarEstado(solicitud.id, {
      estado,
      comentario: comentario || undefined,
      version: solicitud.version,
    }));

  return (
    <div style={cardStyle}>
      <div style={tituloCardStyle}>Decisión de coordinador</div>
      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginBottom: '12px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {acciones.transiciones.includes('APROBADA') && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => cambiar('APROBADA')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ✓ Aprobar solicitud
          </button>
        )}
        {acciones.transiciones.includes('CERRADA') && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => cambiar('CERRADA')}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ✓ Cerrar solicitud
          </button>
        )}
        {acciones.transiciones.includes('PENDIENTE_INFO') && (
          <>
            <textarea
              placeholder="Comentario al cliente (opcional)"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical' }}
            />
            <button
              type="button"
              disabled={cargando}
              onClick={() => cambiar('PENDIENTE_INFO')}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #f97316', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              ⚠ Solicitar información
            </button>
          </>
        )}
        {acciones.transiciones.includes('CANCELADA') && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => { if (window.confirm('¿Cancelar esta solicitud?')) cambiar('CANCELADA'); }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ✕ Cancelar solicitud
          </button>
        )}
        {acciones.puedeReabrir && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => {
              const motivo = window.prompt('Motivo de reapertura (mínimo 10 caracteres):');
              if (motivo && motivo.trim().length >= 10) {
                ejecutar(() => solicitudService.reabrir(solicitud.id, motivo.trim()));
              }
            }}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ↩ Reabrir solicitud
          </button>
        )}
      </div>
    </div>
  );
}

/** Panel de acciones para el Técnico */
function PanelTecnico({ solicitud, alCambiar }: { solicitud: SolicitudDetalle; alCambiar: () => void }) {
  const { ejecutar, cargando, error } = useCambioSolicitud(alCambiar);
  const [resolucion, setResolucion] = useState('');
  const { acciones } = solicitud;

  if (!acciones.transiciones.length) return null;

  return (
    <div style={cardStyle}>
      <div style={tituloCardStyle}>Mis acciones</div>
      {error && (
        <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', borderRadius: '6px', color: '#dc2626', fontSize: '12px', marginBottom: '12px' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {acciones.transiciones.includes('EN_PROCESO') && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => ejecutar(() => solicitudService.cambiarEstado(solicitud.id, { estado: 'EN_PROCESO', version: solicitud.version }))}
            style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#06b6d4', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ▶ Iniciar atención
          </button>
        )}
        {acciones.transiciones.includes('RESUELTA') && (
          <>
            <label style={{ fontSize: '12px', fontWeight: 500 }}>Resolución (obligatoria) *</label>
            <textarea
              placeholder="Describe la solución aplicada…"
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              rows={3}
              style={{ padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical' }}
            />
            <button
              type="button"
              disabled={cargando || resolucion.trim().length < 10}
              onClick={() => ejecutar(() => solicitudService.cambiarEstado(solicitud.id, { estado: 'RESUELTA', resolucion, version: solicitud.version }))}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            >
              ✓ Marcar como resuelta
            </button>
          </>
        )}
        {acciones.transiciones.includes('PENDIENTE_INFO') && (
          <button
            type="button"
            disabled={cargando}
            onClick={() => ejecutar(() => solicitudService.cambiarEstado(solicitud.id, { estado: 'PENDIENTE_INFO', version: solicitud.version }))}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #f97316', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
          >
            ? Solicitar información al cliente
          </button>
        )}
      </div>
    </div>
  );
}

/** Panel de comentario */
function CajaComentario({ solicitudId, alCambiar }: { solicitudId: number; alCambiar: () => void }) {
  const { ejecutar, cargando, error } = useCambioSolicitud(alCambiar);
  const [texto, setTexto] = useState('');

  const enviar = () => {
    if (texto.trim().length < 2) return;
    ejecutar(() => solicitudService.comentar(solicitudId, texto.trim())).then(() => setTexto(''));
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      {error && <div style={{ color: '#dc2626', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
      <textarea
        placeholder="Escribe un comentario..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={2}
        style={{ width: '100%', padding: '8px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', resize: 'vertical', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
        <button
          type="button"
          disabled={cargando || texto.trim().length < 2}
          onClick={enviar}
          style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--color-accent, #3b82f6)', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
        >
          Comentar
        </button>
      </div>
    </div>
  );
}

export function SolicitudDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const solicitudId = Number(id);

  const { detalle, historial, recargar } = useSolicitud(solicitudId);
  const s = detalle.datos;

  if (detalle.cargando) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted, #9ca3af)' }}>
        Cargando solicitud...
      </div>
    );
  }

  if (detalle.error || !s) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
          {detalle.error ?? 'Solicitud no encontrada'}
        </div>
        <Link to="/requests" style={{ color: 'var(--color-accent, #3b82f6)', textDecoration: 'none', fontSize: '13px' }}>← Volver a solicitudes</Link>
      </div>
    );
  }

  const plazo = NOMBRE_PLAZO(s.estado_plazo);
  const detalles: [string, string][] = [
    ['Equipo afectado', s.equipo_afectado],
    ['Prioridad', s.prioridad],
    ['Fecha límite', formatoFechaHora(s.fecha_limite)],
  ];
  if (s.tecnico_nombre) detalles.push(['Técnico', s.tecnico_nombre]);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted, #9ca3af)' }}>{s.codigo}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: `${TONO_ESTADO[s.estado]}20`,
                color: TONO_ESTADO[s.estado],
              }}
            >
              {NOMBRE_ESTADO[s.estado] ?? s.estado}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 10px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#f9fafb',
                color: plazo.color,
              }}
            >
              {plazo.texto}
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-text, #111827)' }}>{s.titulo}</h1>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)', margin: '4px 0 0' }}>
            {s.cliente_nombre} · Sede {s.sede_nombre} · {s.categoria_nombre}
          </p>
        </div>
        <Link to="/requests" style={{ color: 'var(--color-text-muted, #9ca3af)', textDecoration: 'none', fontSize: '13px' }}>
          ← Volver
        </Link>
      </div>

      {/* Layout de dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Detalle */}
          <div style={cardStyle}>
            <div style={tituloCardStyle}>Detalle de la solicitud</div>
            <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px 16px', marginBottom: '16px' }}>
              {detalles.map(([dt, dd]) => (
                <Fragment key={dt}>
                  <dt style={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)', fontWeight: 500 }}>{dt}</dt>
                  <dd style={{ fontSize: '13px', color: 'var(--color-text, #374151)', margin: 0 }}>{dd}</dd>
                </Fragment>
              ))}
            </dl>
            <p style={{ fontSize: '13px', color: 'var(--color-text, #374151)', whiteSpace: 'pre-wrap', marginBottom: '16px' }}>{s.descripcion}</p>
            {s.resolucion && (
              <div style={{ padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>Resolución</div>
                <p style={{ fontSize: '13px', color: '#374151', whiteSpace: 'pre-wrap', margin: 0 }}>{s.resolucion}</p>
                {s.fecha_resolucion && <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Resuelta: {formatoFechaHora(s.fecha_resolucion)}</p>}
              </div>
            )}
            <Adjuntos
              solicitudId={s.id}
              adjuntos={s.adjuntos}
              puedeAdjuntar={s.acciones.puedeAdjuntar && role !== 'ADMIN'}
              alCambiar={recargar}
            />
          </div>

          {/* Historial */}
          <div style={cardStyle}>
            <div style={tituloCardStyle}>Historial</div>
            {role !== 'ADMIN' && <CajaComentario solicitudId={s.id} alCambiar={recargar} />}
            {historial.cargando ? (
              <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px', fontSize: '13px' }}>Cargando historial...</div>
            ) : (
              <Historial entradas={historial.datos ?? []} />
            )}
          </div>
        </div>

        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {role === 'ADMIN' && (
            <div style={{ padding: '12px', backgroundColor: '#eff6ff', borderRadius: '8px', fontSize: '12px', color: '#1d4ed8' }}>
              Vista de consulta. Las acciones las realiza el Coordinador.
            </div>
          )}

          {role === 'COORDINADOR' && <PanelCoordinador solicitud={s} alCambiar={recargar} />}
          {role === 'TECNICO' && <PanelTecnico solicitud={s} alCambiar={recargar} />}

          {/* Info de plazo */}
          <div style={cardStyle}>
            <div style={tituloCardStyle}>Estado del plazo</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: plazo.color, marginBottom: '4px' }}>{plazo.texto}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)' }}>
              Límite: {formatoFechaHora(s.fecha_limite)} · Prioridad {s.prioridad} ({s.horas_plazo} h)
              {s.estado_plazo !== 'NO_APLICA' && s.horas_restantes !== 0 && (
                <div>
                  {s.horas_restantes > 0 ? `${s.horas_restantes} horas restantes` : `${Math.abs(s.horas_restantes)} horas vencida`}
                </div>
              )}
            </div>
          </div>

          {/* Técnico asignado */}
          <div style={cardStyle}>
            <div style={tituloCardStyle}>Técnico asignado</div>
            {s.tecnico_nombre ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-accent-soft, #dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--color-accent, #3b82f6)', flexShrink: 0 }}>
                  {s.tecnico_nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{s.tecnico_nombre}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Asignado el {s.asignaciones.find((a) => a.activa)
                      ? formatoFechaHora(s.asignaciones.find((a) => a.activa)!.fecha_asignacion)
                      : '-'}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Aún no se ha asignado un técnico.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
