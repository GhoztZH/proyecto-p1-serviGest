import path from 'node:path';
import type { Router } from 'express';
import { loadConfig, type AppConfig } from './shared/config/env.js';
import { noopAuditLogger } from './shared/application/ports.js';
import { pool } from './shared/db/connection.js';
import { PgDatabase, type Database } from './shared/db/database.js';
import { createAuthModule, Argon2Hasher, type AuthModule } from './modules/auth/index.js';
import { createRequestsModule, type RequestsModule } from './modules/requests/index.js';
import { createUsersModule, type UsersModule } from './modules/users/index.js';

export interface AppContainer {
  config: AppConfig;
  db: Database;
  hasher: Argon2Hasher;
  auth: AuthModule;
  users: UsersModule;
  requests: RequestsModule;
  routers: Router[];
}

export function createContainer(): AppContainer {
  const config = loadConfig();
  const db = new PgDatabase(pool);
  const hasher = new Argon2Hasher();
  const audit = noopAuditLogger;

  const users = createUsersModule(db, hasher, audit);
  const auth = createAuthModule(db, config, users.repo, hasher, audit);
  const requests = createRequestsModule({
    db,
    historial: { registrar: async () => {}, listar: async () => [] },
    eventos: { publicar: async () => {} },
    parametros: { numero: async (_clave, porDefecto) => porDefecto },
    asignaciones: { listarPorSolicitud: async () => [] },
    uploadsDir: process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), 'uploads'),
    zonaHoraria: process.env.TIMEZONE ?? 'America/Guayaquil',
  });

  return {
    config,
    db,
    hasher,
    auth,
    users,
    requests,
    routers: [auth.routes(), users.routes(auth.authenticate), requests.routes(auth.authenticate)],
  };
}
