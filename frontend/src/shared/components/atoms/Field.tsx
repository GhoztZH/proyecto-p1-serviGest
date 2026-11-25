import React from 'react';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  error,
  helperText,
  style,
  id,
  ...props
}) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px', width: '100%' }}>
      <label
        htmlFor={inputId}
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: error ? 'var(--color-danger, #B42318)' : 'var(--color-text)',
        }}
      >
        {label} {props.required && <span style={{ color: 'var(--color-danger, #B42318)' }}>*</span>}
      </label>
      <input
        id={inputId}
        style={{
          height: 'var(--size-control-md, 36px)',
          padding: '0 var(--space-md, 12px)',
          borderRadius: 'var(--radius-md, 8px)',
          border: `var(--border-width) solid ${error ? 'var(--color-danger, #B42318)' : 'var(--color-border)'}`,
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          fontSize: '13px',
          outline: 'none',
          transition: 'border-color var(--duration-fast, 120ms)',
          ...style,
        }}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--color-danger, #B42318)', marginTop: '2px' }}>
          {error}
        </span>
      )}
      {!error && helperText && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};
