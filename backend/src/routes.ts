import { Router, type Request, type Response } from 'express';
import { checkDatabaseConnection } from './shared/db/connection.js';

export const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const dbOk = await checkDatabaseConnection();
  res.json({
    status: 'ok',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

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
