import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { authOf } from '../../src/shared/http/http.js';
import { errorHandler } from '../../src/shared/http/error-handler.js';
import { alcanceDe } from '../../src/modules/requests/domain/rules/acceso.js';
import type { CuentaConCredenciales, CredencialesUsuario, SessionRepository, TokenService } from '../../src/modules/auth/domain/auth.types.js';
import { ResolveSessionUseCase } from '../../src/modules/auth/application/session.use-cases.js';
import { createAuthenticate } from '../../src/modules/auth/presentation/auth.routes.js';

const cuenta: CuentaConCredenciales = {
  id: 42,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE',
  activo: true,
  password_hash: 'hash',
  cliente_id: 7,
  tecnico_id: null,
};

describe('authentication and requests integration', () => {
  it('passes the authenticated customer profile into request access rules', async () => {
    const accounts: CredencialesUsuario = {
      buscarCredencialesPorEmail: vi.fn(async () => cuenta),
      buscarCredencialesPorId: vi.fn(async () => cuenta),
      cambiarPassword: vi.fn(async () => {}),
      registrarAcceso: vi.fn(async () => {}),
      actualizar: vi.fn(async () => {}),
    };
    const sessions: SessionRepository = {
      revocar: vi.fn(async () => {}),
      estaRevocado: vi.fn(async () => false),
      purgarRevocadosExpirados: vi.fn(async () => {}),
      crearRestablecimiento: vi.fn(async () => {}),
      consumirRestablecimiento: vi.fn(async () => undefined),
    };
    const tokens: TokenService = {
      emitir: vi.fn(),
      verificar: vi.fn(() => ({
        usuarioId: cuenta.id,
        jti: 'session-id',
        expiraEn: new Date('2030-01-01T00:00:00Z'),
      })),
    };
    const resolveSession = new ResolveSessionUseCase(accounts, sessions, tokens);
    const app = express();

    app.get('/api/solicitudes', createAuthenticate(resolveSession), (req, res) => {
      res.json({ alcance: alcanceDe(authOf(req)) });
    });
    app.use(errorHandler);

    const unauthorized = await request(app).get('/api/solicitudes');
    expect(unauthorized.status).toBe(401);

    const authorized = await request(app).get('/api/solicitudes').set('Authorization', 'Bearer valid-token');
    expect(authorized.status).toBe(200);
    expect(authorized.body).toEqual({ alcance: { clienteId: 7 } });
  });
});
