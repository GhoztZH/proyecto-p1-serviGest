import { describe, expect, it, vi } from 'vitest';
import type { Clock, EventosSolicitud, HistorialSolicitudes, ParametrosOperativos } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { BusinessRuleError } from '../../../src/shared/domain/errors.js';
import type { Solicitud } from '../../../src/modules/requests/domain/entities/solicitud.js';
import type { SolicitudRepository } from '../../../src/modules/requests/domain/interfaces/solicitud.repository.js';
import { CambiarEstadoUseCase } from '../../../src/modules/requests/application/use-cases/cambiar-estado.js';
import type { SolicitudDeps } from '../../../src/modules/requests/application/dto/solicitud.dto.js';

const now = new Date('2025-03-01T12:00:00Z');
const admin: AuthUser = {
  id: 1,
  email: 'admin@example.test',
  nombre: 'Admin',
  rol: 'ADMIN',
  clienteId: null,
  tecnicoId: null,
};

const base: Solicitud = {
  id: 81,
  codigo: 'SG-00081',
  titulo: 'Revisar equipo',
  descripcion: 'Equipo requiere revisión.',
  equipo_afectado: 'Terminal 2',
  cliente_id: 7,
  cliente_nombre: 'Empresa',
  sede_id: 9,
  sede_nombre: 'Sede central',
  categoria_id: 2,
  categoria_nombre: 'Redes',
  especialidad_id: 4,
  prioridad_id: 1,
  prioridad: 'MEDIA',
  prioridad_solicitada: 'MEDIA',
  horas_plazo: 24,
  estado: 'ASIGNADA',
  tecnico_id: 8,
  tecnico_nombre: 'Técnico',
  resolucion: null,
  fecha_limite: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  fecha_resolucion: null,
  fecha_cierre: null,
  creado_por: 70,
  version: 1,
  created_at: now,
};

function makeDependencies() {
  const updated = { ...base, estado: 'EN_PROCESO' as const };
  const repo: SolicitudRepository = {
    buscar: vi.fn().mockResolvedValueOnce(base).mockResolvedValueOnce(updated),
    listar: vi.fn(async () => ({ filas: [], total: 0 })),
    referencias: vi.fn(async () => ({})),
    horasPlazo: vi.fn(async () => 24),
    buscarDuplicadaAbierta: vi.fn(async () => undefined),
    crear: vi.fn(async () => base.id),
    actualizar: vi.fn(async () => {}),
    listarAdjuntos: vi.fn(async () => []),
    contarAdjuntos: vi.fn(async () => 0),
    crearAdjunto: vi.fn(async () => {}),
    buscarAdjunto: vi.fn(async () => undefined),
  };
  const historial: HistorialSolicitudes = { registrar: vi.fn(async () => {}), listar: vi.fn(async () => []) };
  const eventos: EventosSolicitud = { publicar: vi.fn(async () => {}) };
  const parametros: ParametrosOperativos = { numero: vi.fn(async () => 25) };
  const clock: Clock = { now: () => now };
  const uow: UnitOfWork = { run: vi.fn(async (work) => work()), afterCommit: vi.fn() };
  const deps: SolicitudDeps = { repo, historial, eventos, parametros, clock, uow };
  return { deps, repo, historial, eventos, uow };
}

describe('change request state use case', () => {
  it('updates state and publishes history and event within one unit of work', async () => {
    const { deps, repo, historial, eventos, uow } = makeDependencies();

    const result = await new CambiarEstadoUseCase(deps).execute(admin, base.id, { estado: 'EN_PROCESO' });

    expect(result.estado).toBe('EN_PROCESO');
    expect(repo.buscar).toHaveBeenCalledWith(base.id, { bloquear: true });
    expect(repo.actualizar).toHaveBeenCalledWith(base.id, { estado: 'EN_PROCESO' });
    expect(historial.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ estadoAnterior: 'ASIGNADA', estadoNuevo: 'EN_PROCESO' }),
    );
    expect(eventos.publicar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'CAMBIO_ESTADO', estadoAnterior: 'ASIGNADA' }),
    );
    expect(uow.run).toHaveBeenCalledOnce();
  });

  it('rejects resolving a request without a sufficiently descriptive resolution', async () => {
    const { deps, repo, eventos } = makeDependencies();

    await expect(
      new CambiarEstadoUseCase(deps).execute(admin, base.id, { estado: 'RESUELTA', resolucion: 'short' }),
    ).rejects.toBeInstanceOf(BusinessRuleError);

    expect(repo.actualizar).not.toHaveBeenCalled();
    expect(eventos.publicar).not.toHaveBeenCalled();
  });
});
