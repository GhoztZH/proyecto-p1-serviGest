import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { Badge } from '../atoms/Badge.js';
import { Button } from '../atoms/Button.js';

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header
      style={{
        height: 'var(--size-topbar, 64px)',
        backgroundColor: 'var(--color-surface)',
        borderBottom: 'var(--border-width) solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-xl, 24px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md, 12px)' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
          ServiGest
        </span>
        {user?.rol && (
          <Badge tone="role">
            {user.rol}
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg, 16px)' }}>
        {user && (
          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>
            {user.nombre} <span style={{ color: 'var(--color-text-muted)' }}>({user.email})</span>
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={logout}>
          Cerrar sesión
        </Button>
      </div>
    </header>
  );
};
