import type { AuthUser } from '../../../../shared/domain/auth-user.js';
import { BusinessRuleError } from '../../../../shared/domain/errors.js';
import type { Estado } from '../../../../shared/domain/estados.js';
import type { SolicitudVista } from '../../domain/entities/solicitud.js';
import { calcularFechaLimite } from '../../domain/rules/plazo.js';
import { estadoTrasReapertura, validarReapertura, validarTransicion } from '../../domain/rules/transiciones.js';
import { aVista, resumenEvento, umbralPorVencer, type SolicitudDeps } from '../dto/solicitud.dto.js';
import { cargarVisible } from './consultar-solicitudes.js';

export interface CambioEstadoEntrada {
  estado: Estado;
  comentario?: string | null;
  resolucion?: string | null;
  prioridad_id?: number;
  version?: number;
}

export class CambiarEstadoUseCase {
  constructor(private readonly deps: SolicitudDeps) {}

  async execute(user: AuthUser, id: number, cambios: CambioEstadoEntrada): Promise<SolicitudVista> {
    const { repo, historial, eventos, uow, clock, parametros } = this.deps;
    return uow.run(async () => {
      const actual = await cargarVisible(this.deps, user, id, true);

      validarTransicion(user, actual, cambios.estado);

      if (cambios.estado === 'RESUELTA' && (!cambios.resolucion || cambios.resolucion.trim().length < 10)) {
        throw new BusinessRuleError('No se puede resolver una solicitud sin una resolución documentada (mínimo 10 caracteres)');
      }

      const ahora = clock.now();
      const esCierre = cambios.estado === 'CERRADA';
      const esResolucion = cambios.estado === 'RESUELTA';

      await repo.actualizar(id, {
        estado: cambios.estado,
        ...(cambios.prioridad_id ? { prioridadId: cambios.prioridad_id } : {}),
        ...(cambios.resolucion !== undefined ? { resolucion: cambios.resolucion } : {}),
        ...(esResolucion ? { fechaResolucion: ahora } : {}),
        ...(esCierre ? { fechaCierre: ahora } : {}),
      });

      const actualizada = (await repo.buscar(id))!;

      await historial.registrar({
        solicitudId: id,
        usuarioId: user.id,
        accion: 'CAMBIO_ESTADO',
        estadoAnterior: actual.estado,
        estadoNuevo: cambios.estado,
        comentario: cambios.comentario ?? cambios.resolucion ?? null,
      });

      await eventos.publicar({
        tipo: 'CAMBIO_ESTADO',
        actorId: user.id,
        actorNombre: user.nombre,
        solicitud: resumenEvento(actualizada),
        estadoAnterior: actual.estado,
        comentario: cambios.comentario ?? cambios.resolucion ?? null,
      });

      return aVista(actualizada, ahora, await umbralPorVencer(parametros));
    });
  }
}

/**
 * Regla 4: reapertura autorizada y auditada de una solicitud cerrada.
 * Solo ADMIN/COORDINADOR, con motivo. Queda en el historial inalterable con la
 * resolución y las fechas que tenía, y el plazo se reinicia desde la reapertura.
 */
export class ReabrirSolicitudUseCase {
  constructor(private readonly deps: SolicitudDeps) {}

  execute(user: AuthUser, id: number, motivo: string): Promise<SolicitudVista> {
    const { repo, historial, eventos, uow, clock, parametros } = this.deps;
    return uow.run(async () => {
      const actual = await cargarVisible(this.deps, user, id, true);
      validarReapertura(user, actual, motivo);

      const ahora = clock.now();
      const nuevoEstado = estadoTrasReapertura(actual);
      await repo.actualizar(id, {
        estado: nuevoEstado,
        resolucion: null,
        fechaResolucion: null,
        fechaCierre: null,
        fechaLimite: calcularFechaLimite(ahora, actual.horas_plazo),
      });
      const reabierta = (await repo.buscar(id))!;

      await historial.registrar({
        solicitudId: id,
        usuarioId: user.id,
        accion: 'REAPERTURA',
        estadoAnterior: 'CERRADA',
        estadoNuevo: nuevoEstado,
        comentario: motivo.trim(),
        detalle: {
          resolucion_anterior: actual.resolucion,
          fecha_resolucion_anterior: actual.fecha_resolucion,
          fecha_cierre_anterior: actual.fecha_cierre,
          fecha_limite_anterior: actual.fecha_limite,
          fecha_limite_nueva: reabierta.fecha_limite,
        },
      });
      await eventos.publicar({
        tipo: 'REAPERTURA',
        actorId: user.id,
        actorNombre: user.nombre,
        solicitud: resumenEvento(reabierta),
        estadoAnterior: 'CERRADA',
        comentario: motivo.trim(),
      });
      return aVista(reabierta, ahora, await umbralPorVencer(parametros));
    });
  }
}
