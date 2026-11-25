import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorCode } from '../domain/errors.js';

interface CuerpoError {
  error: { code: ErrorCode; message: string; details?: unknown };
}

function cuerpo(code: ErrorCode, message: string, details?: unknown): CuerpoError {
  return { error: details === undefined ? { code, message } : { code, message, details } };
}

function desdePostgres(error: { code?: string }): { status: number; body: CuerpoError } | null {
  switch (error.code) {
    case '23505':
      return { status: 409, body: cuerpo('CONFLICTO', 'Ya existe un registro con esos datos') };
    case '23503':
      return { status: 409, body: cuerpo('CONFLICTO', 'La operación viola la integridad referencial: existen registros relacionados') };
    case '23514':
    case '23502':
    case '22001':
      return { status: 422, body: cuerpo('VALIDACION', 'Los datos no cumplen las restricciones del modelo') };
    case 'P0001':
      return { status: 409, body: cuerpo('CONFLICTO', 'El registro es inalterable') };
    default:
      return null;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json(cuerpo(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ campo: issue.path.join('.'), mensaje: issue.message }));
    res.status(422).json(cuerpo('VALIDACION', 'Error de validación en los datos', details));
    return;
  }

  if (typeof err === 'object' && err !== null && 'code' in err) {
    const mapeado = desdePostgres(err as { code?: string });
    if (mapeado) {
      res.status(mapeado.status).json(mapeado.body);
      return;
    }
  }

  console.error('Error no controlado:', err);
  res.status(500).json(cuerpo('ERROR_INTERNO', 'Ocurrió un error interno en el servidor'));
}
