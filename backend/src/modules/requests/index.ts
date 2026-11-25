import type { RequestHandler, Router } from 'express';
import { systemClock, type Clock, type EventosSolicitud, type HistorialSolicitudes, type ParametrosOperativos } from '../../shared/application/ports.js';
import type { Database } from '../../shared/db/database.js';
import type { SolicitudDeps } from './application/dto/solicitud.dto.js';
import { AdjuntarArchivosUseCase, ComentarSolicitudUseCase } from './application/use-cases/aportar-solicitud.js';
import { CambiarEstadoUseCase, ReabrirSolicitudUseCase } from './application/use-cases/cambiar-estado.js';
import { ConsultarSolicitudesUseCase } from './application/use-cases/consultar-solicitudes.js';
import { RegistrarSolicitudUseCase } from './application/use-cases/registrar-solicitud.js';
import type { AsignacionesLectura, SolicitudRepository } from './domain/interfaces/solicitud.repository.js';
import { AlmacenAdjuntosDisco } from './infrastructure/adapters/almacen-adjuntos.js';
import { PgSolicitudRepository } from './infrastructure/persistence/pg-solicitud.repository.js';
import { solicitudRoutes } from './presentation/routes/solicitud.routes.js';

export interface RequestsModule {
  repo: SolicitudRepository;
  deps: SolicitudDeps;
  routes(authenticate: RequestHandler): Router;
}

export interface RequestsModuleDeps {
  db: Database;
  historial: HistorialSolicitudes;
  eventos: EventosSolicitud;
  parametros: ParametrosOperativos;
  /**
   * ⚠️  DEPENDENCIA_INT2: El módulo de asignaciones (Int. 2) debe proveer
   * una implementación de AsignacionesLectura. Mientras no esté disponible,
   * se usa un stub que devuelve array vacío.
   */
  asignaciones: AsignacionesLectura;
  uploadsDir: string;
  zonaHoraria: string;
  clock?: Clock;
}

/** Stub temporal hasta que Int. 2 implemente AsignacionesLectura. */
const asignacionesStub: AsignacionesLectura = {
  listarPorSolicitud: async () => [],
};

export function createRequestsModule(d: RequestsModuleDeps): RequestsModule {
  const repo = new PgSolicitudRepository(d.db);
  const almacen = new AlmacenAdjuntosDisco(d.uploadsDir);
  const deps: SolicitudDeps = {
    repo,
    historial: d.historial,
    eventos: d.eventos,
    parametros: d.parametros,
    uow: d.db,
    clock: d.clock ?? systemClock,
  };
  const useCases = {
    registrar: new RegistrarSolicitudUseCase(deps, almacen),
    consultar: new ConsultarSolicitudesUseCase(deps, d.asignaciones ?? asignacionesStub, d.zonaHoraria),
    cambiarEstado: new CambiarEstadoUseCase(deps),
    reabrir: new ReabrirSolicitudUseCase(deps),
    comentar: new ComentarSolicitudUseCase(deps),
    adjuntar: new AdjuntarArchivosUseCase(deps, almacen),
  };
  return { repo, deps, routes: (authenticate) => solicitudRoutes(useCases, almacen, almacen.receptor(), authenticate) };
}

// API pública del módulo para los que colaboran con él (asignaciones, dashboard).
export type { Solicitud, SolicitudVista } from './domain/entities/solicitud.js';
export type { AsignacionVista, AsignacionesLectura, SolicitudRepository } from './domain/interfaces/solicitud.repository.js';
export type { SolicitudDeps } from './application/dto/solicitud.dto.js';
export { aVista, resumenEvento, umbralPorVencer } from './application/dto/solicitud.dto.js';
export { cargarVisible } from './application/use-cases/consultar-solicitudes.js';
export { alcanceDe } from './domain/rules/acceso.js';
export { SQL_ABIERTA, SQL_VENCIDA, sqlPorVencer } from './infrastructure/persistence/plazo.sql.js';
