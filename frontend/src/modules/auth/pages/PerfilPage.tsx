import React, { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext.js';
import { authService } from '../services/auth.service.js';
import { Field } from '../../../shared/components/atoms/Field.js';
import { Button } from '../../../shared/components/atoms/Button.js';
import { Badge } from '../../../shared/components/atoms/Badge.js';

/**
 * A3 / CO8 / T5 / C5 · Mi Perfil (común para los 4 roles).
 * Permite actualizar el nombre personal y cambiar la contraseña de acceso.
 */
export const PerfilPage: React.FC = () => {
  const { user, actualizarUsuario } = useAuth();

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [actualizandoNombre, setActualizandoNombre] = useState(false);
  const [mensajeNombre, setMensajeNombre] = useState<string | null>(null);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [cambiandoPass, setCambiandoPass] = useState(false);
  const [mensajePass, setMensajePass] = useState<string | null>(null);
  const [errorPass, setErrorPass] = useState<string | null>(null);

  if (!user) return null;

  const handleGuardarNombre = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeNombre(null);
    setErrorNombre(null);
    setActualizandoNombre(true);

    try {
      const perfilActualizado = await authService.actualizarPerfil(nombre);
      actualizarUsuario(perfilActualizado);
      setMensajeNombre('Nombre actualizado correctamente');
    } catch (err: any) {
      setErrorNombre(err.response?.data?.error?.message ?? 'Error al actualizar el nombre');
    } finally {
      setActualizandoNombre(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajePass(null);
    setErrorPass(null);

    if (nueva !== confirmar) {
      setErrorPass('La nueva contraseña y su confirmación no coinciden');
      return;
    }

    setCambiandoPass(true);
    try {
      await authService.cambiarPassword(actual, nueva);
      setMensajePass('Contraseña actualizada con éxito');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (err: any) {
      setErrorPass(err.response?.data?.error?.message ?? 'Error al cambiar la contraseña');
    } finally {
      setCambiandoPass(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--space-2xl, 32px)' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text)', marginBottom: '8px' }}>
          Mi perfil
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Administra tus datos personales y credenciales de acceso.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Tarjeta 1: Información de Cuenta y Rol */}
        <section
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-lg, 12px)',
            border: 'var(--border-width) solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Información de cuenta</h2>
            <Badge tone="role">{user.rol}</Badge>
          </div>

          <form onSubmit={handleGuardarNombre}>
            {mensajeNombre && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                {mensajeNombre}
              </div>
            )}
            {errorNombre && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                {errorNombre}
              </div>
            )}

            <Field
              label="Correo electrónico"
              type="email"
              value={user.email}
              disabled
              helperText="El correo institucional solo puede ser modificado por un Administrador."
            />

            <Field
              label="Nombre completo"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" disabled={actualizandoNombre || nombre === user.nombre}>
              {actualizandoNombre ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </form>
        </section>

        {/* Tarjeta 2: Cambiar Contraseña */}
        <section
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '24px',
            borderRadius: 'var(--radius-lg, 12px)',
            border: 'var(--border-width) solid var(--color-border)',
          }}
        >
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Cambiar contraseña</h2>

          <form onSubmit={handleCambiarPassword}>
            {mensajePass && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-success-soft)', color: 'var(--color-success)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                {mensajePass}
              </div>
            )}
            {errorPass && (
              <div style={{ padding: '10px', backgroundColor: 'var(--color-danger-soft)', color: 'var(--color-danger)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px' }}>
                {errorPass}
              </div>
            )}

            <Field
              label="Contraseña actual"
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              required
            />

            <Field
              label="Nueva contraseña"
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              required
              helperText="Mínimo 8 caracteres, al menos una letra y un número."
            />

            <Field
              label="Confirmar nueva contraseña"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" disabled={cambiandoPass || !actual || !nueva || !confirmar}>
              {cambiandoPass ? 'Actualizando…' : 'Actualizar contraseña'}
            </Button>
          </form>
        </section>

        {/* Nota para Integrante 2 sobre datos de rol extendidos */}
        {(user.rol === 'TECNICO' || user.rol === 'CLIENTE') && (
          <div style={{ padding: '16px', backgroundColor: 'var(--color-fill-subtle)', borderRadius: '8px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            💡 <strong>Nota arquitectónica:</strong> Los detalles extendidos de tu perfil ({user.rol === 'TECNICO' ? 'especialidades y capacidad de atención' : 'razón social y sedes'}) serán conectados por el <strong>Integrante 2</strong> en sus respectivos módulos (<code>technicians</code> / <code>clients</code>).
          </div>
        )}
      </div>
    </div>
  );
};
