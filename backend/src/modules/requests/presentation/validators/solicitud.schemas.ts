import { z } from 'zod';
import { ESTADOS, type Estado } from '../../../../shared/domain/estados.js';

const MIN_MOTIVO_REAPERTURA = 10;

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato YYYY-MM-DD requerido');

function listaDe<T extends string>(valores: readonly T[], msg: string) {
  return z.string().transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((s): s is T => (valores as readonly string[]).includes(s))
  );
}

const idOpcional = z.coerce.number().int().min(1).optional();

const textoRequerido = (campo: string, min: number, max: number) =>
  z
    .string({ error: `${campo} es obligatorio` })
    .trim()
    .min(min, min === 1 ? `${campo} es obligatorio` : `Mínimo ${min} caracteres`)
    .max(max, `Máximo ${max} caracteres`);

const enteroPositivo = (campo: string) =>
  z.coerce.number({ error: `${campo} debe ser un número` }).int(`${campo} debe ser un entero`).min(1, `${campo} es obligatorio`);

export const filtroSolicitudesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    estado: listaDe<Estado>(ESTADOS, 'Estado inválido').optional(),
    prioridad: listaDe(['BAJA', 'MEDIA', 'ALTA', 'CRITICA'] as const, 'Prioridad inválida').optional(),
    categoria_id: idOpcional,
    sede_id: idOpcional,
    cliente_id: idOpcional,
    tecnico_id: idOpcional,
    desde: fecha.optional(),
    hasta: fecha.optional(),
    q: z.string().trim().max(100).optional(),
    vencimiento: z.enum(['vencida', 'por_vencer'], { error: 'Use vencida o por_vencer' }).optional(),
    orden: z.enum(['recientes', 'antiguas', 'vencimiento', 'prioridad'], { error: 'Orden inválido' }).optional(),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, { path: ['hasta'], message: 'Debe ser posterior a la fecha inicial' });

/** Sirve para JSON y para `multipart/form-data` (donde los números llegan como texto). */
export const solicitudNuevaSchema = z.object({
  cliente_id: idOpcional,
  sede_id: enteroPositivo('La sede'),
  categoria_id: enteroPositivo('La categoría'),
  prioridad_id: enteroPositivo('La prioridad'),
  titulo: textoRequerido('El título', 5, 150),
  descripcion: textoRequerido('La descripción', 10, 5000),
  equipo_afectado: textoRequerido('El equipo o recurso afectado', 2, 150),
});

export const cambioEstadoSchema = z.object({
  estado: z.enum(ESTADOS, { error: 'Estado inválido' }),
  comentario: z.string().trim().max(2000, 'Máximo 2000 caracteres').nullish(),
  resolucion: z.string().trim().max(5000, 'Máximo 5000 caracteres').nullish(),
  prioridad_id: idOpcional,
  version: z.coerce.number().int().min(1).optional(),
});

export const reaperturaSchema = z.object({
  motivo: textoRequerido('El motivo', MIN_MOTIVO_REAPERTURA, 2000),
});

export const comentarioSchema = z.object({
  comentario: textoRequerido('El comentario', 2, 2000),
});
