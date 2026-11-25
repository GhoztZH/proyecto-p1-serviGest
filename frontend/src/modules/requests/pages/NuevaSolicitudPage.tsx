import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';
import { api } from '../../../shared/api/client';
import { solicitudService } from '../services/solicitud.service';
import { ZonaArchivos, motivoRechazo } from '../components/Adjuntos';
import type { SolicitudNueva } from '../types/solicitud.types';

interface CatalogoItem {
  id: number;
  nombre: string;
  razon_social?: string;
  horas_plazo?: number;
  codigo?: string;
}

interface Sede {
  id: number;
  nombre: string;
  cliente_id: number;
  activo: boolean;
}

function formatTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function NuevaSolicitudPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  const esCliente = role === 'CLIENTE';

  const [clientes, setClientes] = useState<CatalogoItem[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [categorias, setCategorias] = useState<CatalogoItem[]>([]);
  const [prioridades, setPrioridades] = useState<CatalogoItem[]>([]);

  const [f, setF] = useState({
    cliente_id: '',
    sede_id: '',
    categoria_id: '',
    prioridad_id: '',
    equipo_afectado: '',
    titulo: '',
    descripcion: '',
  });
  const [archivos, setArchivos] = useState<File[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campos, setCampos] = useState<Record<string, string>>({});

  // Cargar catálogos
  useEffect(() => {
    if (!esCliente) {
      api.get<{ data: CatalogoItem[] }>('/clientes').then((r) => setClientes(r.data.data ?? [])).catch(() => {});
    }
    api.get<{ data: CatalogoItem[] }>('/catalogos/categorias').then((r) => setCategorias(r.data.data ?? [])).catch(() => {});
    api.get<{ data: CatalogoItem[] }>('/catalogos/prioridades').then((r) => setPrioridades(r.data.data ?? [])).catch(() => {});
  }, [esCliente]);

  // Cargar sedes cuando cambia el cliente
  useEffect(() => {
    const clienteId = esCliente ? user?.id : Number(f.cliente_id);
    if (!clienteId) { setSedes([]); return; }
    api.get<{ data: Sede[] }>(`/clientes/${clienteId}/sedes`).then((r) => setSedes(r.data.data ?? [])).catch(() => setSedes([]));
  }, [f.cliente_id, esCliente, user?.id]);

  const cambiar = (campo: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((prev) => ({ ...prev, [campo]: e.target.value }));
    setCampos((prev) => ({ ...prev, [campo]: '' }));
  };

  const agregar = (nuevos: File[]) => {
    const rechazados = nuevos.map(motivoRechazo).filter(Boolean);
    if (rechazados.length) { setError(rechazados[0]!); return; }
    setArchivos((prev) => [...prev, ...nuevos].slice(0, 5));
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCampos({});

    // Validación básica en el cliente
    const errores: Record<string, string> = {};
    if (!esCliente && !f.cliente_id) errores.cliente_id = 'El cliente es obligatorio';
    if (!f.sede_id) errores.sede_id = 'La sede es obligatoria';
    if (!f.categoria_id) errores.categoria_id = 'La categoría es obligatoria';
    if (!f.prioridad_id) errores.prioridad_id = 'La prioridad es obligatoria';
    if (!f.equipo_afectado.trim()) errores.equipo_afectado = 'El equipo afectado es obligatorio';
    if (f.titulo.trim().length < 5) errores.titulo = 'El título debe tener al menos 5 caracteres';
    if (f.descripcion.trim().length < 10) errores.descripcion = 'La descripción debe tener al menos 10 caracteres';

    if (Object.keys(errores).length) { setCampos(errores); return; }

    setEnviando(true);
    try {
      const datos: SolicitudNueva = {
        sede_id: Number(f.sede_id),
        categoria_id: Number(f.categoria_id),
        prioridad_id: Number(f.prioridad_id),
        titulo: f.titulo.trim(),
        descripcion: f.descripcion.trim(),
        equipo_afectado: f.equipo_afectado.trim(),
        ...(!esCliente && f.cliente_id ? { cliente_id: Number(f.cliente_id) } : {}),
      };
      const sol = await solicitudService.crear(datos, archivos);
      navigate(`/solicitudes/${sol.id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string }; details?: { campo: string; mensaje: string }[] } }; message?: string };
      const detalle = e?.response?.data?.error;
      if (detalle?.message) setError(detalle.message);
      const detalles = e?.response?.data?.details;
      if (Array.isArray(detalles)) {
        const map: Record<string, string> = {};
        detalles.forEach((d) => { map[d.campo] = d.mensaje; });
        setCampos(map);
      }
    } finally {
      setEnviando(false);
    }
  };

  const inputStyle = (campo: string): React.CSSProperties => ({
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${campos[campo] ? '#ef4444' : 'var(--color-border, #e5e7eb)'}`,
    borderRadius: '6px',
    fontSize: '13px',
    backgroundColor: 'var(--color-surface, #fff)',
    color: 'var(--color-text, #374151)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  });

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 500,
    color: 'var(--color-text, #374151)',
    marginBottom: '4px',
  };

  const errorStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#ef4444',
    marginTop: '2px',
  };

  const sedesActivas = sedes.filter((s) => s.activo !== false);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--color-text, #111827)' }}>
          Nueva solicitud de servicio
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #6b7280)', marginTop: '4px' }}>
          Describe el problema y te asignaremos un técnico
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {!esCliente && (
          <div>
            <label style={labelStyle}>Cliente *</label>
            <select
              value={f.cliente_id}
              onChange={(e) => { cambiar('cliente_id')(e); setF((prev) => ({ ...prev, sede_id: '' })); }}
              style={inputStyle('cliente_id')}
              required
            >
              <option value="">Elige el cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.razon_social ?? c.nombre}</option>
              ))}
            </select>
            {campos.cliente_id && <div style={errorStyle}>{campos.cliente_id}</div>}
          </div>
        )}

        <div>
          <label style={labelStyle}>Sede *</label>
          <select value={f.sede_id} onChange={cambiar('sede_id')} style={inputStyle('sede_id')} required disabled={!sedesActivas.length}>
            <option value="">{sedesActivas.length ? 'Elige la sede' : 'Elige primero el cliente'}</option>
            {sedesActivas.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
          {campos.sede_id && <div style={errorStyle}>{campos.sede_id}</div>}
        </div>

        <div>
          <label style={labelStyle}>Categoría *</label>
          <select value={f.categoria_id} onChange={cambiar('categoria_id')} style={inputStyle('categoria_id')} required>
            <option value="">Elige la categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          {campos.categoria_id && <div style={errorStyle}>{campos.categoria_id}</div>}
        </div>

        <div>
          <label style={labelStyle}>Prioridad *</label>
          <select value={f.prioridad_id} onChange={cambiar('prioridad_id')} style={inputStyle('prioridad_id')} required>
            <option value="">Elige la prioridad</option>
            {prioridades.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre ?? p.codigo}{p.horas_plazo ? ` · ${p.horas_plazo} horas` : ''}</option>
            ))}
          </select>
          {campos.prioridad_id && <div style={errorStyle}>{campos.prioridad_id}</div>}
        </div>

        <div>
          <label style={labelStyle}>Equipo o recurso afectado *</label>
          <input
            type="text"
            value={f.equipo_afectado}
            onChange={cambiar('equipo_afectado')}
            placeholder="Ej.: Impresora HP de contabilidad"
            style={inputStyle('equipo_afectado')}
            required
          />
          {campos.equipo_afectado && <div style={errorStyle}>{campos.equipo_afectado}</div>}
        </div>

        <div>
          <label style={labelStyle}>Título *</label>
          <input
            type="text"
            value={f.titulo}
            onChange={cambiar('titulo')}
            placeholder="Resume el problema en una frase"
            style={inputStyle('titulo')}
            required
          />
          {campos.titulo && <div style={errorStyle}>{campos.titulo}</div>}
        </div>

        <div>
          <label style={labelStyle}>Descripción *</label>
          <textarea
            value={f.descripcion}
            onChange={cambiar('descripcion')}
            placeholder="Cuéntanos qué pasa, desde cuándo y qué esperas que se resuelva…"
            rows={4}
            style={{ ...inputStyle('descripcion'), resize: 'vertical' }}
            required
          />
          {campos.descripcion && <div style={errorStyle}>{campos.descripcion}</div>}
        </div>

        {/* Adjuntos */}
        <div>
          <label style={labelStyle}>Archivos adjuntos (opcional)</label>
          <ZonaArchivos alElegir={agregar} deshabilitada={enviando} />
          {archivos.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
              {archivos.map((a, i) => (
                <span
                  key={`${a.name}-${i}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    backgroundColor: 'var(--color-fill-subtle, #f9fafb)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>{a.name}</span>
                  <span style={{ color: 'var(--color-text-muted, #9ca3af)', fontSize: '11px' }}>{formatTamano(a.size)}</span>
                  <button
                    type="button"
                    onClick={() => setArchivos((prev) => prev.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0', lineHeight: 1 }}
                    aria-label={`Quitar ${a.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Link
            to="/solicitudes"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid var(--color-border, #e5e7eb)',
              backgroundColor: 'var(--color-surface, #fff)',
              color: 'var(--color-text, #374151)',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: enviando ? '#93c5fd' : 'var(--color-accent, #3b82f6)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: enviando ? 'not-allowed' : 'pointer',
            }}
          >
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}
