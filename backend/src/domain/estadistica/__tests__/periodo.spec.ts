import { describe, expect, it } from 'vitest';
import { RangoFechasInvalidoError } from '../errores.js';
import { Periodo } from '../periodo.js';

// 26/11/2026 a las 10:00 en Bogotá.
const AHORA = new Date('2026-11-26T15:00:00.000Z');

describe('Periodo (HU-31)', () => {
  it('sin fechas son los últimos 7 días contando hoy, en Bogotá', () => {
    const periodo = Periodo.crear({ ahora: AHORA });
    expect(periodo.desde).toBe('2026-11-20');
    expect(periodo.hasta).toBe('2026-11-26');
  });

  it('«hoy» es la fecha de Bogotá aunque en UTC ya sea el día siguiente', () => {
    // 27/11 a las 03:00 UTC = 26/11 a las 22:00 en Bogotá.
    const periodo = Periodo.crear({ ahora: new Date('2026-11-27T03:00:00Z') });
    expect(periodo.hasta).toBe('2026-11-26');
  });

  it('solo con hasta: los 7 días que terminan ese día', () => {
    expect(Periodo.crear({ hasta: '2026-03-03', ahora: AHORA }).desde).toBe(
      '2026-02-25',
    );
  });

  it('solo con desde: hasta hoy', () => {
    const periodo = Periodo.crear({ desde: '2026-11-01', ahora: AHORA });
    expect([periodo.desde, periodo.hasta]).toEqual([
      '2026-11-01',
      '2026-11-26',
    ]);
  });

  it('el intervalo UTC va de las 00:00 de desde a las 00:00 del día siguiente a hasta, en Bogotá', () => {
    const periodo = Periodo.crear({
      desde: '2026-11-20',
      hasta: '2026-11-26',
      ahora: AHORA,
    });
    expect(periodo.inicio.toISOString()).toBe('2026-11-20T05:00:00.000Z');
    expect(periodo.fin.toISOString()).toBe('2026-11-27T05:00:00.000Z');
  });

  it('un solo día: desde igual a hasta', () => {
    const periodo = Periodo.crear({
      desde: '2026-12-31',
      hasta: '2026-12-31',
      ahora: AHORA,
    });
    expect(periodo.fin.toISOString()).toBe('2027-01-01T05:00:00.000Z');
  });

  it('acepta 366 días y rechaza 367', () => {
    expect(() =>
      Periodo.crear({ desde: '2025-11-26', hasta: '2026-11-26', ahora: AHORA }),
    ).not.toThrow();
    expect(() =>
      Periodo.crear({ desde: '2025-11-25', hasta: '2026-11-26', ahora: AHORA }),
    ).toThrow(RangoFechasInvalidoError);
  });

  it('rechaza desde posterior a hasta', () => {
    expect(() =>
      Periodo.crear({ desde: '2026-11-27', hasta: '2026-11-26', ahora: AHORA }),
    ).toThrow(
      expect.objectContaining({
        codigo: 'RANGO_FECHAS_INVALIDO',
        detalles: { campo: 'desde' },
      }),
    );
  });

  it.each(['2026-02-30', '2026-13-01', '26-11-2026', '2026-1-5', 'ayer'])(
    'rechaza la fecha «%s»',
    (hasta) => {
      expect(() => Periodo.crear({ hasta, ahora: AHORA })).toThrow(
        expect.objectContaining({
          codigo: 'RANGO_FECHAS_INVALIDO',
          detalles: { campo: 'hasta' },
        }),
      );
    },
  );

  it('acepta el 29 de febrero de un año bisiesto', () => {
    expect(() =>
      Periodo.crear({ hasta: '2028-02-29', ahora: AHORA }),
    ).not.toThrow();
  });
});
