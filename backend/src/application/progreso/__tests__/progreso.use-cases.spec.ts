import { beforeEach, describe, expect, it } from 'vitest';
import { AvanceGuia } from '../../../domain/progreso/avance-guia.js';
import { PasoNoEncontradoError } from '../../../domain/progreso/errores.js';
import {
  CriterioProgreso,
  ProgresoRepository,
} from '../../../domain/progreso/progreso.repository.js';
import { Pagina } from '../../../domain/shared/pagina.js';
import { RelojFijo } from '../../auth/__tests__/fakes.js';
import { MarcarPasoLeidoUseCase } from '../marcar-paso-leido.use-case.js';
import { SincronizarProgresoUseCase } from '../sincronizar-progreso.use-case.js';
import { VerMiProgresoUseCase } from '../ver-mi-progreso.use-case.js';

interface GuiaEnMemoria {
  guiaId: string;
  slug: string;
  titulo: string;
  totalPasos: number;
  /** Id de su actividad, si tiene. */
  actividadId?: string;
}

/** Dos guías publicadas: «smishing» (3 pasos y actividad) y «vishing» (2 pasos, sin actividad). */
class ProgresoRepositoryEnMemoria extends ProgresoRepository {
  guias: GuiaEnMemoria[] = [
    {
      guiaId: 'g-smishing',
      slug: 'smishing',
      titulo: 'Smishing',
      totalPasos: 3,
      actividadId: 'a-smishing',
    },
    { guiaId: 'g-vishing', slug: 'vishing', titulo: 'Vishing', totalPasos: 2 },
  ];
  /** «usuario|guía» → números de los pasos leídos. */
  leidos = new Map<string, Set<number>>();
  ultimos = new Map<string, number>();
  completadas = new Map<string, Date>();
  /** «usuario|guía» de quienes aprobaron la actividad. */
  aprobadas = new Set<string>();
  recibido?: CriterioProgreso;

  private avanceDe(usuarioId: string, guia: GuiaEnMemoria): AvanceGuia {
    const llave = `${usuarioId}|${guia.guiaId}`;
    return new AvanceGuia({
      guiaId: guia.guiaId,
      slug: guia.slug,
      categoriaSlug: 'seguridad-digital',
      titulo: guia.titulo,
      nivel: 'BASICO',
      totalPasos: guia.totalPasos,
      pasosLeidos: this.leidos.get(llave)?.size ?? 0,
      tieneActividad: guia.actividadId !== undefined,
      actividadAprobada: this.aprobadas.has(llave),
      ultimoPaso: this.ultimos.get(llave) ?? null,
      completadaEn: this.completadas.get(llave) ?? null,
    });
  }
  listar(
    usuarioId: string,
    criterio: CriterioProgreso,
  ): Promise<Pagina<AvanceGuia>> {
    this.recibido = criterio;
    return Promise.resolve({
      elementos: this.guias.map((g) => this.avanceDe(usuarioId, g)),
      total: this.guias.length,
    });
  }
  avance(usuarioId: string, guiaId: string): Promise<AvanceGuia | null> {
    const guia = this.guias.find((g) => g.guiaId === guiaId);
    return Promise.resolve(guia ? this.avanceDe(usuarioId, guia) : null);
  }
  buscarPaso(guiaSlug: string, orden: number) {
    const guia = this.guias.find((g) => g.slug === guiaSlug);
    const existe = guia && orden >= 1 && orden <= guia.totalPasos;
    return Promise.resolve(
      existe
        ? { guiaId: guia.guiaId, pasoId: `${guia.guiaId}:${orden}` }
        : null,
    );
  }
  registrarLectura(lectura: {
    usuarioId: string;
    guiaId: string;
    pasoId: string;
  }): Promise<void> {
    const llave = `${lectura.usuarioId}|${lectura.guiaId}`;
    const orden = Number(lectura.pasoId.split(':')[1]);
    this.leidos.set(llave, (this.leidos.get(llave) ?? new Set()).add(orden));
    this.ultimos.set(llave, orden);
    return Promise.resolve();
  }
  marcarCompletada(
    usuarioId: string,
    guiaId: string,
    completadaEn: Date,
  ): Promise<void> {
    this.completadas.set(`${usuarioId}|${guiaId}`, completadaEn);
    return Promise.resolve();
  }
  guiaDeActividad(actividadId: string): Promise<string | null> {
    const guia = this.guias.find((g) => g.actividadId === actividadId);
    return Promise.resolve(guia?.guiaId ?? null);
  }
}

const AHORA = new Date('2026-11-13T15:00:00.000Z');
const CARMEN = '41234567';
const RAFAEL = '52345678';

describe('HU-23 · Ver mi progreso', () => {
  let progresos: ProgresoRepositoryEnMemoria;
  let reloj: RelojFijo;
  let sincronizar: SincronizarProgresoUseCase;
  let marcar: MarcarPasoLeidoUseCase;
  let verProgreso: VerMiProgresoUseCase;

  const criterio: CriterioProgreso = {
    ordenarPor: 'titulo',
    direccion: 'asc',
    pagina: 1,
    limite: 20,
  };
  const leer = (slug: string, ...ordenes: number[]) =>
    ordenes.reduce(
      (antes, orden) => antes.then(() => marcar.ejecutar(CARMEN, slug, orden)),
      Promise.resolve() as Promise<unknown>,
    );

  beforeEach(() => {
    progresos = new ProgresoRepositoryEnMemoria();
    reloj = new RelojFijo(AHORA);
    sincronizar = new SincronizarProgresoUseCase(progresos, reloj);
    marcar = new MarcarPasoLeidoUseCase(progresos, sincronizar, reloj);
    verProgreso = new VerMiProgresoUseCase(progresos);
  });

  describe('VerMiProgresoUseCase', () => {
    it('trae todas las guías, también las que no ha empezado, en 0 %', async () => {
      const resultado = await verProgreso.ejecutar(CARMEN, criterio);
      expect(progresos.recibido).toEqual(criterio);
      expect(resultado).toMatchObject({ total: 2, pagina: 1, limite: 20 });
      expect(resultado.datos[0]).toEqual({
        slug: 'smishing',
        categoria: 'seguridad-digital',
        titulo: 'Smishing',
        nivel: 'BASICO',
        totalPasos: 3,
        pasosLeidos: 0,
        porcentaje: 0,
        estado: 'SIN_EMPEZAR',
        completada: false,
        tieneActividad: true,
        actividadAprobada: false,
        ultimoPaso: null,
        completadaEn: null,
      });
    });

    it('muestra el avance de cada guía por separado y solo el de ese usuario', async () => {
      await leer('vishing', 1, 2);
      await leer('smishing', 1);

      const mio = await verProgreso.ejecutar(CARMEN, criterio);
      expect(mio.datos.map((g) => [g.slug, g.porcentaje, g.estado])).toEqual([
        ['smishing', 25, 'EN_CURSO'],
        ['vishing', 100, 'COMPLETADA'],
      ]);

      const deOtro = await verProgreso.ejecutar(RAFAEL, criterio);
      expect(deOtro.datos.every((g) => g.estado === 'SIN_EMPEZAR')).toBe(true);
    });
  });

  describe('MarcarPasoLeidoUseCase', () => {
    it('anota el paso como leído y como el último que abrió', async () => {
      const progreso = await marcar.ejecutar(CARMEN, 'vishing', 1);
      expect(progreso).toMatchObject({
        slug: 'vishing',
        pasosLeidos: 1,
        porcentaje: 50,
        estado: 'EN_CURSO',
        ultimoPaso: 1,
        completadaEn: null,
      });
    });

    it('leer el mismo paso dos veces no lo cuenta dos veces', async () => {
      await leer('vishing', 1, 1);
      expect((await marcar.ejecutar(CARMEN, 'vishing', 1)).pasosLeidos).toBe(1);
    });

    it('una guía sin actividad se completa al leer el último paso que faltaba', async () => {
      await leer('vishing', 2);
      const progreso = await marcar.ejecutar(CARMEN, 'vishing', 1);
      expect(progreso).toMatchObject({
        porcentaje: 100,
        estado: 'COMPLETADA',
        completada: true,
        completadaEn: AHORA,
        ultimoPaso: 1,
      });
    });

    it('una guía con actividad no se completa solo con leer todos los pasos', async () => {
      await leer('smishing', 1, 2);
      const progreso = await marcar.ejecutar(CARMEN, 'smishing', 3);
      expect(progreso).toMatchObject({
        pasosLeidos: 3,
        porcentaje: 75,
        estado: 'EN_CURSO',
        completada: false,
        completadaEn: null,
      });
    });

    it('falla si la guía o el paso no existen', async () => {
      await expect(marcar.ejecutar(CARMEN, 'no-existe', 1)).rejects.toThrow(
        PasoNoEncontradoError,
      );
      await expect(marcar.ejecutar(CARMEN, 'vishing', 9)).rejects.toThrow(
        PasoNoEncontradoError,
      );
    });
  });

  describe('SincronizarProgresoUseCase', () => {
    it('al aprobar la actividad después de leer todos los pasos, la guía queda completada', async () => {
      await leer('smishing', 1, 2, 3);
      progresos.aprobadas.add(`${CARMEN}|g-smishing`);
      reloj.avanzarSegundos(60);

      await sincronizar.deActividad(CARMEN, 'a-smishing');

      const [smishing] = (await verProgreso.ejecutar(CARMEN, criterio)).datos;
      expect(smishing).toMatchObject({
        porcentaje: 100,
        completada: true,
        actividadAprobada: true,
        completadaEn: new Date('2026-11-13T15:01:00.000Z'),
      });
    });

    it('aprobar la actividad sin haber leído todos los pasos no la completa', async () => {
      await leer('smishing', 1);
      progresos.aprobadas.add(`${CARMEN}|g-smishing`);
      await sincronizar.deActividad(CARMEN, 'a-smishing');
      expect(progresos.completadas.size).toBe(0);
    });

    it('la fecha en que se completó no cambia si se vuelve a leer la guía', async () => {
      await leer('vishing', 1, 2);
      reloj.avanzarSegundos(3600);
      const progreso = await marcar.ejecutar(CARMEN, 'vishing', 2);
      expect(progreso.completadaEn).toEqual(AHORA);
    });

    it('no hace nada si la actividad no existe', async () => {
      await sincronizar.deActividad(CARMEN, 'no-existe');
      expect(progresos.completadas.size).toBe(0);
    });
  });
});
