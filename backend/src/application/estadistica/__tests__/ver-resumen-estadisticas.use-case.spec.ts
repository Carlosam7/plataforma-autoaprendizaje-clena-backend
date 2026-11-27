import { beforeEach, describe, expect, it } from 'vitest';
import {
  Agregados,
  EstadisticaRepository,
} from '../../../domain/estadistica/estadistica.repository.js';
import { RangoFechasInvalidoError } from '../../../domain/estadistica/errores.js';
import { RelojFijo } from '../../auth/__tests__/fakes.js';
import { VerResumenEstadisticasUseCase } from '../ver-resumen-estadisticas.use-case.js';

const VACIO: Agregados = {
  consultasGuias: 0,
  solicitudesAyuda: 0,
  topGuias: [],
  consultasPorCategoria: [],
  solicitudesPorTema: [],
};

/** Devuelve `respuesta` y anota con qué intervalo lo llamaron. */
class EstadisticaRepositoryFalso extends EstadisticaRepository {
  respuesta: Agregados = VACIO;
  llamadas: { inicio: string; fin: string; limiteTop: number }[] = [];
  agregar(inicio: Date, fin: Date, limiteTop: number): Promise<Agregados> {
    this.llamadas.push({
      inicio: inicio.toISOString(),
      fin: fin.toISOString(),
      limiteTop,
    });
    return Promise.resolve(this.respuesta);
  }
}

describe('HU-31 · VerResumenEstadisticasUseCase', () => {
  let repositorio: EstadisticaRepositoryFalso;
  let verResumen: VerResumenEstadisticasUseCase;

  beforeEach(() => {
    repositorio = new EstadisticaRepositoryFalso();
    // 26/11/2026 a las 10:00 en Bogotá.
    verResumen = new VerResumenEstadisticasUseCase(
      repositorio,
      new RelojFijo(new Date('2026-11-26T15:00:00.000Z')),
    );
  });

  it('sin fechas consulta los últimos 7 días en Bogotá, con el top de 10 guías', async () => {
    const resumen = await verResumen.ejecutar({});
    expect(resumen.periodo).toEqual({
      desde: '2026-11-20',
      hasta: '2026-11-26',
      zonaHoraria: 'America/Bogota',
    });
    expect(repositorio.llamadas).toEqual([
      {
        inicio: '2026-11-20T05:00:00.000Z',
        fin: '2026-11-27T05:00:00.000Z',
        limiteTop: 10,
      },
    ]);
  });

  it('devuelve las cifras del repositorio y hayDatos', async () => {
    repositorio.respuesta = {
      consultasGuias: 3,
      solicitudesAyuda: 1,
      topGuias: [{ slug: 'smishing', titulo: 'Smishing', consultas: 3 }],
      consultasPorCategoria: [
        {
          slug: 'seguridad-digital',
          nombre: 'Seguridad digital',
          consultas: 3,
        },
      ],
      solicitudesPorTema: [{ tema: 'CORREO', cantidad: 1 }],
    };
    expect(
      await verResumen.ejecutar({ desde: '2026-11-01', hasta: '2026-11-30' }),
    ).toEqual({
      periodo: {
        desde: '2026-11-01',
        hasta: '2026-11-30',
        zonaHoraria: 'America/Bogota',
      },
      totales: { consultasGuias: 3, solicitudesAyuda: 1 },
      topGuias: [{ slug: 'smishing', titulo: 'Smishing', consultas: 3 }],
      consultasPorCategoria: [
        {
          slug: 'seguridad-digital',
          nombre: 'Seguridad digital',
          consultas: 3,
        },
      ],
      solicitudesPorTema: [{ tema: 'CORREO', cantidad: 1 }],
      hayDatos: true,
    });
  });

  it('sin consultas ni solicitudes: hayDatos false, totales en 0 y listas vacías', async () => {
    expect(await verResumen.ejecutar({})).toMatchObject({
      totales: { consultasGuias: 0, solicitudesAyuda: 0 },
      topGuias: [],
      consultasPorCategoria: [],
      solicitudesPorTema: [],
      hayDatos: false,
    });
  });

  it.each([
    [{ consultasGuias: 0, solicitudesAyuda: 2 }],
    [{ consultasGuias: 5, solicitudesAyuda: 0 }],
  ])('hay datos si hubo consultas o solicitudes: %o', async (totales) => {
    repositorio.respuesta = { ...VACIO, ...totales };
    expect((await verResumen.ejecutar({})).hayDatos).toBe(true);
  });

  it('un rango inválido no llega a la base de datos', async () => {
    await expect(
      verResumen.ejecutar({ desde: '2026-11-27', hasta: '2026-11-26' }),
    ).rejects.toThrow(RangoFechasInvalidoError);
    expect(repositorio.llamadas).toEqual([]);
  });
});
