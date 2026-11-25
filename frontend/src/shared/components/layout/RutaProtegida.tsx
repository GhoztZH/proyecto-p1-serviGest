import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import type { Rol } from '../../types/api.js';

interface RutaProtegidaProps {
  rolesPermitidos?: Rol[];
  children?: React.ReactNode;
}

/**
 * Control de acceso a nivel de interfaz.
 * - Sin sesión: redirige a /login conservando la URL de origen.
 * - Con sesión pero rol no autorizado: muestra aviso de permisos insuficientes.
 */
export const RutaProtegida: React.FC<RutaProtegidaProps> = ({ rolesPermitidos, children }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ desde: location.pathname }} replace />;
  }

  if (rolesPermitidos && !rolesPermitidos.includes(user.rol)) {
    return (
      <div style={{ padding: 'var(--space-xl, 24px)', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--color-danger, #B42318)', marginBottom: '8px' }}>Acceso denegado</h2>
        <p style={{ color: 'var(--color-text-muted, #586273)' }}>
          Tu rol ({user.rol}) no tiene permisos para acceder a esta pantalla.
        </p>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
