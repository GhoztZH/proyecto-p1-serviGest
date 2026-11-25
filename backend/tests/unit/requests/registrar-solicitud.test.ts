import { describe, expect, it, vi } from 'vitest';
import type { Clock, EventosSolicitud, HistorialSolicitudes, ParametrosOperativos } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { BusinessRuleError } from '../../../src/shared/domain/errors.js';
import type { Solicitud } from '../../../src/modules/requests/domain/entities/solicitud.js';
import type { AlmacenAdjuntos, SolicitudRepository } from '../../../src/modules/requests/domain/interfaces/solicitud.repository.js';
import { RegistrarSolicitudUseCase, type SolicitudEntrada } from '../../../src/modules/requests/application/use-cases/registrar-solicitud.js';
import type { SolicitudDeps } from '../../../src/modules/requests/application/dto/solicitud.dto.js';

const now = new Date('2025-01-01T00:00:00.000Z');
const cliente: AuthUser = {
  id: 70,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE',
  clienteId: 7,
  tecnicoId: null,
};

const solicitudCreada: Solicitud = {
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

function makeDependencies(sedeClienteId = cliente.clienteId!) {
  const repo: SolicitudRepository = {
    buscar: vi.fn(async () => solicitudCreada),
    listar: vi.fn(async () => ({ filas: [], total: 0 })),
    referencias: vi.fn(async () => ({
      cliente: { activo: true },
      sede: { activo: true, cliente_id: sedeClienteId },
      categoria: { activo: true },
      prioridad: { horas_plazo: 24 },
    })),
    horasPlazo: vi.fn(async () => 24),
    buscarDuplicadaAbierta: vi.fn(async () => undefined),
    crear: vi.fn(async () => solicitudCreada.id),
    actualizar: vi.fn(async () => {}),
    listarAdjuntos: vi.fn(async () => []),
    contarAdjuntos: vi.fn(async () => 0),
    crearAdjunto: vi.fn(async () => {}),
    buscarAdjunto: vi.fn(async () => undefined),
  };
  const historial: HistorialSolicitudes = {
    registrar: vi.fn(async () => {}),
    listar: vi.fn(async () => []),
  };
  const eventos: EventosSolicitud = { publicar: vi.fn(async () => {}) };
  const parametros: ParametrosOperativos = { numero: vi.fn(async () => 25) };
  const clock: Clock = { now: () => now };
  const uow: UnitOfWork = {
    run: vi.fn(async (work) => work()),
    afterCommit: vi.fn(),
  };
  const deps: SolicitudDeps = { repo, historial, eventos, parametros, clock, uow };
  const almacen: AlmacenAdjuntos = {
    rutaDe: (nombre) => nombre,
    descartar: vi.fn(async () => {}),
    firmaValida: vi.fn(async () => true),
  };
  return { deps, repo, historial, eventos, almacen, uow };
}

const entrada: SolicitudEntrada = {
  sede_id: 9,
  categoria_id: 2,
  prioridad_id: 1,
  titulo: 'Equipo sin conexión',
  descripcion: 'El equipo no logra conectarse a la red.',
  equipo_afectado: 'Router 3',
};

describe('register service request use case', () => {
  it('uses the authenticated customer profile and writes request, history and event atomically', async () => {
    const { deps, repo, historial, eventos, almacen, uow } = makeDependencies();

    const result = await new RegistrarSolicitudUseCase(deps, almacen).execute(cliente, entrada);

    expect(result.id).toBe(77);
    expect(result.estado_plazo).toBe('A_TIEMPO');
    expect(repo.crear).toHaveBeenCalledWith(expect.objectContaining({ clienteId: 7, creadoPor: cliente.id }));
    expect(historial.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ solicitudId: 77, usuarioId: cliente.id, accion: 'CREACION', estadoNuevo: 'REGISTRADA' }),
    );
    expect(eventos.publicar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'REGISTRO', actorId: cliente.id, solicitud: expect.objectContaining({ clienteId: 7 }) }),
    );
    expect(uow.run).toHaveBeenCalledOnce();
  });

  it('rejects a sede that belongs to another customer before creating anything', async () => {
    const { deps, repo, eventos, almacen } = makeDependencies(8);

    await expect(new RegistrarSolicitudUseCase(deps, almacen).execute(cliente, entrada)).rejects.toBeInstanceOf(
      BusinessRuleError,
    );

    expect(repo.crear).not.toHaveBeenCalled();
    expect(eventos.publicar).not.toHaveBeenCalled();
  });
});
