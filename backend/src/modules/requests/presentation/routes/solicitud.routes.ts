import { Router, type Request, type RequestHandler } from 'express';
import { authOf, idParam, parse } from '../../../../shared/http/http.js';
import type { AdjuntarArchivosUseCase, ComentarSolicitudUseCase } from '../../application/use-cases/aportar-solicitud.js';
import type { CambiarEstadoUseCase, ReabrirSolicitudUseCase } from '../../application/use-cases/cambiar-estado.js';
import type { ConsultarSolicitudesUseCase } from '../../application/use-cases/consultar-solicitudes.js';
import type { RegistrarSolicitudUseCase } from '../../application/use-cases/registrar-solicitud.js';
import type { ArchivoSubido } from '../../domain/entities/solicitud.js';
import type { AlmacenAdjuntos } from '../../domain/interfaces/solicitud.repository.js';
import {
  cambioEstadoSchema,
  comentarioSchema,
  filtroSolicitudesSchema,
  reaperturaSchema,
  solicitudNuevaSchema,
} from '../validators/solicitud.schemas.js';

export interface SolicitudUseCases {
  registrar: RegistrarSolicitudUseCase;
  consultar: ConsultarSolicitudesUseCase;
  cambiarEstado: CambiarEstadoUseCase;
  reabrir: ReabrirSolicitudUseCase;
  comentar: ComentarSolicitudUseCase;
  adjuntar: AdjuntarArchivosUseCase;
}

function archivosDe(req: Request): ArchivoSubido[] {
  const files = Array.isArray(req.files) ? req.files : [];
  return files.map((f) => ({
    // multer entrega el nombre en latin1; se recupera el UTF-8 original (tildes, ñ).
    nombreOriginal: Buffer.from(f.originalname, 'latin1').toString('utf8').slice(0, 255),
    nombreArchivo: f.filename,
    mimeType: f.mimetype,
    tamanoBytes: f.size,
  }));
}

/**
 * Los controladores solo traducen HTTP → caso de uso → HTTP.
 * No contienen lógica de negocio.
 */
export function solicitudRoutes(
  uc: SolicitudUseCases,
  almacen: AlmacenAdjuntos,
  recibirAdjuntos: RequestHandler,
  authenticate: RequestHandler,
): Router {
  const router = Router();
  router.use(authenticate);

  router.post('/solicitudes', recibirAdjuntos, async (req, res) => {
    const datos = parse(solicitudNuevaSchema, { ...req.body });
    const archivos = archivosDe(req);
    let resultado;
    try {
      resultado = await uc.registrar.execute(authOf(req), datos, archivos);
    } catch (error) {
      await almacen.descartar(archivos.map((a) => a.nombreArchivo));
      throw error;
    }
    res.status(201).json(resultado);
  });

  router.get('/solicitudes', async (req, res) => {
    const filtro = parse(filtroSolicitudesSchema, req.query);
    res.json(await uc.consultar.listar(authOf(req), {
      page: filtro.page,
      limit: filtro.limit,
      estados: filtro.estado,
      prioridades: filtro.prioridad,
      categoriaId: filtro.categoria_id,
      sedeId: filtro.sede_id,
      clienteId: filtro.cliente_id,
      tecnicoId: filtro.tecnico_id,
      desde: filtro.desde,
      hasta: filtro.hasta,
      q: filtro.q,
      vencimiento: filtro.vencimiento,
      orden: filtro.orden,
    }));
  });

  router.get('/solicitudes/:id', async (req, res) => {
    res.json(await uc.consultar.detalle(authOf(req), idParam(req)));
  });

  router.patch('/solicitudes/:id/estado', async (req, res) => {
    res.json(await uc.cambiarEstado.execute(authOf(req), idParam(req), parse(cambioEstadoSchema, req.body)));
  });

  router.get('/solicitudes/:id/historial', async (req, res) => {
    res.json(await uc.consultar.historial(authOf(req), idParam(req)));
  });

  router.post('/solicitudes/:id/reapertura', async (req, res) => {
    const { motivo } = parse(reaperturaSchema, req.body);
    res.json(await uc.reabrir.execute(authOf(req), idParam(req), motivo));
  });

  router.post('/solicitudes/:id/comentarios', async (req, res) => {
    const { comentario } = parse(comentarioSchema, req.body);
    res.status(201).json(await uc.comentar.execute(authOf(req), idParam(req), comentario));
  });

  router.post('/solicitudes/:id/adjuntos', recibirAdjuntos, async (req, res) => {
    const archivos = archivosDe(req);
    let id: number;
    try {
      id = idParam(req);
    } catch (error) {
      await almacen.descartar(archivos.map((a) => a.nombreArchivo));
      throw error;
    }
    res.status(201).json(await uc.adjuntar.execute(authOf(req), id, archivos));
  });

  router.get('/solicitudes/:id/adjuntos/:adjuntoId', async (req, res) => {
    const adjunto = await uc.consultar.adjunto(authOf(req), idParam(req), idParam(req, 'adjuntoId'));
    res.type(adjunto.mime_type);
    // Siempre como descarga: un adjunto nunca se interpreta en el origen de la aplicación.
    res.download(almacen.rutaDe(adjunto.nombre_archivo), adjunto.nombre_original);
  });

  return router;
}
