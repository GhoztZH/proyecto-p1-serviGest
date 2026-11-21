/**
 * Códigos de error estándar según la especificación docs/api/openapi.yaml
 */
export type ErrorCode =
  | 'SOLICITUD_INVALIDA'  // 400
  | 'NO_AUTENTICADO'      // 401
  | 'PROHIBIDO'           // 403
  | 'NO_ENCONTRADO'       // 404
  | 'CONFLICTO'           // 409
  | 'VALIDACION'          // 422
  | 'DEMASIADOS_INTENTOS' // 429
  | 'ERROR_INTERNO';      // 500

/**
 * Clase base para errores controlados del dominio y casos de uso.
 */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(message = 'Recurso no encontrado'): AppError {
    return new AppError('NO_ENCONTRADO', message, 404);
  }

  static unauthorized(message = 'No autenticado'): AppError {
    return new AppError('NO_AUTENTICADO', message, 401);
  }

  static forbidden(message = 'No tiene permisos para realizar esta acción'): AppError {
    return new AppError('PROHIBIDO', message, 403);
  }

  static conflict(message = 'Conflicto con el estado actual del recurso'): AppError {
    return new AppError('CONFLICTO', message, 409);
  }

  static validation(message = 'Error de validación', details?: unknown): AppError {
    return new AppError('VALIDACION', message, 422, details);
  }
}
