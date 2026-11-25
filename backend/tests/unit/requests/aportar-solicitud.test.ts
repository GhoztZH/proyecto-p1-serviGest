import { describe, expect, it, vi } from 'vitest';
import type { EventosSolicitud, HistorialItem, HistorialSolicitudes, ParametrosOperativos, Clock } from '../../../src/shared/application/ports.js';
import type { UnitOfWork } from '../../../src/shared/application/unit-of-work.js';
import type { AuthUser } from '../../../src/shared/domain/auth-user.js';
import { BusinessRuleError } from '../../../src/shared/domain/errors.js';
import type { Adjunto, ArchivoSubido, Solicitud } from '../../../src/modules/requests/domain/entities/solicitud.js';
import type { AlmacenAdjuntos, SolicitudRepository } from '../../../src/modules/requests/domain/interfaces/solicitud.repository.js';
import { AdjuntarArchivosUseCase, ComentarSolicitudUseCase } from '../../../src/modules/requests/application/use-cases/aportar-solicitud.js';
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

const historialItem: HistorialItem = {
  id: 1,
  accion: 'COMENTARIO',
  estado_anterior: null,
  estado_nuevo: null,
  comentario: 'Ya probé el reinicio.',
  detalle: null,
  usuario_nombre: cliente.nombre,
  usuario_rol: cliente.rol,
  fecha: now,
};

const adjunto: Adjunto = {
  id: 3,
  solicitud_id: solicitud.id,
  nombre_original: 'error.png',
  mime_type: 'image/png',
  tamano_bytes: 128,
  subido_por_nombre: cliente.nombre,
  created_at: now,
};

const archivo: ArchivoSubido = {
  nombreOriginal: 'error.png',
  nombreArchivo: 'safe-file.png',
  mimeType: 'image/png',
  tamanoBytes: 128,
};

function makeDependencies(row = solicitud) {
  const repo: SolicitudRepository = {
    buscar: vi.fn(async () => row),
    listar: vi.fn(async () => ({ filas: [], total: 0 })),
    referencias: vi.fn(async () => ({})),
    horasPlazo: vi.fn(async () => 24),
    buscarDuplicadaAbierta: vi.fn(async () => undefined),
    crear: vi.fn(async () => row.id),
    actualizar: vi.fn(async () => {}),
    listarAdjuntos: vi.fn(async () => [adjunto]),
    contarAdjuntos: vi.fn(async () => 0),
    crearAdjunto: vi.fn(async () => {}),
    buscarAdjunto: vi.fn(async () => undefined),
  };
  const historial: HistorialSolicitudes = {
    registrar: vi.fn(async () => {}),
    listar: vi.fn(async () => [historialItem]),
  };
  const eventos: EventosSolicitud = { publicar: vi.fn(async () => {}) };
  const parametros: ParametrosOperativos = { numero: vi.fn(async () => 5) };
  const clock: Clock = { now: () => now };
  const uow: UnitOfWork = { run: vi.fn(async (work) => work()), afterCommit: vi.fn() };
  const deps: SolicitudDeps = { repo, historial, eventos, parametros, clock, uow };
  const almacen: AlmacenAdjuntos = {
    rutaDe: (nombre) => nombre,
    descartar: vi.fn(async () => {}),
    firmaValida: vi.fn(async () => true),
  };
  return { deps, repo, historial, eventos, almacen };
}

describe('request contributions', () => {
  it('records an authorized comment and publishes a business event', async () => {
    const { deps, historial, eventos } = makeDependencies();

    await expect(new ComentarSolicitudUseCase(deps).execute(cliente, solicitud.id, 'Ya probé el reinicio.')).resolves.toEqual([
      historialItem,
    ]);

    expect(historial.registrar).toHaveBeenCalledWith(
      expect.objectContaining({ solicitudId: solicitud.id, accion: 'COMENTARIO', comentario: 'Ya probé el reinicio.' }),
    );
    expect(eventos.publicar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'COMENTARIO' }));
  });

  it('rejects comments on a finalized request', async () => {
    const { deps, historial, eventos } = makeDependencies({ ...solicitud, estado: 'CERRADA' });

    await expect(new ComentarSolicitudUseCase(deps).execute(cliente, solicitud.id, 'Comentario')).rejects.toBeInstanceOf(
      BusinessRuleError,
    );

    expect(historial.registrar).not.toHaveBeenCalled();
    expect(eventos.publicar).not.toHaveBeenCalled();
  });

  it('saves validated attachments and removes files when validation fails', async () => {
    const successful = makeDependencies();
    await expect(new AdjuntarArchivosUseCase(successful.deps, successful.almacen).execute(cliente, solicitud.id, [archivo])).resolves.toEqual([
      adjunto,
    ]);
    expect(successful.repo.crearAdjunto).toHaveBeenCalledWith(solicitud.id, archivo, cliente.id);
    expect(successful.eventos.publicar).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'ADJUNTO' }));

    const failed = makeDependencies();
    vi.mocked(failed.almacen.firmaValida).mockResolvedValueOnce(false);
    await expect(new AdjuntarArchivosUseCase(failed.deps, failed.almacen).execute(cliente, solicitud.id, [archivo])).rejects.toBeInstanceOf(
      BusinessRuleError,
    );
    expect(failed.repo.crearAdjunto).not.toHaveBeenCalled();
    expect(failed.almacen.descartar).toHaveBeenCalledWith([archivo.nombreArchivo]);
    expect(failed.eventos.publicar).not.toHaveBeenCalled();
  });
});
