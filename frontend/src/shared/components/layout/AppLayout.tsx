import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Sidebar, type UserRole } from './Sidebar.js';
import { Topbar } from './Topbar.js';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role: UserRole = (user?.rol ? user.rol.toLowerCase() : 'admin') as UserRole;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      <Sidebar
        currentRole={role}
        currentPath={location.pathname}
        onNavigate={(path) => navigate(path)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, padding: 'var(--space-xl, 24px)', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
