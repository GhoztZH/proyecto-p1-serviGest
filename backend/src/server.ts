import cors from 'cors';
import express, { type Express } from 'express';
import { router } from './routes.js';
import { errorHandler } from './shared/http/error-handler.js';

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
  app.use(express.urlencoded({ extended: true }));

  // Rutas base bajo el prefijo /api
  app.use('/api', router);

  // Manejador global de errores
  app.use(errorHandler);

  return app;
}
