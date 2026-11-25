import { useRef, useState, type DragEvent } from 'react';
import type { Adjunto } from '../types/solicitud.types';
import { solicitudService } from '../services/solicitud.service';

export const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
export const TAMANO_MAXIMO = 5 * 1024 * 1024;
export const MAXIMO_ARCHIVOS = 5;

function formatTamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function motivoRechazo(archivo: File): string | null {
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) return `"${archivo.name}": solo se admiten JPG, PNG, PDF o TXT`;
  if (archivo.size > TAMANO_MAXIMO) return `"${archivo.name}" supera los 5 MB`;
  return null;
}

export function ZonaArchivos({ alElegir, deshabilitada = false }: { alElegir: (archivos: File[]) => void; deshabilitada?: boolean }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [sobre, setSobre] = useState(false);

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setSobre(false);
    if (!deshabilitada) alElegir([...e.dataTransfer.files]);
  };

  return (
    <>
      <div
        style={{
          border: `2px dashed ${sobre ? 'var(--color-accent, #3b82f6)' : 'var(--color-border, #e2e8f0)'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: deshabilitada ? 'not-allowed' : 'pointer',
          opacity: deshabilitada ? 0.5 : 1,
          transition: 'border-color 120ms ease',
        }}
        onClick={() => !deshabilitada && entrada.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setSobre(true); }}
        onDragLeave={() => setSobre(false)}
        onDrop={soltar}
      >
        <div style={{ fontSize: '13px', color: 'var(--color-text, #374151)', marginBottom: 4 }}>
          📎 Arrastra archivos aquí o haz clic para elegirlos
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-muted, #9ca3af)' }}>
          JPG, PNG, PDF o TXT · máximo 5 MB cada uno · hasta {MAXIMO_ARCHIVOS} archivos
        </div>
      </div>
      <input
        ref={entrada}
        type="file"
        multiple
        hidden
        accept=".jpg,.jpeg,.png,.pdf,.txt"
        onChange={(e) => {
          alElegir([...(e.target.files ?? [])]);
          e.target.value = '';
        }}
      />
    </>
  );
}

export function Adjuntos({
  solicitudId,
  adjuntos,
  puedeAdjuntar,
  alCambiar,
}: {
  solicitudId: number;
  adjuntos: Adjunto[];
  puedeAdjuntar: boolean;
  alCambiar: () => void;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subir = async (archivos: File[]) => {
    const rechazo = archivos.map(motivoRechazo).find(Boolean);
    if (rechazo) { setError(rechazo); return; }
    if (!archivos.length) return;
    setSubiendo(true);
    setError(null);
    try {
      await solicitudService.subirAdjuntos(solicitudId, archivos);
      alCambiar();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(err?.response?.data?.error?.message ?? err?.message ?? 'Error al subir archivos');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {error && (
        <div style={{ color: 'var(--color-danger, #ef4444)', fontSize: '12px', padding: '8px', backgroundColor: 'var(--color-danger-soft, #fef2f2)', borderRadius: '6px' }}>
          {error}
        </div>
      )}
      {adjuntos.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {adjuntos.map((a) => (
            <button
              key={a.id}
              type="button"
              title={`${formatTamano(a.tamano_bytes)} · subido por ${a.subido_por_nombre}`}
              onClick={() => solicitudService.descargarAdjunto(solicitudId, a).catch(() => setError('Error al descargar'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid var(--color-border, #e2e8f0)',
                backgroundColor: 'var(--color-surface, #fff)',
                fontSize: '12px',
                cursor: 'pointer',
                maxWidth: '200px',
              }}
            >
              <span>📎</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre_original}</span>
            </button>
          ))}
        </div>
      )}
      {puedeAdjuntar && <ZonaArchivos alElegir={(archivos) => void subir(archivos)} deshabilitada={subiendo} />}
    </div>
  );
}
