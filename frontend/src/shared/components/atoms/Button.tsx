import React from 'react';

/**
 * Botón base del Sistema de Diseño ServiGest (DS · Átomos · Botón).
 *
 * Reglas de uso:
 * - Un solo botón Primary por vista o formulario principal.
 * - Primary usa siempre `var(--color-accent)` y `var(--color-accent-ink)`.
 * - Variantes: 'primary' | 'secondary' | 'ghost'.
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  style,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: 'var(--color-accent)',
          color: 'var(--color-accent-ink)',
          border: 'none',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: 'var(--border-width) solid var(--color-border)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-text-muted)',
          border: 'none',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return { height: 'var(--size-control-sm, 32px)', padding: '0 var(--space-sm, 8px)', fontSize: '12px' };
      case 'lg':
        return { height: 'var(--size-control-lg, 44px)', padding: '0 var(--space-xl, 24px)', fontSize: '14px' };
      case 'md':
      default:
        return { height: 'var(--size-control-md, 36px)', padding: '0 var(--space-lg, 16px)', fontSize: '13px' };
    }
  };

  return (
    <button
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--radius-md, 8px)',
        fontWeight: 500,
        transition: 'all var(--duration-fast, 120ms) ease',
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 'var(--opacity-disabled, 0.4)' : 1,
        ...getSizeStyles(),
        ...getVariantStyles(),
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
};
