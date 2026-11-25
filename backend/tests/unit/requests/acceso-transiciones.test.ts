import { describe, expect, it } from 'vitest';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { BusinessRuleError, ForbiddenError } from '../../../src/shared/domain/errors.js';
import { puedeAportar, puedeVerSolicitud } from '../../../src/modules/requests/domain/rules/acceso.js';
import { transicionesPermitidas, validarTransicion } from '../../../src/modules/requests/domain/rules/transiciones.js';

const cliente: AuthUser = {
  id: 70,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE',
  clienteId: 7,
  tecnicoId: null,
};

const tecnico: AuthUser = {
  id: 80,
  email: 'tecnico@example.test',
  nombre: 'Técnico',
  rol: 'TECNICO',
  clienteId: null,
  tecnicoId: 8,
};

const admin: AuthUser = {
  id: 1,
  email: 'admin@example.test',
  nombre: 'Admin',
  rol: 'ADMIN',
  clienteId: null,
  tecnicoId: null,
};

const solicitud = {
  cliente_id: 7,
  tecnico_id: 8,
  estado: 'ASIGNADA' as const,
};

describe('request access rules', () => {
  it('scopes customer and technician access to their own service request', () => {
    expect(puedeVerSolicitud(cliente, solicitud)).toBe(true);
    expect(puedeVerSolicitud({ ...cliente, clienteId: 9 }, solicitud)).toBe(false);
    expect(puedeVerSolicitud(tecnico, solicitud)).toBe(true);
    expect(puedeVerSolicitud({ ...tecnico, tecnicoId: 9 }, solicitud)).toBe(false);
    expect(puedeVerSolicitud(admin, solicitud)).toBe(true);
  });

  it('prevents contributions once a request is closed or cancelled', () => {
    expect(puedeAportar(cliente, solicitud)).toBe(true);
    expect(puedeAportar(cliente, { ...solicitud, estado: 'CERRADA' })).toBe(false);
    expect(puedeAportar(cliente, { ...solicitud, estado: 'CANCELADA' })).toBe(false);
  });

  it('limits customer and technician transitions while allowing management actions', () => {
    expect(transicionesPermitidas(cliente, solicitud)).toEqual(['CANCELADA']);
    expect(transicionesPermitidas(tecnico, solicitud)).toEqual(['EN_PROCESO']);
    expect(transicionesPermitidas(admin, solicitud)).toContain('PENDIENTE_INFO');
    expect(() => validarTransicion(cliente, solicitud, 'EN_PROCESO')).toThrow(ForbiddenError);
    expect(() => validarTransicion(admin, solicitud, 'CERRADA')).toThrow(BusinessRuleError);
  });
});
