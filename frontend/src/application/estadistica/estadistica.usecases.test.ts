import { describe, expect, it, vi } from 'vitest';
import {
  RANGO_MAXIMO_DIAS,
  validarPeriodo,
} from '@/domain/estadistica/periodo';
import { EstadisticaError } from '@/domain/estadistica/errors';
import type { EstadisticaRepository } from './ports';
import { VerResumenEstadisticas } from './VerResumenEstadisticas';

describe('validarPeriodo (reglas de C-11)', () => {
  it.each([
    [{}],
    [{ desde: '2026-11-20' }],
    [{ hasta: '2026-11-26' }],
    [{ desde: '2026-11-26', hasta: '2026-11-26' }],
    [{ desde: '2026-11-20', hasta: '2026-11-26' }],
    [{ desde: '2024-01-01', hasta: '2024-12-31' }], // 366 días (año bisiesto)
    [{ desde: '2024-02-29', hasta: '2024-02-29' }],
  ])('válido: %j', (p) => {
    expect(validarPeriodo(p)).toBeNull();
  });

  it.each([
    [{ desde: 'ayer' }, /inicial/],
    [{ hasta: '26-11-2026' }, /final/],
    [{ desde: '2026-02-30' }, /inicial/],
    [{ hasta: '2026-13-01' }, /final/],
    [{ desde: '2023-02-29' }, /inicial/],
    [{ desde: '2026-11-27', hasta: '2026-11-26' }, /posterior/],
    [{ desde: '2025-01-01', hasta: '2026-01-02' }, /máximo/],
  ])('inválido: %j', (p, mensaje) => {
    expect(validarPeriodo(p)).toMatch(mensaje);
  });

  it('el límite es 366 días con ambos extremos', () => {
    expect(RANGO_MAXIMO_DIAS).toBe(366);
    expect(
      validarPeriodo({ desde: '2023-01-01', hasta: '2023-12-31' }),
    ).toBeNull(); // 365
    expect(
      validarPeriodo({ desde: '2023-01-01', hasta: '2024-01-01' }),
    ).toBeNull(); // 366
    expect(
      validarPeriodo({ desde: '2023-01-01', hasta: '2024-01-02' }),
    ).toMatch(/máximo/); // 367
  });
});

describe('VerResumenEstadisticas', () => {
  const repo = () =>
    ({
      resumen: vi.fn().mockResolvedValue({}),
    }) as unknown as EstadisticaRepository & {
      resumen: ReturnType<typeof vi.fn>;
    };

  it('periodo inválido no llega al servidor', () => {
    const r = repo();
    expect(() =>
      new VerResumenEstadisticas(r).ejecutar('t', {
        desde: '2026-11-27',
        hasta: '2026-11-26',
      }),
    ).toThrow(EstadisticaError);
    expect(r.resumen).not.toHaveBeenCalled();
  });

  it('quita los vacíos y delega con el token', async () => {
    const r = repo();
    await new VerResumenEstadisticas(r).ejecutar('tok', {
      desde: '',
      hasta: '2026-11-26',
    });
    expect(r.resumen).toHaveBeenCalledWith('tok', { hasta: '2026-11-26' });
    await new VerResumenEstadisticas(r).ejecutar('tok');
    expect(r.resumen).toHaveBeenLastCalledWith('tok', {});
  });
});
