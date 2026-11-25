import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { UsuariosPage } from './UsuariosPage.js';

const mocks = vi.hoisted(() => ({ listar: vi.fn(), crear: vi.fn() }));

vi.mock('../services/user.service.js', () => ({
  userService: {
    listar: mocks.listar,
    crear: mocks.crear,
  },
}));

const admin = {
  id: 17,
  email: 'admin@example.test',
  nombre: 'Admin de prueba',
  rol: 'ADMIN' as const,
  activo: true,
  ultimo_acceso: null,
  created_at: '2025-01-01T00:00:00Z',
};

describe('user management page', () => {
  beforeEach(() => {
    mocks.listar.mockReset();
    mocks.crear.mockReset();
    mocks.listar.mockResolvedValue({ data: [admin], meta: { page: 1, limit: 10, total: 1, totalPages: 1 } });
  });

  it('loads accounts and submits a new internal user through the service', async () => {
    render(<UsuariosPage />);

    expect(await screen.findByText('admin@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Nuevo usuario' }));

    fireEvent.change(screen.getByLabelText(/Nombre completo/), { target: { value: 'Coordinador' } });
    fireEvent.change(screen.getByLabelText(/Correo de acceso/), { target: { value: 'coord@example.test' } });
    fireEvent.change(screen.getByLabelText(/Contraseña inicial/), { target: { value: 'StrongPass9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }));

    await waitFor(() =>
      expect(mocks.crear).toHaveBeenCalledWith({
        nombre: 'Coordinador',
        email: 'coord@example.test',
        password: 'StrongPass9',
        rol: 'COORDINADOR',
      }),
    );
    expect(mocks.listar).toHaveBeenCalledTimes(2);
  });
});
