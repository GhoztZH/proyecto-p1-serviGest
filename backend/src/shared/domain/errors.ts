/**
 * Errores de aplicación según la especificación docs/api/openapi.yaml.
 * Cada error conoce su código de contrato y su estado HTTP.
 */
export type ErrorCode =
  | 'SOLICITUD_INVALIDA'  // 400
  | 'NO_AUTENTICADO'      // 401
  | 'PROHIBIDO'           // 403
  | 'NO_ENCONTRADO'       // 404
  | 'CONFLICTO'           // 409
  | 'VALIDACION'          // 422
  | 'REGLA_NEGOCIO'       // 422
  | 'DEMASIADOS_INTENTOS' // 429
  | 'ERROR_INTERNO';      // 500

export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

export class AppError extends Error {
  readonly statusCode: number;

  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = status;
  }

  static notFound(message = 'Recurso no encontrado'): AppError {
    return new NotFoundError(message);
  }

  static unauthorized(message = 'No autenticado'): AppError {
    return new UnauthorizedError(message);
  }

  static forbidden(message = 'No tiene permisos para realizar esta acción'): AppError {
    return new ForbiddenError(message);
  }

  static conflict(message = 'Conflicto con el estado actual del recurso'): AppError {
    return new ConflictError(message);
  }

  static validation(message = 'Error de validación', details?: unknown): AppError {
    return new ValidationError(Array.isArray(details) ? details : [{ campo: 'general', mensaje: message }], message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'La solicitud no es válida', details?: unknown) {
    super(400, 'SOLICITUD_INVALIDA', message, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autenticación requerida') {
    super(401, 'NO_AUTENTICADO', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'No tiene permisos para realizar esta operación') {
    super(403, 'PROHIBIDO', message);
  }
}

export class NotFoundError extends AppError {
  constructor(entidad = 'Recurso') {
    super(404, 'NO_ENCONTRADO', entidad.includes(' ') ? entidad : `${entidad} no encontrado`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, 'CONFLICTO', message, details);
  }
}

export class ValidationError extends AppError {
  constructor(details: DetalleValidacion[], message = 'Los datos enviados no son válidos') {
    super(422, 'VALIDACION', message, details);
  }

  static campo(campo: string, mensaje: string): ValidationError {
    return new ValidationError([{ campo, mensaje }]);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, details?: unknown) {
    super(422, 'REGLA_NEGOCIO', message, details);
  }
}
