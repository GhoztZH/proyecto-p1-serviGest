import type { AuthUser } from '../../../../shared/domain/auth-user.js';
import { BusinessRuleError, ConflictError, ForbiddenError, ValidationError } from '../../../../shared/domain/errors.js';
import type { ArchivoSubido, SolicitudVista } from '../../domain/entities/solicitud.js';
import type { AlmacenAdjuntos } from '../../domain/interfaces/solicitud.repository.js';
import { calcularFechaLimite } from '../../domain/rules/plazo.js';
import { aVista, resumenEvento, umbralPorVencer, type SolicitudDeps } from '../dto/solicitud.dto.js';

export interface SolicitudEntrada {
  cliente_id?: number;
  sede_id: number;
  categoria_id: number;
  prioridad_id: number;
  titulo: string;
  descripcion: string;
  equipo_afectado: string;
}

/** Valida y registra los archivos de una solicitud. Compartido por el alta y por "subir adjuntos". */
export async function guardarAdjuntos(
  deps: Pick<SolicitudDeps, 'repo' | 'historial' | 'parametros'>,
  almacen: AlmacenAdjuntos,
  solicitudId: number,
  archivos: ArchivoSubido[],
  usuarioId: number,
): Promise<void> {
  if (!archivos.length) return;
  const maximo = await deps.parametros.numero('MAX_ADJUNTOS_POR_SOLICITUD', 5);
  const existentes = await deps.repo.contarAdjuntos(solicitudId);
  if (existentes + archivos.length > maximo) {
    throw new BusinessRuleError(`Una solicitud admite como máximo ${maximo} archivos adjuntos (ya tiene ${existentes})`);
  }
  for (const archivo of archivos) {
    if (!(await almacen.firmaValida(archivo.nombreArchivo, archivo.mimeType))) {
      throw new BusinessRuleError(`El contenido de "${archivo.nombreOriginal}" no corresponde a su tipo de archivo`);
    }
    await deps.repo.crearAdjunto(solicitudId, archivo, usuarioId);
  }
  await deps.historial.registrar({
    solicitudId,
    usuarioId,
    accion: 'ADJUNTO',
    detalle: { archivos: archivos.map((a) => a.nombreOriginal) },
  });
}

export class RegistrarSolicitudUseCase {
  constructor(
    private readonly deps: SolicitudDeps,
    private readonly almacen: AlmacenAdjuntos,
  ) {}

  async execute(user: AuthUser, entrada: SolicitudEntrada, archivos: ArchivoSubido[] = []): Promise<SolicitudVista> {
    const { repo, historial, eventos, uow, clock, parametros } = this.deps;
    try {
      return await uow.run(async () => {
        const clienteId = this.resolverCliente(user, entrada);
        await this.validarReferencias(clienteId, entrada);

        const duplicada = await repo.buscarDuplicadaAbierta({
          clienteId,
          sedeId: entrada.sede_id,
          categoriaId: entrada.categoria_id,
          equipoAfectado: entrada.equipo_afectado,
        });
        if (duplicada) {
          throw new ConflictError(
            `Ya existe una solicitud abierta para ese equipo en la misma sede y categoría: ${duplicada.codigo}`,
            { solicitud_id: duplicada.id },
          );
        }

        const horasPlazo = await repo.horasPlazo(entrada.prioridad_id);
        if (!horasPlazo) throw new BusinessRuleError('No se encontró el plazo para la prioridad indicada');

        const ahora = clock.now();
        const fechaLimite = calcularFechaLimite(ahora, horasPlazo);

        const id = await repo.crear({
          clienteId,
          sedeId: entrada.sede_id,
          categoriaId: entrada.categoria_id,
          prioridadId: entrada.prioridad_id,
          titulo: entrada.titulo,
          descripcion: entrada.descripcion,
          equipoAfectado: entrada.equipo_afectado,
          fechaLimite,
          creadoPor: user.id,
          creadaEn: ahora,
        });

        await guardarAdjuntos(this.deps, this.almacen, id, archivos, user.id);

        await historial.registrar({
          solicitudId: id,
          usuarioId: user.id,
          accion: 'CREACION',
          estadoNuevo: 'REGISTRADA',
        });

        const creada = (await repo.buscar(id))!;

        await eventos.publicar({
          tipo: 'REGISTRO',
          actorId: user.id,
          actorNombre: user.nombre,
          solicitud: resumenEvento(creada),
        });

        const umbral = await umbralPorVencer(parametros);
        return aVista(creada, ahora, umbral);
      });
    } catch (error) {
      if (archivos.length) await this.almacen.descartar(archivos.map((a) => a.nombreArchivo));
      throw error;
    }
  }

  private resolverCliente(user: AuthUser, entrada: SolicitudEntrada): number {
    if (user.rol === 'CLIENTE') {
      if (!user.clienteId) throw new ForbiddenError('El usuario cliente no tiene un perfil de cliente asociado');
      return user.clienteId;
    }
    if (!entrada.cliente_id) {
      throw ValidationError.campo('cliente_id', 'El cliente es obligatorio');
    }
    return entrada.cliente_id;
  }

  private async validarReferencias(clienteId: number, entrada: SolicitudEntrada): Promise<void> {
    const { repo } = this.deps;
    const refs = await repo.referencias({
      clienteId,
      sedeId: entrada.sede_id,
      categoriaId: entrada.categoria_id,
      prioridadId: entrada.prioridad_id,
    });

    if (!refs.cliente?.activo) throw new BusinessRuleError('El cliente no existe o no está activo');
    if (!refs.sede?.activo) throw new BusinessRuleError('La sede no existe o no está activa');
    if (refs.sede.cliente_id !== clienteId) throw new BusinessRuleError('La sede no pertenece al cliente indicado');
    if (!refs.categoria?.activo) throw new BusinessRuleError('La categoría no existe o no está activa');
    if (!refs.prioridad) throw new BusinessRuleError('La prioridad indicada no existe');
  }
}
