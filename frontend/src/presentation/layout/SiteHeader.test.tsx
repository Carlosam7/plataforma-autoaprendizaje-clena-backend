// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { container } from '@/main/container';
import { SiteHeader } from './SiteHeader';

vi.mock('@/presentation/accessibility/AccessibilityBar', () => ({
  AccessibilityBar: () => null,
}));

describe('SiteHeader · enlace para el personal', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(cleanup);

  const montar = () =>
    render(
      <MemoryRouter>
        <SiteHeader />
      </MemoryRouter>,
    );

  it('con sesión del personal muestra «Solicitudes» hacia la cola', async () => {
    vi.spyOn(container.personal.obtenerSesion, 'ejecutar').mockResolvedValue({
      usuario: {
        id: 'u',
        nombre: 'Ana',
        rol: 'PERSONAL',
        debeCambiarPassword: false,
      },
      accessToken: 't',
    });
    montar();
    const enlace = await screen.findByRole('link', { name: 'Solicitudes' });
    expect(enlace.getAttribute('href')).toBe('/personal/solicitudes');
  });

  it('sin sesión no lo muestra', async () => {
    vi.spyOn(container.personal.obtenerSesion, 'ejecutar').mockResolvedValue(
      null,
    );
    montar();
    await screen.findByRole('link', { name: 'Guías' });
    expect(screen.queryByRole('link', { name: 'Solicitudes' })).toBeNull();
  });
});
