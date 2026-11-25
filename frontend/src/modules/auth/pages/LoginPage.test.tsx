import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../../shared/context/AuthContext.js';
import { LoginPage } from './LoginPage.js';

const mocks = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock('../services/auth.service.js', () => ({
  authService: { login: mocks.login },
}));

const profile = {
  id: 42,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE' as const,
  clienteId: 7,
  tecnicoId: null,
};

function SessionDestination() {
  const { user } = useAuth();
  return <div>Sesión iniciada: {user?.nombre}</div>;
}

describe('login page', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.login.mockReset();
  });

  it('stores the returned session and redirects to the protected destination', async () => {
    mocks.login.mockResolvedValue({ token: 'jwt-token', usuario: profile });
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { desde: '/requests' } }]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/requests" element={<SessionDestination />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Correo de acceso/), { target: { value: profile.email } });
    fireEvent.change(screen.getByLabelText(/Contraseña/), { target: { value: 'StrongPass9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Sesión iniciada: Cliente')).toBeInTheDocument();
    expect(mocks.login).toHaveBeenCalledWith(profile.email, 'StrongPass9');
    expect(localStorage.getItem('token')).toBe('jwt-token');
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(profile);
  });
});
