import cors from 'cors';
import express, { type Express } from 'express';
import { router } from './routes.js';

export function createServer(): Express {
  const app = express();

  // Middlewares
  const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    }),
  );

  app.use(express.json());

  // Rutas base bajo el prefijo /api
  app.use('/api', router);

  return app;
}
