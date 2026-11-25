import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth.service.js';
import { Field } from '../../../shared/components/atoms/Field.js';
import { Button } from '../../../shared/components/atoms/Button.js';

export const RecuperarPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [respuesta, setRespuesta] = useState<{ message: string; tokenDesarrollo?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const data = await authService.olvidePassword(email);
      setRespuesta(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Ocurrió un error al procesar la solicitud');
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
          Recuperar acceso
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
          Le enviaremos instrucciones para restablecer su contraseña.
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

        {respuesta ? (
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
              {respuesta.message}
            </div>

            {respuesta.tokenDesarrollo && (
              <div style={{ padding: '12px', border: '1px dashed var(--color-accent)', borderRadius: '8px', fontSize: '12px' }}>
                <p style={{ fontWeight: 600, marginBottom: '6px' }}>Token de desarrollo generado:</p>
                <Link
                  to={`/restablecer?token=${respuesta.tokenDesarrollo}`}
                  style={{ color: 'var(--color-accent)', wordBreak: 'break-all' }}
                >
                  Continuar con el restablecimiento aquí
                </Link>
              </div>
            )}

            <Link to="/login" style={{ fontSize: '13px', textAlign: 'center', color: 'var(--color-accent)' }}>
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Field
              label="Correo de acceso"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="tu-correo@servigest.ec"
            />

            <Button type="submit" variant="primary" size="lg" disabled={cargando} style={{ width: '100%' }}>
              {cargando ? 'Enviando…' : 'Enviar instrucciones'}
            </Button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link to="/login" style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
