import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/errors.js';

/**
 * Middleware centralizado de manejo de errores de Express.
 * Formatea todas las respuestas de error bajo el esquema unificado de openapi.yaml:
 * { "error": { "code": "...", "message": "...", "details": [] } }
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Error no controlado / inesperado
  console.error('Error no controlado:', err);
  res.status(500).json({
    error: {
      code: 'ERROR_INTERNO',
      message: 'Ocurrió un error interno en el servidor',
    },
  });
}
