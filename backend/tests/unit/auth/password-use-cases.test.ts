import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { AuditLogger, Clock, PasswordHasher } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { BusinessRuleError, ValidationError } from '../../../src/shared/domain/errors.js';
import type { CuentaConCredenciales, CredencialesUsuario, SessionRepository } from '../../../src/modules/auth/domain/auth.types.js';
import {
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  UpdateProfileUseCase,
} from '../../../src/modules/auth/application/password.use-cases.js';

const cuenta: CuentaConCredenciales = {
  id: 22,
  email: 'user@example.test',
  nombre: 'Usuario',
  rol: 'ADMIN',
  activo: true,
  password_hash: 'old-hash',
  cliente_id: null,
  tecnico_id: null,
};

const authUser: AuthUser = {
  id: cuenta.id,
  email: cuenta.email,
  nombre: cuenta.nombre,
  rol: cuenta.rol,
  clienteId: null,
  tecnicoId: null,
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

function makeSessions(overrides: Partial<SessionRepository> = {}): SessionRepository {
  return {
    revocar: vi.fn(async () => {}),
    estaRevocado: vi.fn(async () => false),
    purgarRevocadosExpirados: vi.fn(async () => {}),
    crearRestablecimiento: vi.fn(async () => {}),
    consumirRestablecimiento: vi.fn(async () => cuenta.id),
    ...overrides,
  };
}

const makeHasher = (): PasswordHasher => ({
  hash: vi.fn(async (plain) => `hashed:${plain}`),
  verify: vi.fn(async () => true),
});

const makeUnitOfWork = (): UnitOfWork => ({
  run: vi.fn(async (work) => work()),
  afterCommit: vi.fn(),
});

describe('password and profile use cases', () => {
  it('changes a password only after verifying the current password', async () => {
    const accounts = makeAccounts();
    const hasher = makeHasher();
    const audit: AuditLogger = { registrar: vi.fn(async () => {}) };
    const useCase = new ChangePasswordUseCase(accounts, hasher, audit, makeUnitOfWork());

    await useCase.execute(authUser, 'old-password', 'new-password', '127.0.0.1');

    expect(accounts.cambiarPassword).toHaveBeenCalledWith(cuenta.id, 'hashed:new-password');
    expect(audit.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CAMBIAR_PASSWORD', ip: '127.0.0.1' }));

    vi.mocked(hasher.verify).mockResolvedValueOnce(false);
    await expect(useCase.execute(authUser, 'wrong-password', 'another-password')).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(accounts.cambiarPassword).toHaveBeenCalledTimes(1);
  });

  it('stores only a hashed reset token and consumes it when resetting the password', async () => {
    const accounts = makeAccounts();
    const sessions = makeSessions();
    const now = new Date('2025-02-01T10:00:00Z');
    const clock: Clock = { now: () => now };
    const reset = new ForgotPasswordUseCase(accounts, sessions, clock, 2, true);
    const created = await reset.execute(cuenta.email);

    expect(created.tokenDesarrollo).toMatch(/^[a-f0-9]{64}$/);
    const tokenHash = createHash('sha256').update(created.tokenDesarrollo!).digest('hex');
    expect(sessions.crearRestablecimiento).toHaveBeenCalledWith(
      cuenta.id,
      tokenHash,
      new Date(now.getTime() + 2 * 60 * 60 * 1000),
    );

    const audit: AuditLogger = { registrar: vi.fn(async () => {}) };
    const hasher = makeHasher();
    await new ResetPasswordUseCase(accounts, sessions, hasher, audit, makeUnitOfWork()).execute(
      created.tokenDesarrollo!,
      'new-password',
    );

    expect(sessions.consumirRestablecimiento).toHaveBeenCalledWith(tokenHash);
    expect(accounts.cambiarPassword).toHaveBeenCalledWith(cuenta.id, 'hashed:new-password');
    expect(audit.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'RESTABLECER_PASSWORD_TOKEN' }));

    vi.mocked(sessions.consumirRestablecimiento).mockResolvedValueOnce(undefined);
    await expect(
      new ResetPasswordUseCase(accounts, sessions, hasher, audit, makeUnitOfWork()).execute('expired-token', 'new-pass'),
    ).rejects.toBeInstanceOf(BusinessRuleError);
  });

  it('updates profile details transactionally and returns the persisted profile', async () => {
    const updatedAccount = { ...cuenta, nombre: 'Nuevo nombre' };
    const accounts = makeAccounts({
      buscarCredencialesPorId: vi.fn().mockResolvedValueOnce(updatedAccount),
    });
    const audit: AuditLogger = { registrar: vi.fn(async () => {}) };
    const uow = makeUnitOfWork();

    const result = await new UpdateProfileUseCase(accounts, audit, uow).execute(authUser, 'Nuevo nombre');

    expect(accounts.actualizar).toHaveBeenCalledWith(cuenta.id, { nombre: 'Nuevo nombre' });
    expect(result.nombre).toBe('Nuevo nombre');
    expect(uow.run).toHaveBeenCalledOnce();
    expect(audit.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'ACTUALIZAR_PERFIL' }));
  });
});
