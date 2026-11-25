import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { PasswordHasher } from '../../../shared/application/ports.js';
import { UnauthorizedError } from '../../../shared/domain/errors.js';
import type { TokenEmitido, TokenService, TokenVerificado } from '../domain/auth.types.js';

export class Argon2Hasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain, { type: argon2.argon2id });
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }
}

export class JwtTokenService implements TokenService {
  constructor(
    private readonly secret: string,
    private readonly minutosVigencia: number,
  ) {}

  emitir(usuarioId: number): TokenEmitido {
    const jti = randomUUID();
    const expiraEn = new Date(Date.now() + this.minutosVigencia * 60_000);
    const token = jwt.sign({}, this.secret, {
      algorithm: 'HS256',
      subject: String(usuarioId),
      jwtid: jti,
      expiresIn: this.minutosVigencia * 60,
    });
    return { token, jti, expiraEn };
  }

  verificar(token: string): TokenVerificado {
    try {
      const payload = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof payload === 'string' || !payload.sub || !payload.jti || !payload.exp) throw new Error('claims');
      const usuarioId = Number(payload.sub);
      if (!Number.isInteger(usuarioId)) throw new Error('sub');
      return { usuarioId, jti: payload.jti, expiraEn: new Date(payload.exp * 1000) };
    } catch {
      throw new UnauthorizedError('El token no es válido o ha expirado');
    }
  }
}
