import React from 'react';

export type UserRole = 'admin' | 'coordinador' | 'tecnico' | 'cliente';

interface NavItem {
  label: string;
  href: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const MENU_CONFIG: Record<UserRole, NavSection[]> = {
  admin: [
    {
      title: 'SEGUIMIENTO',
      items: [
        { label: 'Reportes globales', href: '/dashboard' },
        { label: 'Solicitudes (consulta)', href: '/requests' },
      ],
    },
    {
      title: 'ADMINISTRACIÓN',
      items: [
        { label: 'Usuarios', href: '/users' },
        { label: 'Técnicos', href: '/technicians' },
        { label: 'Clientes y sedes', href: '/clients' },
        { label: 'Catálogos y parámetros', href: '/catalogs' },
        { label: 'Auditoría', href: '/audit' },
      ],
    },
    {
      title: 'CUENTA',
      items: [
        { label: 'Mi perfil', href: '/profile' },
      ],
    },
  ],
  coordinador: [
    {
      title: 'OPERACIÓN',
      items: [
        { label: 'Dashboard operativo', href: '/dashboard' },
        { label: 'Bandeja de solicitudes', href: '/requests' },
        { label: 'Carga del equipo', href: '/workload' },
      ],
    },
    {
      title: 'CONSULTA',
      items: [
        { label: 'Técnicos', href: '/technicians' },
        { label: 'Clientes y sedes', href: '/clients' },
      ],
    },
    {
      title: 'CUENTA',
      items: [
        { label: 'Mi perfil', href: '/profile' },
      ],
    },
  ],
  tecnico: [
    {
      title: 'MI TRABAJO',
      items: [
        { label: 'Mi panel', href: '/dashboard' },
        { label: 'Mis solicitudes', href: '/requests' },
      ],
    },
    {
      title: 'CUENTA',
      items: [
        { label: 'Mi perfil', href: '/profile' },
        { label: 'Disponibilidad', href: '/availability' },
      ],
    },
  ],
  cliente: [
    {
      title: 'MIS SOLICITUDES',
      items: [
        { label: 'Mis solicitudes', href: '/requests' },
        { label: 'Nueva solicitud', href: '/requests/new' },
      ],
    },
    {
      title: 'CUENTA',
      items: [
        { label: 'Mi perfil', href: '/profile' },
      ],
    },
  ],
};

export interface SidebarProps {
  currentRole: UserRole;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, currentPath = '/dashboard', onNavigate }) => {
  const sections = MENU_CONFIG[currentRole] ?? [];

  return (
    <aside
      style={{
        width: 'var(--size-sidebar, 240px)',
        minWidth: 'var(--size-sidebar, 240px)',
        backgroundColor: 'var(--color-surface)',
        borderRight: 'var(--border-width) solid var(--color-border)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: 'var(--size-topbar, 64px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 var(--space-xl, 24px)',
          borderBottom: 'var(--border-width) solid var(--color-border)',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--color-accent)' }}>ServiGest</span>
      </div>

      <nav style={{ flex: 1, padding: 'var(--space-lg, 16px)', overflowY: 'auto' }}>
        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 'var(--space-xl, 24px)' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                marginBottom: 'var(--space-sm, 8px)',
                paddingLeft: 'var(--space-sm, 8px)',
                letterSpacing: '0.05em',
              }}
            >
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = currentPath === item.href;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => onNavigate?.(item.href)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: 'var(--space-sm, 8px) var(--space-md, 12px)',
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: '13px',
                    fontWeight: isActive ? 600 : 400,
                    backgroundColor: isActive ? 'var(--color-accent-soft)' : 'transparent',
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '4px',
                    transition: 'all var(--duration-fast, 120ms)',
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
};
