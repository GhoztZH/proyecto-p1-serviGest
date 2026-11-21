import React from 'react';

/**
 * Badge base del Sistema de Diseño ServiGest (DS · Átomos · Badge).
 *
 * Tonos:
 * - 'neutral': Gris tenue para datos informativos generales o estados inactivos.
 * - 'role': Tono del rol activo (`var(--color-accent)`).
 * - 'success': Para estados completados o resueltos (Verde).
 * - 'warning': Para estados pendientes de aprobación o alertas (Ámbar).
 * - 'danger': Para estados cancelados o errores (Rojo).
 */
export interface BadgeProps {
  tone?: 'neutral' | 'role' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children }) => {
  const getToneStyles = (): React.CSSProperties => {
    switch (tone) {
      case 'role':
        return { backgroundColor: 'var(--color-accent-soft)', color: 'var(--color-accent)' };
      case 'success':
        return { backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)' };
      case 'warning':
        return { backgroundColor: 'var(--color-warning-soft)', color: 'var(--color-warning)' };
      case 'danger':
        return { backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)' };
      case 'neutral':
      default:
        return { backgroundColor: 'var(--color-fill-subtle)', color: 'var(--color-text-muted)' };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px var(--space-sm, 8px)',
        borderRadius: 'var(--radius-full, 9999px)',
        fontSize: '11px',
        fontWeight: 600,
        ...getToneStyles(),
      }}
    >
      {children}
    </span>
  );
};
