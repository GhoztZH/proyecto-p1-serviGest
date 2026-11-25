import { esGestion, type AuthUser } from '../../../../shared/domain/auth-user.js';
import { BusinessRuleError, ForbiddenError, ValidationError } from '../../../../shared/domain/errors.js';
import type { Estado } from '../../../../shared/domain/estados.js';
import type { DatosAcceso } from './acceso.js';

/** Mapa de transiciones válidas de la máquina de estados. */
const TRANSICIONES: Readonly<Record<Estado, readonly Estado[]>> = {
  REGISTRADA:      ['APROBADA', 'CANCELADA'],
  APROBADA:        ['ASIGNADA', 'CANCELADA'],
  ASIGNADA:        ['EN_PROCESO', 'PENDIENTE_INFO', 'CANCELADA'],
  EN_PROCESO:      ['RESUELTA', 'PENDIENTE_INFO', 'CANCELADA'],
  PENDIENTE_INFO:  ['EN_PROCESO', 'CANCELADA'],
  RESUELTA:        ['CERRADA', 'EN_PROCESO'],
  CERRADA:         [],
  CANCELADA:       [],
};

/** Transiciones que puede hacer el técnico asignado. */
const SOLO_TECNICO: Readonly<Partial<Record<Estado, readonly Estado[]>>> = {
  ASIGNADA:    ['EN_PROCESO'],
  EN_PROCESO:  ['RESUELTA', 'PENDIENTE_INFO'],
  PENDIENTE_INFO: ['EN_PROCESO'],
};

/** Transiciones que puede hacer el cliente dueño. */
const SOLO_CLIENTE: Readonly<Partial<Record<Estado, readonly Estado[]>>> = {
  REGISTRADA: ['CANCELADA'],
  APROBADA:   ['CANCELADA'],
  ASIGNADA:   ['CANCELADA'],
};

export function transicionesPermitidas(user: AuthUser, s: DatosAcceso): Estado[] {
  const validas = TRANSICIONES[s.estado] ?? [];
  if (!validas.length) return [];

  if (esGestion(user)) return [...validas];
  if (user.rol === 'TECNICO' && user.tecnicoId === s.tecnico_id) {
    return (SOLO_TECNICO[s.estado] ?? []).filter((e) => validas.includes(e));
  }
  if (user.rol === 'CLIENTE' && user.clienteId === s.cliente_id) {
    return (SOLO_CLIENTE[s.estado] ?? []).filter((e) => validas.includes(e));
  }
  return [];
}

export function validarTransicion(user: AuthUser, s: DatosAcceso, destino: Estado): void {
  const permitidas = transicionesPermitidas(user, s);
  if (!permitidas.includes(destino)) {
    if (!TRANSICIONES[s.estado]?.includes(destino)) {
      throw new BusinessRuleError(`No se puede pasar de ${s.estado} a ${destino}`);
    }
    throw new ForbiddenError('No tiene permisos para realizar esta transición');
  }
}

const MIN_MOTIVO_REAPERTURA = 10;

export function validarResolucion(resolucion: string | null | undefined, destino: Estado): string {
  const regla: Estado = 'RESUELTA';
  if (destino === regla && (!resolucion || resolucion.trim().length < 10)) {
    throw new BusinessRuleError('No se puede cerrar una solicitud sin una resolución documentada');
  }
  return regla;
}

/** Regla 4: la reapertura es exclusiva de ADMIN/COORDINADOR, solo sobre solicitudes cerradas y con motivo. */
export function validarReapertura(user: AuthUser, s: DatosAcceso, motivo: string): void {
  if (!esGestion(user)) throw new ForbiddenError('Solo un administrador o coordinador puede reabrir una solicitud');
  if (s.estado !== 'CERRADA') throw new BusinessRuleError('Solo se puede reabrir una solicitud cerrada');
  if (motivo.trim().length < MIN_MOTIVO_REAPERTURA) {
    throw ValidationError.campo('motivo', `Justifique la reapertura (mínimo ${MIN_MOTIVO_REAPERTURA} caracteres)`);
  }
}

/** La solicitud reabierta vuelve a manos del técnico si conserva uno; si no, queda lista para asignar. */
export function estadoTrasReapertura(s: Pick<DatosAcceso, 'tecnico_id'>): Estado {
  return s.tecnico_id ? 'EN_PROCESO' : 'APROBADA';
}
