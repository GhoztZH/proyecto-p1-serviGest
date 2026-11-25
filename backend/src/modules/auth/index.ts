import type { RequestHandler, Router } from 'express';
import { systemClock, type AuditLogger, type PasswordHasher } from '../../shared/application/ports.js';
import type { AppConfig } from '../../shared/config/env.js';
import type { Database } from '../../shared/db/database.js';
import {
  ChangePasswordUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  UpdateProfileUseCase,
} from './application/password.use-cases.js';
import { LoginUseCase, LogoutUseCase, ResolveSessionUseCase } from './application/session.use-cases.js';
import type { CredencialesUsuario } from './domain/auth.types.js';
import { JwtTokenService } from './infrastructure/security.adapters.js';
import { PgSessionRepository } from './infrastructure/pg-session.repository.js';
import { authRoutes, createAuthenticate } from './presentation/auth.routes.js';

export interface AuthModule {
  authenticate: RequestHandler;
  routes(): Router;
}

export function createAuthModule(
  db: Database,
  config: AppConfig,
  cuentas: CredencialesUsuario,
  hasher: PasswordHasher,
  audit: AuditLogger,
): AuthModule {
  const sesiones = new PgSessionRepository(db);
  const tokens = new JwtTokenService(config.jwtSecret, 60); // 60 min vigencia por defecto
  const resolveSession = new ResolveSessionUseCase(cuentas, sesiones, tokens);
  const authenticate = createAuthenticate(resolveSession);

  const useCases = {
    login: new LoginUseCase(cuentas, hasher, tokens, audit),
    logout: new LogoutUseCase(sesiones, audit),
    changePassword: new ChangePasswordUseCase(cuentas, hasher, audit, db),
    forgotPassword: new ForgotPasswordUseCase(cuentas, sesiones, systemClock, 2, config.nodeEnv !== 'production'),
    resetPassword: new ResetPasswordUseCase(cuentas, sesiones, hasher, audit, db),
    updateProfile: new UpdateProfileUseCase(cuentas, audit, db),
  };

  return { authenticate, routes: () => authRoutes(useCases, authenticate) };
}

export { Argon2Hasher } from './infrastructure/security.adapters.js';
