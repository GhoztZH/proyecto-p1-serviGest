import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './shared/context/AuthContext.js';
import { AppLayout } from './shared/components/layout/AppLayout.js';
import { RutaProtegida } from './shared/components/layout/RutaProtegida.js';

// Vistas implementadas por Integrante 1
import { LoginPage } from './modules/auth/pages/LoginPage.js';
import { RecuperarPage } from './modules/auth/pages/RecuperarPage.js';
import { RestablecerPage } from './modules/auth/pages/RestablecerPage.js';
import { PerfilPage } from './modules/auth/pages/PerfilPage.js';
import { UsuariosPage } from './modules/users/pages/UsuariosPage.js';
import { NuevaSolicitudPage } from './modules/requests/pages/NuevaSolicitudPage.js';
import { SolicitudDetallePage } from './modules/requests/pages/SolicitudDetallePage.js';
import { SolicitudesPage } from './modules/requests/pages/SolicitudesPage.js';

/** Redirección inteligente al inicio correspondiente por rol */
const RedireccionInicio: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'ADMIN') return <Navigate to="/users" replace />;
  if (user.rol === 'COORDINADOR') return <Navigate to="/requests" replace />;
  if (user.rol === 'TECNICO') return <Navigate to="/requests" replace />;
  return <Navigate to="/requests" replace />;
};

/** Componente placeholder para módulos asignados a los demás compañeros */
const ModuloPlaceholder: React.FC<{ modulo: string; integrante: number; descripcion: string }> = ({
  modulo,
  integrante,
  descripcion,
}) => (
  <div
    style={{
      backgroundColor: 'var(--color-surface)',
      padding: '32px',
      borderRadius: '12px',
      border: '1px dashed var(--color-border)',
      textAlign: 'center',
      maxWidth: '600px',
      margin: '40px auto',
    }}
  >
    <div style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</div>
    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>Módulo: {modulo}</h2>
    <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
      {descripcion}
    </p>
    <div
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        backgroundColor: 'var(--color-accent-soft)',
        color: 'var(--color-accent)',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      Asignado a: Integrante {integrante}
    </div>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rutas Públicas (Integrante 1) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar" element={<RecuperarPage />} />
          <Route path="/restablecer" element={<RestablecerPage />} />

          {/* Rutas Protegidas dentro de AppLayout */}
          <Route
            element={
              <RutaProtegida>
                <AppLayout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<RedireccionInicio />} />
            <Route path="/profile" element={<PerfilPage />} />
            <Route path="/perfil" element={<PerfilPage />} />

            {/* Gestión de Usuarios (Exclusivo ADMIN - Integrante 1) */}
            <Route
              path="/users"
              element={
                <RutaProtegida rolesPermitidos={['ADMIN']}>
                  <UsuariosPage />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolesPermitidos={['ADMIN']}>
                  <UsuariosPage />
                </RutaProtegida>
              }
            />

            {/* Placeholders señalados para los demás integrantes */}
            <Route
              path="/clients"
              element={
                <ModuloPlaceholder
                  modulo="Clientes y Sedes"
                  integrante={2}
                  descripcion="Gestión de empresas clientes y sus sedes físicas (CRUD para Admin, consulta para Coordinador)."
                />
              }
            />
            <Route
              path="/technicians"
              element={
                <ModuloPlaceholder
                  modulo="Técnicos y Especialidades"
                  integrante={2}
                  descripcion="Fichas del personal técnico, asignación de especialidades y control de disponibilidad."
                />
              }
            />
            <Route
              path="/catalogs"
              element={
                <ModuloPlaceholder
                  modulo="Catálogos y Parámetros"
                  integrante={2}
                  descripcion="Especialidades, categorías de averías, prioridades con SLA y parámetros del sistema."
                />
              }
            />
            <Route path="/requests" element={<SolicitudesPage />} />
            <Route path="/requests/new" element={<NuevaSolicitudPage />} />
            <Route path="/requests/nueva" element={<Navigate to="/requests/new" replace />} />
            <Route path="/requests/:id" element={<SolicitudDetallePage />} />
            <Route path="/solicitudes" element={<Navigate to="/requests" replace />} />
            <Route path="/solicitudes/nueva" element={<Navigate to="/requests/new" replace />} />
            <Route path="/solicitudes/:id" element={<SolicitudDetallePage />} />
            <Route
              path="/dashboard"
              element={
                <ModuloPlaceholder
                  modulo="Dashboard y Métricas"
                  integrante={4}
                  descripcion="Indicadores de cumplimiento de SLA, reportes globales, gráficos y métricas operativas."
                />
              }
            />
            <Route
              path="/workload"
              element={
                <ModuloPlaceholder
                  modulo="Carga del Equipo"
                  integrante={4}
                  descripcion="Monitoreo de carga activa por técnico (0 a 5 solicitudes activas)."
                />
              }
            />
            <Route
              path="/audit"
              element={
                <ModuloPlaceholder
                  modulo="Auditoría Inalterable"
                  integrante={4}
                  descripcion="Consulta del log inalterable de auditoría del sistema para el Administrador."
                />
              }
            />
            <Route
              path="/notifications"
              element={
                <ModuloPlaceholder
                  modulo="Notificaciones"
                  integrante={4}
                  descripcion="Panel completo de notificaciones y eventos en tiempo real."
                />
              }
            />
          </Route>

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
