import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../shared/context/AuthContext.js';
import { NuevaSolicitudPage } from './NuevaSolicitudPage.js';

const mocks = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock('../../../shared/api/client.js', () => ({
  api: { get: mocks.get },
}));

const cliente = {
  id: 42,
  email: 'cliente@example.test',
  nombre: 'Cliente',
  rol: 'CLIENTE' as const,
  clienteId: 99,
  tecnicoId: null,
};

describe('new request page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'valid-session');
    localStorage.setItem('user', JSON.stringify(cliente));
    mocks.get.mockReset();
    mocks.get.mockResolvedValue({ data: { data: [] } });
  });

  it('loads customer sites using the authenticated customer profile ID', async () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <NuevaSolicitudPage />
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => expect(mocks.get).toHaveBeenCalledWith('/clientes/99/sedes'));
    expect(mocks.get).not.toHaveBeenCalledWith('/clientes/42/sedes');
  });
});
