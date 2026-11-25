import { describe, expect, it, vi } from 'vitest';
import type { AuditLogger, PasswordHasher } from '../../../src/shared/application/ports.js';
import { UnauthorizedError } from '../../../src/shared/domain/errors.js';
import { alcanceDe } from '../../../src/modules/requests/domain/rules/acceso.js';
import type { CuentaConCredenciales, CredencialesUsuario, SessionRepository, TokenService } from '../../../src/modules/auth/domain/auth.types.js';
import { LoginUseCase, ResolveSessionUseCase } from '../../../src/modules/auth/application/session.use-cases.js';

const cuenta: CuentaConCredenciales = {
  id: 42,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE',
  activo: true,
  password_hash: 'hash-guardado',
  cliente_id: 7,
  tecnico_id: null,
};

function makeAccounts(overrides: Partial<CredencialesUsuario> = {}): CredencialesUsuario {
  return {
    buscarCredencialesPorEmail: vi.fn(async () => cuenta),
    buscarCredencialesPorId: vi.fn(async () => cuenta),
    cambiarPassword: vi.fn(async () => {}),
    registrarAcceso: vi.fn(async () => {}),
    actualizar: vi.fn(async () => {}),
    ...overrides,
  };
}

describe('authentication use cases', () => {
  it('authenticates valid credentials, records access and returns the profile', async () => {
    const accounts = makeAccounts();
    const hasher: PasswordHasher = {
      hash: vi.fn(async () => 'hash'),
      verify: vi.fn(async () => true),
    };
    const tokenService: TokenService = {
      emitir: vi.fn(() => ({ token: 'signed-token', jti: 'jti-1', expiraEn: new Date('2030-01-01T00:00:00Z') })),
      verificar: vi.fn(),
    };
    const audit: AuditLogger = { registrar: vi.fn(async () => {}) };

    const result = await new LoginUseCase(accounts, hasher, tokenService, audit).execute(
      cuenta.email,
      'valid-password',
      '127.0.0.1',
    );

    expect(result).toEqual({
      token: 'signed-token',
      usuario: {
        id: 42,
        email: cuenta.email,
        nombre: cuenta.nombre,
        rol: 'CLIENTE',
        clienteId: 7,
        tecnicoId: null,
      },
    });
    expect(accounts.registrarAcceso).toHaveBeenCalledWith(42);
    expect(audit.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'LOGIN', ip: '127.0.0.1' }));
  });

  it('resolves revoked sessions as unauthenticated and carries the client identity into requests', async () => {
    const accounts = makeAccounts();
    const tokens: TokenService = {
      emitir: vi.fn(),
      verificar: vi.fn(() => ({
        usuarioId: 42,
        jti: 'revoked-jti',
        expiraEn: new Date('2030-01-01T00:00:00Z'),
      })),
    };
    const sessions: SessionRepository = {
      revocar: vi.fn(async () => {}),
      estaRevocado: vi.fn(async () => false),
      purgarRevocadosExpirados: vi.fn(async () => {}),
      crearRestablecimiento: vi.fn(async () => {}),
      consumirRestablecimiento: vi.fn(async () => undefined),
    };

    const resolved = await new ResolveSessionUseCase(accounts, sessions, tokens).execute('signed-token');
    expect(alcanceDe(resolved.user)).toEqual({ clienteId: 7 });

    vi.mocked(sessions.estaRevocado).mockResolvedValueOnce(true);
    await expect(new ResolveSessionUseCase(accounts, sessions, tokens).execute('signed-token')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    expect(accounts.buscarCredencialesPorId).toHaveBeenCalledTimes(1);
  });
});
