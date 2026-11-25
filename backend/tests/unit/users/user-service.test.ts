import { describe, expect, it, vi } from 'vitest';
import type { AuditLogger, PasswordHasher } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { Usuario, UserRepository } from '../../../src/modules/users/domain/user.types.js';
import { UserService } from '../../../src/modules/users/application/user.service.js';

const admin: Usuario = {
  id: 17,
  email: 'admin@example.test',
  nombre: 'Admin',
  rol: 'ADMIN',
  activo: true,
  ultimo_acceso: null,
  created_at: new Date('2025-01-01T00:00:00Z'),
  updated_at: new Date('2025-01-01T00:00:00Z'),
};

function makeRepository(overrides: Partial<UserRepository> = {}): UserRepository {
  return {
    listar: vi.fn(async () => ({ filas: [], total: 0 })),
    buscarPorId: vi.fn(async () => admin),
    buscarCredencialesPorEmail: vi.fn(async () => undefined),
    buscarCredencialesPorId: vi.fn(async () => undefined),
    existeEmail: vi.fn(async () => false),
    crear: vi.fn(async () => admin.id),
    actualizar: vi.fn(async () => {}),
    cambiarPassword: vi.fn(async () => {}),
    registrarAcceso: vi.fn(async () => {}),
    contarAdminsActivos: vi.fn(async () => 1),
    eliminarSiSinRastro: vi.fn(async () => false),
    idsActivosPorRol: vi.fn(async () => []),
    ...overrides,
  };
}

describe('user service', () => {
  it('creates an internal account with a password hash and audit record in one unit of work', async () => {
    const repo = makeRepository();
    const hasher: PasswordHasher = {
      hash: vi.fn(async () => 'stored-hash'),
      verify: vi.fn(async () => true),
    };
    const audit: AuditLogger = { registrar: vi.fn(async () => {}) };
    const uow: UnitOfWork = {
      run: vi.fn(async (work) => work()),
      afterCommit: vi.fn(),
    };
    const service = new UserService(repo, hasher, audit, uow);

    const result = await service.crearInterno(
      { nombre: 'Admin', email: 'admin@example.test', password: 'StrongPass9', rol: 'ADMIN' },
      {
        actor: { id: 3, email: 'root@example.test', nombre: 'Root', rol: 'ADMIN', clienteId: null, tecnicoId: null },
        ip: '127.0.0.1',
      },
    );

    expect(result).toEqual(admin);
    expect(repo.crear).toHaveBeenCalledWith({
      email: 'admin@example.test',
      passwordHash: 'stored-hash',
      nombre: 'Admin',
      rol: 'ADMIN',
    });
    expect(uow.run).toHaveBeenCalledOnce();
    expect(audit.registrar).toHaveBeenCalledWith(expect.objectContaining({ accion: 'CREAR', entidadId: admin.id }));
  });

  it('deactivates an account when operational records prevent deletion', async () => {
    const repo = makeRepository({ eliminarSiSinRastro: vi.fn(async () => false) });
    const service = new UserService(
      repo,
      { hash: vi.fn(async () => 'hash'), verify: vi.fn(async () => true) },
      { registrar: vi.fn(async () => {}) },
      { run: async (work) => work(), afterCommit: () => {} },
    );

    await service.eliminarODesactivar(admin.id);

    expect(repo.actualizar).toHaveBeenCalledWith(admin.id, { activo: false });
  });
});
