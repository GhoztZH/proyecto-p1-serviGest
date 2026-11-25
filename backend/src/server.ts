import cors from 'cors';
import express, { type Express } from 'express';
import { router as healthRouter } from './routes.js';
import { createContainer } from './container.js';
import { errorHandler } from './shared/http/error-handler.js';

export function createServer(): Express {
  const app = express();
  const container = createContainer();

  // Middlewares
  const allowedOrigin = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  app.use(
    cors({
      origin: allowedOrigin,
      credentials: true,
    }),
  );

  app.use(express.json());

  // Rutas base de salud / comprobación
  app.use('/api', healthRouter);

  // Montar enrutadores modulares bajo /api
  for (const moduleRouter of container.routers) {
    app.use('/api', moduleRouter);
  }

  // Manejador global de errores (openapi.yaml)
  app.use(errorHandler);

  return app;
}
