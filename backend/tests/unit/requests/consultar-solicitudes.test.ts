import { describe, expect, it, vi } from 'vitest';
import type { HistorialSolicitudes, EventosSolicitud, ParametrosOperativos, Clock } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { NotFoundError } from '../../../src/shared/domain/errors.js';
import type { Solicitud } from '../../../src/modules/requests/domain/entities/solicitud.js';
import type { AsignacionesLectura, SolicitudRepository } from '../../../src/modules/requests/domain/interfaces/solicitud.repository.js';
import { ConsultarSolicitudesUseCase } from '../../../src/modules/requests/application/use-cases/consultar-solicitudes.js';
import type { SolicitudDeps } from '../../../src/modules/requests/application/dto/solicitud.dto.js';

const now = new Date('2025-03-01T12:00:00Z');
const cliente: AuthUser = {
  id: 70,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE',
  clienteId: 7,
  tecnicoId: null,
};

const solicitud: Solicitud = {
  id: 77,
  codigo: 'SG-00077',
  titulo: 'Equipo sin conexión',
  descripcion: 'El equipo no logra conectarse a la red.',
  equipo_afectado: 'Router 3',
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
  estado: 'REGISTRADA',
  tecnico_id: null,
  tecnico_nombre: null,
  resolucion: null,
  fecha_limite: new Date(now.getTime() + 24 * 60 * 60 * 1000),
  fecha_resolucion: null,
  fecha_cierre: null,
  creado_por: cliente.id,
  version: 1,
  created_at: now,
};

function makeUseCase() {
  const repo: SolicitudRepository = {
    buscar: vi.fn(async () => solicitud),
    listar: vi.fn(async () => ({ filas: [solicitud], total: 21 })),
    referencias: vi.fn(async () => ({})),
    horasPlazo: vi.fn(async () => 24),
    buscarDuplicadaAbierta: vi.fn(async () => undefined),
    crear: vi.fn(async () => solicitud.id),
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
  const asignaciones: AsignacionesLectura = { listarPorSolicitud: vi.fn(async () => []) };
  return { useCase: new ConsultarSolicitudesUseCase(deps, asignaciones, 'America/Guayaquil'), repo };
}

describe('request queries', () => {
  it('applies the customer scope in SQL filters and preserves pagination metadata', async () => {
    const { useCase, repo } = makeUseCase();

    const result = await useCase.listar(cliente, { page: 2, limit: 10 });

    expect(repo.listar).toHaveBeenCalledWith(
      expect.objectContaining({ alcance: { clienteId: 7 }, offset: 10, limit: 10, zonaHoraria: 'America/Guayaquil' }),
    );
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 21, totalPages: 3 });
    expect(result.data[0]?.estado_plazo).toBe('A_TIEMPO');
  });

  it('returns an empty result without querying for an unlinked customer account', async () => {
    const { useCase, repo } = makeUseCase();

    const result = await useCase.listar({ ...cliente, clienteId: null }, { page: 1, limit: 10 });

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(repo.listar).not.toHaveBeenCalled();
  });

  it('hides requests belonging to another customer when loading details', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.detalle({ ...cliente, clienteId: 99 }, solicitud.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
