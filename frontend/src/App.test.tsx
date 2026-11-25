import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App.js';

const mocks = vi.hoisted(() => ({ listarSolicitudes: vi.fn() }));

vi.mock('./modules/requests/services/solicitud.service.js', () => ({
  solicitudService: { listar: mocks.listarSolicitudes },
}));

const admin = {
  id: 1,
  email: 'admin@example.test',
  nombre: 'Admin',
  rol: 'ADMIN' as const,
  clienteId: null,
  tecnicoId: null,
};

describe('application routes', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.listarSolicitudes.mockReset();
    window.history.replaceState({}, '', '/requests');
  });

  it('protects request pages and sends unauthenticated visitors to login', async () => {
    render(<App />);

    expect(await screen.findByText('Gestión de solicitudes de servicio técnico')).toBeInTheDocument();
    expect(mocks.listarSolicitudes).not.toHaveBeenCalled();
  });

  it('mounts the request list for an authenticated admin instead of the placeholder', async () => {
    localStorage.setItem('token', 'valid-session');
    localStorage.setItem('user', JSON.stringify(admin));
    mocks.listarSolicitudes.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Solicitudes' })).toBeInTheDocument();
    await waitFor(() => expect(mocks.listarSolicitudes).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 20 })));
    expect(screen.queryByText('Módulo: Solicitudes de Servicio (Core)')).not.toBeInTheDocument();
  });
});
