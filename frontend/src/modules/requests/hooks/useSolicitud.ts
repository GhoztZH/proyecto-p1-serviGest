import { useCallback, useEffect, useRef, useState } from 'react';
import type { Estado, SolicitudDetalle, HistorialItem } from '../types/solicitud.types';
import { solicitudService } from '../services/solicitud.service';

interface ConsultaState<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

function useConsulta<T>(fn: () => Promise<T>, deps: unknown[]): ConsultaState<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    fnRef.current()
      .then((d) => { if (!cancelado) { setDatos(d); setCargando(false); } })
      .catch((e) => { if (!cancelado) { setError(e?.response?.data?.error?.message ?? e?.message ?? 'Error desconocido'); setCargando(false); } });
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const recargar = useCallback(() => setTick((t) => t + 1), []);
  return { datos, cargando, error, recargar };
}

/**
 * Detalle e historial de una solicitud, siempre al día.
 */
export function useSolicitud(id: number) {
  const detalle = useConsulta<SolicitudDetalle>(() => solicitudService.detalle(id), [id]);
  const historial = useConsulta<HistorialItem[]>(() => solicitudService.historial(id), [id]);
  const recargar = useCallback(() => {
    detalle.recargar();
    historial.recargar();
  }, [detalle, historial]);
  return { detalle, historial, recargar };
}

export interface CambioEstado {
  estado: Estado;
  comentario?: string;
  resolucion?: string;
  prioridad_id?: number;
}

/**
 * Ejecuta una operación sobre la solicitud con manejo de errores uniforme.
 */
export function useCambioSolicitud(alCambiar: () => void) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ejecutar = useCallback(
    async (fn: () => Promise<unknown>) => {
      setCargando(true);
      setError(null);
      try {
        await fn();
        alCambiar();
      } catch (e: unknown) {
        const err = e as { response?: { data?: { error?: { message?: string } } }; message?: string };
        setError(err?.response?.data?.error?.message ?? err?.message ?? 'Error al realizar la operación');
      } finally {
        setCargando(false);
      }
    },
    [alCambiar],
  );

  return { cargando, error, ejecutar };
}
