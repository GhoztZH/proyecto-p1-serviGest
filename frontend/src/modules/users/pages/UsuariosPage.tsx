import React, { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/user.service.js';
import type { Usuario, Rol } from '../../../shared/types/api.js';
import { Button } from '../../../shared/components/atoms/Button.js';
import { Badge } from '../../../shared/components/atoms/Badge.js';
import { Field } from '../../../shared/components/atoms/Field.js';
import { formatDate } from '../../../shared/utils/formatters.js';

/**
 * A4 / A6 · Gestión de Usuarios (Administrador).
 * Permite listar, filtrar, dar de alta cuentas internas (Admin/Coordinador),
 * activar/desactivar cuentas y restablecer contraseñas.
 */
export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState<Rol | ''>('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal para Crear Usuario (A6)
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState<'ADMIN' | 'COORDINADOR'>('COORDINADOR');
  const [guardando, setGuardando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  // Modal para Resetear Contraseña
  const [usuarioReset, setUsuarioReset] = useState<Usuario | null>(null);
  const [resetPass, setResetPass] = useState('');
  const [reseteando, setReseteando] = useState(false);
  const [errorReset, setErrorReset] = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await userService.listar({
        page: pagina,
        limit: 10,
        q: busqueda || undefined,
        rol: filtroRol || undefined,
      });
      setUsuarios(res.data);
      setTotal(res.meta.total);
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Error al cargar los usuarios');
    } finally {
      setCargando(false);
    }
  }, [pagina, busqueda, filtroRol]);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCrear(null);
    setGuardando(true);

    try {
      await userService.crear({
        nombre: nuevoNombre,
        email: nuevoEmail,
        password: nuevoPassword,
        rol: nuevoRol,
      });
      setModalCrearAbierto(false);
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoPassword('');
      cargarUsuarios();
    } catch (err: any) {
      setErrorCrear(err.response?.data?.error?.message ?? 'Error al crear el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (u: Usuario) => {
    try {
      await userService.actualizar(u.id, { activo: !u.activo });
      cargarUsuarios();
    } catch (err: any) {
      alert(err.response?.data?.error?.message ?? 'No se pudo cambiar el estado del usuario');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioReset) return;
    setErrorReset(null);
    setReseteando(true);

    try {
      await userService.restablecerPassword(usuarioReset.id, resetPass);
      setUsuarioReset(null);
      setResetPass('');
      alert('Contraseña restablecida con éxito');
    } catch (err: any) {
      setErrorReset(err.response?.data?.error?.message ?? 'Error al restablecer la contraseña');
    } finally {
      setReseteando(false);
    }
  };

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
            Usuarios y técnicos
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Administración de cuentas de acceso del sistema (Admin y Coordinador).
          </p>
        </div>
        <Button variant="primary" onClick={() => setModalCrearAbierto(true)}>
          + Nuevo usuario
        </Button>
      </div>

      {/* Nota de límite de responsabilidad */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-fill-subtle)',
          borderRadius: '8px',
          fontSize: '12px',
          color: 'var(--color-text-muted)',
          marginBottom: '20px',
        }}
      >
        📌 <strong>Nota de asignación:</strong> Esta pantalla (A4/A6) gestiona cuentas internas implementada por el <strong>Integrante 1</strong>. La gestión de técnicos (A5 con especialidades y cargas) será complementada por el <strong>Integrante 2</strong> en su módulo <code>technicians</code>.
      </div>

      {/* Filtros */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          backgroundColor: 'var(--color-surface)',
          padding: '16px',
          borderRadius: 'var(--radius-lg, 12px)',
          border: 'var(--border-width) solid var(--color-border)',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Buscar por nombre o correo…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            flex: 1,
            height: '36px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
            backgroundColor: 'var(--color-bg)',
          }}
        />

        <select
          value={filtroRol}
          onChange={(e) => setFiltroRol(e.target.value as Rol | '')}
          style={{
            height: '36px',
            padding: '0 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
            backgroundColor: 'var(--color-bg)',
          }}
        >
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="COORDINADOR">Coordinador</option>
          <option value="TECNICO">Técnico</option>
          <option value="CLIENTE">Cliente</option>
        </select>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: 'var(--border-width) solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-fill-subtle)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Usuario</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rol</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Estado</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Último acceso</th>
              <th style={{ padding: '12px 16px', fontWeight: 600 }}>Fecha registro</th>
              <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Cargando usuarios…
                </td>
              </tr>
            ) : usuarios.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.nombre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge tone="role">{u.rol}</Badge>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <Badge tone={u.activo ? 'success' : 'neutral'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                    {u.ultimo_acceso ? formatDate(u.ultimo_acceso) : 'Nunca'}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)' }}>
                    {formatDate(u.created_at)}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <Button variant="ghost" size="sm" onClick={() => setUsuarioReset(u)}>
                        Reset pass
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleToggleActivo(u)}>
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Paginación simple */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Total: {total} usuarios
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              Anterior
            </Button>
            <Button variant="secondary" size="sm" disabled={usuarios.length < 10} onClick={() => setPagina((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      </div>

      {/* Modal Crear Usuario (A6) */}
      {modalCrearAbierto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-overlay, rgba(0,0,0,0.5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-modal, 0 16px 48px rgba(0,0,0,.24))',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Nuevo usuario interno</h2>

            {errorCrear && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {errorCrear}
              </div>
            )}

            <form onSubmit={handleCrearUsuario}>
              <Field label="Nombre completo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} required />
              <Field label="Correo de acceso" type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} required />
              <Field label="Contraseña inicial" type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} required helperText="Mínimo 8 caracteres, al menos una letra y un número" />

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '4px' }}>Rol</label>
                <select
                  value={nuevoRol}
                  onChange={(e) => setNuevoRol(e.target.value as 'ADMIN' | 'COORDINADOR')}
                  style={{ width: '100%', height: '36px', borderRadius: '8px', border: '1px solid var(--color-border)', padding: '0 12px' }}
                >
                  <option value="COORDINADOR">Coordinador (Operación)</option>
                  <option value="ADMIN">Administrador (Sistema completo)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' }}>
                <Button variant="ghost" type="button" onClick={() => setModalCrearAbierto(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={guardando}>
                  {guardando ? 'Guardando…' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resetear Contraseña */}
      {usuarioReset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--color-overlay, rgba(0,0,0,0.5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              width: '100%',
              maxWidth: '420px',
              padding: '24px',
              borderRadius: '12px',
            }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
              Restablecer contraseña
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
              Asigna una nueva clave para <strong>{usuarioReset.nombre}</strong> ({usuarioReset.email}).
            </p>

            {errorReset && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '12px' }}>
                {errorReset}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <Field
                label="Nueva contraseña temporal"
                type="password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
                required
                autoFocus
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <Button variant="ghost" type="button" onClick={() => setUsuarioReset(null)}>
                  Cancelar
                </Button>
                <Button variant="primary" type="submit" disabled={reseteando || !resetPass}>
                  {reseteando ? 'Restableciendo…' : 'Restablecer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
