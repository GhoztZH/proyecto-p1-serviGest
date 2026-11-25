import type { Router } from 'express';
import { loadConfig, type AppConfig } from './shared/config/env.js';
import { Database } from './shared/db/database.js';
import { noopAuditLogger } from './shared/application/ports.js';
import { createAuthModule, Argon2Hasher, type AuthModule } from './modules/auth/index.js';
import { createUsersModule, type UsersModule } from './modules/users/index.js';

export interface AppContainer {
  config: AppConfig;
  db: Database;
  hasher: Argon2Hasher;
  auth: AuthModule;
  users: UsersModule;
  routers: Router[];
}

export function createContainer(): AppContainer {
  const config = loadConfig();
  const db = new Database();
  const hasher = new Argon2Hasher();

  // NOTA: Integrante 4 conectará el logger real de auditoría cuando implemente el módulo 'audit'.
  // Mientras tanto, se usa noopAuditLogger para desacoplamiento completo.
  const audit = noopAuditLogger;

  // Módulo de Usuarios (Integrante 1)
  const users = createUsersModule(db, hasher, audit);

  // Módulo de Autenticación (Integrante 1)
  const auth = createAuthModule(db, config, users.repo, hasher, audit);

  // NOTA PARA LOS DEMÁS INTEGRANTES:
  // - Integrante 2 montará aquí: clients.routes(auth.authenticate), technicians.routes(auth.authenticate), catalogs.routes(auth.authenticate)
  // - Integrante 3 montará aquí: requests.routes(auth.authenticate)
  // - Integrante 4 montará aquí: dashboard.routes(auth.authenticate), notifications.routes(auth.authenticate), audit.routes(auth.authenticate)

  return {
    config,
    db,
    hasher,
    auth,
    users,
    routers: [
      auth.routes(),
      users.routes(auth.authenticate),
    ],
  };
}
