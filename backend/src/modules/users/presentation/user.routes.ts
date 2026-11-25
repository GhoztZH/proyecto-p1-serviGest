import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { ROLES } from '../../../shared/domain/auth-user.js';
import { authOf, booleanoQuery, clientIp, emailSchema, idParam, paginacionSchema, parse, passwordSchema, requireRoles, textoRequerido } from '../../../shared/http/http.js';
import type { UserService } from '../application/user.service.js';
import { ROLES_INTERNOS } from '../domain/user.types.js';

const filtroUsuariosSchema = paginacionSchema.extend({
  q: z.string().trim().max(100).optional(),
  rol: z.enum(ROLES, { error: 'Rol inválido' }).optional(),
  activo: booleanoQuery.optional(),
});

const usuarioNuevoSchema = z.object({
  nombre: textoRequerido('El nombre', 3, 120),
  email: emailSchema,
  password: passwordSchema,
  rol: z.enum(ROLES_INTERNOS, { error: 'El rol debe ser ADMIN o COORDINADOR' }),
});

const usuarioActualizarSchema = z
  .object({
    nombre: textoRequerido('El nombre', 3, 120).optional(),
    email: emailSchema.optional(),
    activo: z.boolean({ error: 'Debe ser verdadero o falso' }).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Indique al menos un campo a actualizar' });

const resetPasswordSchema = z.object({ password: passwordSchema });

/** Todo el grupo `/usuarios` es exclusivo del ADMIN (contrato OpenAPI). */
export function userRoutes(service: UserService, authenticate: RequestHandler): Router {
  const router = Router();
  router.use('/usuarios', authenticate, requireRoles('ADMIN'));

  router.get('/usuarios', async (req, res, next) => {
    try {
      res.json(await service.listar(parse(filtroUsuariosSchema, req.query)));
    } catch (e) {
      next(e);
    }
  });

  router.post('/usuarios', async (req, res, next) => {
    try {
      const datos = parse(usuarioNuevoSchema, req.body);
      res.status(201).json(await service.crearInterno(datos, { actor: authOf(req), ip: clientIp(req) }));
    } catch (e) {
      next(e);
    }
  });

  router.get('/usuarios/:id', async (req, res, next) => {
    try {
      res.json(await service.obtener(idParam(req)));
    } catch (e) {
      next(e);
    }
  });

  router.put('/usuarios/:id', async (req, res, next) => {
    try {
      const cambios = parse(usuarioActualizarSchema, req.body);
      res.json(await service.actualizarInterno(idParam(req), cambios, { actor: authOf(req), ip: clientIp(req) }));
    } catch (e) {
      next(e);
    }
  });

  router.post('/usuarios/:id/reset-password', async (req, res, next) => {
    try {
      const { password } = parse(resetPasswordSchema, req.body);
      await service.restablecerPassword(idParam(req), password, { actor: authOf(req), ip: clientIp(req) });
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
