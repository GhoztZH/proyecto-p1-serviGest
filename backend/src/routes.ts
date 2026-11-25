import { Router, type Request, type Response } from 'express';
import path from 'node:path';
import { checkDatabaseConnection, pool } from './shared/db/connection.js';
import { PgDatabase } from './shared/db/database.js';
import { createRequestsModule } from './modules/requests/index.js';
import type { AuthUser } from './shared/domain/auth-user.js';

export const router = Router();

// Ruta de comprobación de salud de la API
router.get('/health', async (_req: Request, res: Response) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de prueba iniciales
router.get('/saludo', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    mensaje: '¡Conexión exitosa con ServiGest API!',
  });
});

router.post('/datos', (req: Request, res: Response) => {
  res.status(201).json({
    ok: true,
    recibido: req.body,
  });
});

// ---- Módulo de Solicitudes (Integrante 3) ----
// DEPENDENCIA_INT1: El middleware `authenticate` debe ser provisto por el módulo auth (Int. 1).
// Mientras no esté disponible, se usa un middleware de desarrollo que inyecta un usuario de prueba.
// ⚠️  NO usar en producción. Reemplazar con el authenticate de Int. 1.
const authenticateDev = (req: Request & { auth?: AuthUser }, _res: Response, next: Function) => {
  // Integrante 1 debe reemplazar esto con la validación JWT real.
  req.auth = {
    id: 1,
    nombre: 'Admin Dev',
    email: 'admin@servigest.dev',
    rol: 'ADMIN',
  };
  next();
};

const db = new PgDatabase(pool);

// DEPENDENCIA_INT2: Stubs de historial, eventos y parámetros hasta que los otros módulos estén listos.
const historialStub = {
  registrar: async () => {},
  listar: async () => [],
};

const eventosStub = {
  publicar: async () => {},
};

const parametrosStub = {
  numero: async (_clave: string, porDefecto: number) => porDefecto,
};

const uploadsDir = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads');
const zonaHoraria = process.env.TIMEZONE ?? 'America/Guayaquil';

const requestsModule = createRequestsModule({
  db,
  historial: historialStub,
  eventos: eventosStub,
  parametros: parametrosStub,
  asignaciones: { listarPorSolicitud: async () => [] },
  uploadsDir,
  zonaHoraria,
});

// Montar rutas bajo /api (el server.ts ya prefija con /api)
router.use(requestsModule.routes(authenticateDev));
