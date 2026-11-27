import { describe, expect, it, vi } from 'vitest';
import { SolicitudAyudaError } from '@/domain/ayuda/errors';
import { ListarSolicitudesAyuda } from './ListarSolicitudesAyuda';
import type { SolicitudesAyudaRepository } from './ports';
import { ResolverSolicitudAyuda } from './ResolverSolicitudAyuda';
import { TomarSolicitudAyuda } from './TomarSolicitudAyuda';

const repo = () =>
  ({
    listar: vi
      .fn()
      .mockResolvedValue({ datos: [], total: 0, pagina: 1, limite: 20 }),
    tomar: vi.fn().mockResolvedValue({}),
    resolver: vi.fn().mockResolvedValue({}),
  }) as unknown as SolicitudesAyudaRepository & {
    listar: ReturnType<typeof vi.fn>;
    tomar: ReturnType<typeof vi.fn>;
    resolver: ReturnType<typeof vi.fn>;
  };

describe('casos de uso de solicitudes de ayuda', () => {
  it('Listar aplica página 1 y límite 20 por defecto y respeta los filtros', async () => {
    const r = repo();
    await new ListarSolicitudesAyuda(r).ejecutar('t', { estado: 'PENDIENTE' });
    expect(r.listar).toHaveBeenCalledWith('t', {
      pagina: 1,
      limite: 20,
      estado: 'PENDIENTE',
    });
    await new ListarSolicitudesAyuda(r).ejecutar('t', { pagina: 3, limite: 5 });
    expect(r.listar).toHaveBeenLastCalledWith('t', { pagina: 3, limite: 5 });
  });

  it('Tomar delega exactamente una vez', async () => {
    const r = repo();
    await new TomarSolicitudAyuda(r).ejecutar('t', 'id');
    expect(r.tomar).toHaveBeenCalledTimes(1);
    expect(r.tomar).toHaveBeenCalledWith('t', 'id');
  });

  it('Resolver normaliza el comentario: vacío o espacios -> null, recorta', async () => {
    const r = repo();
    const uc = new ResolverSolicitudAyuda(r);
    await uc.ejecutar('t', 'id', '   ');
    expect(r.resolver).toHaveBeenLastCalledWith('t', 'id', null);
    await uc.ejecutar('t', 'id', undefined);
    expect(r.resolver).toHaveBeenLastCalledWith('t', 'id', null);
    await uc.ejecutar('t', 'id', '  hecho  ');
    expect(r.resolver).toHaveBeenLastCalledWith('t', 'id', 'hecho');
  });

  it('Resolver acepta 500 letras y rechaza 501 sin llamar al servidor', async () => {
    const r = repo();
    const uc = new ResolverSolicitudAyuda(r);
    await uc.ejecutar('t', 'id', 'a'.repeat(500));
    expect(r.resolver).toHaveBeenCalledTimes(1);
    expect(() => uc.ejecutar('t', 'id', 'a'.repeat(501))).toThrow(
      SolicitudAyudaError,
    );
    expect(r.resolver).toHaveBeenCalledTimes(1);
  });
});
