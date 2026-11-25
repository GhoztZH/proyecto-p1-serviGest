import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext.js';
import { authService } from '../services/auth.service.js';
import { Field } from '../../../shared/components/atoms/Field.js';
import { Button } from '../../../shared/components/atoms/Button.js';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  if (isAuthenticated) {
    const destino = (location.state as { desde?: string } | null)?.desde ?? '/';
    navigate(destino, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorGeneral(null);
    setCargando(true);

    try {
      const data = await authService.login(email, password);
      login(data.token, data.usuario);
      const destino = (location.state as { desde?: string } | null)?.desde ?? '/';
      navigate(destino, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message ?? 'Credenciales incorrectas o error en el servidor';
      setErrorGeneral(msg);
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
          maxWidth: '400px',
          backgroundColor: 'var(--color-surface)',
          padding: 'var(--space-2xl, 32px)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: 'var(--border-width) solid var(--color-border)',
          boxShadow: 'var(--shadow-popover, 0 8px 24px rgba(0,0,0,.08))',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl, 24px)' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-accent)', marginBottom: '8px' }}>
            ServiGest
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Gestión de solicitudes de servicio técnico
          </p>
        </div>

        {errorGeneral && (
          <div
            style={{
              padding: 'var(--space-md, 12px)',
              backgroundColor: 'var(--color-danger-soft, #FDE5E2)',
              color: 'var(--color-danger, #B42318)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            {errorGeneral}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field
            label="Correo de acceso"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            placeholder="ejemplo@servigest.ec"
          />

          <Field
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          <Button type="submit" variant="primary" size="lg" disabled={cargando} style={{ width: '100%', marginTop: '8px' }}>
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <div style={{ textAlign: 'center', marginTop: 'var(--space-lg, 16px)' }}>
            <Link
              to="/recuperar"
              style={{ fontSize: '12px', color: 'var(--color-accent)' }}
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
