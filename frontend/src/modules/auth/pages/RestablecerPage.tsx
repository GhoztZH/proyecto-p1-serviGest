import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/auth.service.js';
import { Field } from '../../../shared/components/atoms/Field.js';
import { Button } from '../../../shared/components/atoms/Button.js';

export const RestablecerPage: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== repetida) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setError(null);
    setCargando(true);

    try {
      await authService.restablecerPassword(token, password);
      setExito(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'El enlace no es válido o ha expirado');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)',
        padding: 'var(--space-xl, 24px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-2xl, 32px)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: 'var(--border-width) solid var(--color-border)',
        }}
      >
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
          Nueva contraseña
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Mínimo 8 caracteres, al menos una letra y un número.
        </p>

        {error && (
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--color-danger-soft)',
              color: 'var(--color-danger)',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {exito ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--color-success-soft)',
                color: 'var(--color-success)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              ¡Contraseña actualizada con éxito! Ya puedes ingresar con tu nueva credencial.
            </div>
            <Link to="/login" style={{ fontSize: '13px', textAlign: 'center', color: 'var(--color-accent)' }}>
              Ir a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!token && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-warning-soft)',
                  color: 'var(--color-warning)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '16px',
                }}
              >
                No se proporcionó un token de restablecimiento. Solicita uno desde "Olvidé mi contraseña".
              </div>
            )}

            <Field
              label="Nueva contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="••••••••"
            />

            <Field
              label="Confirmar contraseña"
              type="password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              required
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={cargando || !token || !password || password !== repetida}
              style={{ width: '100%' }}
            >
              {cargando ? 'Guardando…' : 'Guardar contraseña'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
