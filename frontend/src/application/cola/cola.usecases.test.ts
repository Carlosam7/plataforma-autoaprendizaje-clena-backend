import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ColaAyudaRepository } from './ports';
import { ResolverSolicitud } from './ResolverSolicitud';
import { SeguimientoCola } from './SeguimientoCola';
import { VerColaAyuda } from './VerColaAyuda';
import type { SolicitudEnCola } from '@/domain/cola/types';
import { minutosEsperando } from '@/domain/cola/types';

const solicitud = (
  cambios: Partial<SolicitudEnCola> = {},
): SolicitudEnCola => ({
  id: 's-1',
  equipo: '12',
  tema: 'CORREO',
  estado: 'PENDIENTE',
  guia: null,
  paso: null,
  creadaEn: new Date('2026-11-27T15:00:00Z'),
  atendidaPor: null,
  tomadaEn: null,
  resueltaEn: null,
  comentarioResolucion: null,
  ...cambios,
});

function repositorio(): ColaAyudaRepository {
  return {
    listar: vi.fn(async ({ estado }) =>
      estado === 'PENDIENTE'
        ? { datos: [solicitud()], total: 3 }
        : {
            datos: [solicitud({ id: 's-2', estado: 'EN_ATENCION' })],
            total: 1,
          },
    ),
    tomar: vi.fn(async () => solicitud({ estado: 'EN_ATENCION' })),
    resolver: vi.fn(async () => solicitud({ estado: 'RESUELTA' })),
  };
}

describe('FE-06 · cola de ayuda (HU-30)', () => {
  it('VerColaAyuda trae las pendientes y las que están en atención', async () => {
    const repo = repositorio();
    const cola = await new VerColaAyuda(repo).ejecutar();
    expect(repo.listar).toHaveBeenCalledWith({
      estado: 'PENDIENTE',
      limite: 50,
    });
    expect(repo.listar).toHaveBeenCalledWith({
      estado: 'EN_ATENCION',
      limite: 50,
    });
    expect(cola.totalPendientes).toBe(3);
    expect(cola.pendientes[0].id).toBe('s-1');
    expect(cola.enAtencion[0].id).toBe('s-2');
  });

  describe('ResolverSolicitud', () => {
    it('envía el comentario sin espacios sobrantes, o null si está vacío', async () => {
      const repo = repositorio();
      await new ResolverSolicitud(repo).ejecutar('s-1', '  Se explicó.  ');
      await new ResolverSolicitud(repo).ejecutar('s-1', '   ');
      await new ResolverSolicitud(repo).ejecutar('s-1');
      expect(vi.mocked(repo.resolver).mock.calls).toEqual([
        ['s-1', 'Se explicó.'],
        ['s-1', null],
        ['s-1', null],
      ]);
    });

    it('rechaza un comentario de más de 500 letras sin llamar al servidor', async () => {
      const repo = repositorio();
      await expect(
        new ResolverSolicitud(repo).ejecutar('s-1', 'a'.repeat(501)),
      ).rejects.toMatchObject({ campo: 'comentario', statusCode: 400 });
      expect(repo.resolver).not.toHaveBeenCalled();
    });
  });

  describe('SeguimientoCola (cada 15 s)', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('pide la cola al empezar y cada 15 s, y deja de hacerlo al detenerse', async () => {
      const repo = repositorio();
      const eventos: string[] = [];
      const detener = new SeguimientoCola(new VerColaAyuda(repo)).iniciar((e) =>
        eventos.push(e.tipo),
      );
      await vi.advanceTimersByTimeAsync(0);
      expect(eventos).toEqual(['actualizada']);

      await vi.advanceTimersByTimeAsync(15_000);
      await vi.advanceTimersByTimeAsync(15_000);
      expect(eventos).toEqual(['actualizada', 'actualizada', 'actualizada']);

      detener();
      await vi.advanceTimersByTimeAsync(60_000);
      expect(eventos).toHaveLength(3);
    });

    it('un error se avisa pero el seguimiento sigue', async () => {
      const repo = repositorio();
      vi.mocked(repo.listar).mockRejectedValueOnce(new Error('sin red'));
      const eventos: string[] = [];
      const detener = new SeguimientoCola(new VerColaAyuda(repo)).iniciar((e) =>
        eventos.push(e.tipo),
      );
      await vi.advanceTimersByTimeAsync(15_000);
      expect(eventos).toEqual(['error', 'actualizada']);
      detener();
    });
  });

  it('minutosEsperando cuenta minutos completos y nunca negativos', () => {
    const s = solicitud();
    expect(minutosEsperando(s, new Date('2026-11-27T15:04:59Z'))).toBe(4);
    expect(minutosEsperando(s, new Date('2026-11-27T14:59:00Z'))).toBe(0);
  });
});
