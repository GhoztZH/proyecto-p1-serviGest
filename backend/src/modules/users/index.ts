import type { RequestHandler, Router } from 'express';
import type { AuditLogger, PasswordHasher } from '../../shared/application/ports.js';
import type { Database } from '../../shared/db/database.js';
import { UserService } from './application/user.service.js';
import type { UserRepository } from './domain/user.types.js';
import { PgUserRepository } from './infrastructure/pg-user.repository.js';
import { userRoutes } from './presentation/user.routes.js';

export interface UsersModule {
  repo: UserRepository;
  service: UserService;
  routes(authenticate: RequestHandler): Router;
}

export function createUsersModule(db: Database, hasher: PasswordHasher, audit: AuditLogger): UsersModule {
  const repo = new PgUserRepository(db);
  const service = new UserService(repo, hasher, audit, db);
  return { repo, service, routes: (authenticate) => userRoutes(service, authenticate) };
}

export type { Usuario, UsuarioConCredenciales, UserRepository } from './domain/user.types.js';
