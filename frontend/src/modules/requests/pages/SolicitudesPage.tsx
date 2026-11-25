import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { solicitudService } from '../services/solicitud.service';
import type { FiltroSolicitudes, Solicitud, Pagina } from '../types/solicitud.types';

const NOMBRE_ESTADO: Record<string, string> = {
  REGISTRADA: 'Registrada',
  APROBADA: 'Aprobada',
  ASIGNADA: 'Asignada',
  EN_PROCESO: 'En proceso',
  PENDIENTE_INFO: 'Pendiente info',
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

const NOMBRE_PLAZO: Record<string, string> = {
  A_TIEMPO: 'A tiempo',
  POR_VENCER: 'Por vencer',
  VENCIDA: 'Vencida',
  CUMPLIDA: 'Cumplida',
  INCUMPLIDA: 'Incumplida',
  NO_APLICA: '-',
};

function formatoFecha(fechaStr: string): string {
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(fechaStr));
}

const VISTAS_GESTION = [
  { valor: 'aprobar', texto: 'Por aprobar', estado: 'REGISTRADA' },
  { valor: 'curso', texto: 'En curso', estado: 'APROBADA,ASIGNADA,EN_PROCESO' },
  { valor: 'info', texto: 'Pend. info', estado: 'PENDIENTE_INFO' },
  { valor: 'resueltas', texto: 'Resueltas', estado: 'RESUELTA' },
  { valor: 'cerradas', texto: 'Cerradas', estado: 'CERRADA' },
  { valor: 'todas', texto: 'Todas', estado: '' },
];

const VISTAS_TECNICO = [
  { valor: 'asignadas', texto: 'Asignadas', estado: 'ASIGNADA' },
  { valor: 'proceso', texto: 'En proceso', estado: 'EN_PROCESO' },
  { valor: 'info', texto: 'Pend. info', estado: 'PENDIENTE_INFO' },
  { valor: 'todas', texto: 'Todas', estado: '' },
];

const VISTAS_CLIENTE = [
  { valor: 'abiertas', texto: 'Abiertas', estado: 'REGISTRADA,APROBADA,ASIGNADA,EN_PROCESO,PENDIENTE_INFO' },
  { valor: 'resueltas', texto: 'Resueltas', estado: 'RESUELTA,CERRADA' },
  { valor: 'todas', texto: 'Todas', estado: '' },
];

export function SolicitudesPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pagina, setPagina] = useState<Pagina<Solicitud> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState(searchParams.get('q') ?? '');

  const vistas = role === 'TECNICO' ? VISTAS_TECNICO : role === 'CLIENTE' ? VISTAS_CLIENTE : VISTAS_GESTION;
  const vistaActual = searchParams.get('vista') ?? vistas[0]?.valor ?? 'todas';
  const estadoFiltro = vistas.find((v) => v.valor === vistaActual)?.estado ?? '';
  const paginaActual = Number(searchParams.get('page') ?? '1');

  const filtro: FiltroSolicitudes = {
    page: paginaActual,
    limit: 20,
    estado: estadoFiltro || undefined,
    q: q || undefined,
  };

  useEffect(() => {
    setCargando(true);
    setError(null);
    solicitudService
      .listar(filtro)
      .then(setPagina)
      .catch((e) => setError(e?.response?.data?.error?.message ?? e?.message ?? 'Error al cargar'))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, paginaActual, q]);

  const cambiarVista = (valor: string) => {
    setSearchParams({ vista: valor });
    setPagina(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-text, #111827)' }}>
            {role === 'CLIENTE' ? 'Mis solicitudes' : role === 'TECNICO' ? 'Mis asignaciones' : role === 'COORDINADOR' ? 'Bandeja de trabajo' : 'Solicitudes'}
          </h1>
          {pagina && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted, #9ca3af)', margin: '4px 0 0' }}>
              {pagina.meta.total} solicitudes en total
            </p>
          )}
        </div>
        {role === 'CLIENTE' && (
          <Link
            to="/requests/new"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: 'var(--color-accent, #3b82f6)',
              color: '#fff',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            + Nueva solicitud
          </Link>
        )}
      </div>

      {/* Pestañas */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', borderBottom: '1px solid var(--color-border, #e5e7eb)', paddingBottom: '0' }}>
        {vistas.map((v) => (
          <button
            key={v.valor}
            type="button"
            onClick={() => cambiarVista(v.valor)}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: vistaActual === v.valor ? 600 : 400,
              color: vistaActual === v.valor ? 'var(--color-accent, #3b82f6)' : 'var(--color-text-muted, #6b7280)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: vistaActual === v.valor ? '2px solid var(--color-accent, #3b82f6)' : '2px solid transparent',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {v.texto}
          </button>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="search"
          placeholder="Buscar por código o título..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '8px 12px',
            border: '1px solid var(--color-border, #e5e7eb)',
            borderRadius: '8px',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>

      {/* Estado de carga / error */}
      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {cargando && (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted, #9ca3af)' }}>
          Cargando solicitudes...
        </div>
      )}

      {/* Tabla de solicitudes */}
      {!cargando && pagina && (
        <>
          {pagina.data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted, #9ca3af)' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📋</div>
              <div>No hay solicitudes en esta sección</div>
              {role === 'CLIENTE' && (
                <Link to="/requests/new" style={{ color: 'var(--color-accent, #3b82f6)', textDecoration: 'none', fontSize: '13px', marginTop: '8px', display: 'inline-block' }}>
                  Crear la primera solicitud
                </Link>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pagina.data.map((s) => (
                <div
                  key={s.id}
                  onClick={() => navigate(`/requests/${s.id}`)}
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--color-surface, #fff)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'box-shadow 120ms ease',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '8px',
                    alignItems: 'start',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.08)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.boxShadow = 'none')}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted, #9ca3af)' }}>{s.codigo}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 600,
                          backgroundColor: `${TONO_ESTADO[s.estado]}20`,
                          color: TONO_ESTADO[s.estado],
                        }}
                      >
                        {NOMBRE_ESTADO[s.estado] ?? s.estado}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted, #9ca3af)' }}>{s.categoria_nombre}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text, #111827)', marginBottom: '4px' }}>{s.titulo}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #6b7280)' }}>
                      {s.cliente_nombre} · {s.sede_nombre}
                      {s.tecnico_nombre && ` · Técnico: ${s.tecnico_nombre}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: s.estado_plazo === 'VENCIDA' || s.estado_plazo === 'INCUMPLIDA' ? '#ef4444' : s.estado_plazo === 'POR_VENCER' ? '#f97316' : '#6b7280',
                      }}
                    >
                      {NOMBRE_PLAZO[s.estado_plazo] ?? ''}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #9ca3af)', marginTop: '2px' }}>
                      Límite: {formatoFecha(s.fecha_limite)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {pagina.meta.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              {Array.from({ length: pagina.meta.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSearchParams({ vista: vistaActual, page: String(p) })}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    backgroundColor: p === paginaActual ? 'var(--color-accent, #3b82f6)' : 'var(--color-surface, #fff)',
                    color: p === paginaActual ? '#fff' : 'var(--color-text, #374151)',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
