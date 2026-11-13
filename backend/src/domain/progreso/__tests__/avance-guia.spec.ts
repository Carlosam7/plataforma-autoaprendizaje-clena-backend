import { describe, expect, it } from 'vitest';
import { AvanceGuia, AvanceGuiaProps } from '../avance-guia.js';

function avance(cambios: Partial<AvanceGuiaProps>): AvanceGuia {
  return new AvanceGuia({
    guiaId: 'g1',
    slug: 'smishing',
    categoriaSlug: 'seguridad-digital',
    titulo: 'Smishing',
    nivel: 'BASICO',
    totalPasos: 5,
    pasosLeidos: 0,
    tieneActividad: false,
    actividadAprobada: false,
    ultimoPaso: null,
    completadaEn: null,
    ...cambios,
  });
}

describe('AvanceGuia', () => {
  it('sin pasos leídos está sin empezar, en 0 %', () => {
    expect(avance({})).toMatchObject({
      estado: 'SIN_EMPEZAR',
      porcentaje: 0,
      completada: false,
    });
  });

  it('con algunos pasos leídos está en curso, con el porcentaje hacia abajo', () => {
    expect(avance({ totalPasos: 3, pasosLeidos: 1 })).toMatchObject({
      estado: 'EN_CURSO',
      porcentaje: 33,
      completada: false,
    });
    expect(avance({ totalPasos: 3, pasosLeidos: 2 }).porcentaje).toBe(66);
  });

  it('sin actividad, se completa al leer todos los pasos', () => {
    expect(avance({ pasosLeidos: 5 })).toMatchObject({
      estado: 'COMPLETADA',
      porcentaje: 100,
      completada: true,
    });
  });

  it('con actividad, leer todos los pasos no basta: falta aprobarla', () => {
    expect(avance({ pasosLeidos: 5, tieneActividad: true })).toMatchObject({
      estado: 'EN_CURSO',
      porcentaje: 83,
      completada: false,
    });
  });

  it('con actividad, se completa al leer todos los pasos y aprobarla', () => {
    expect(
      avance({ pasosLeidos: 5, tieneActividad: true, actividadAprobada: true }),
    ).toMatchObject({
      estado: 'COMPLETADA',
      porcentaje: 100,
      completada: true,
    });
  });

  it('aprobar la actividad sin leer todos los pasos no la completa', () => {
    expect(
      avance({ pasosLeidos: 2, tieneActividad: true, actividadAprobada: true }),
    ).toMatchObject({ estado: 'EN_CURSO', porcentaje: 50, completada: false });
  });

  it('una guía sin pasos nunca está completada', () => {
    expect(avance({ totalPasos: 0 })).toMatchObject({
      estado: 'SIN_EMPEZAR',
      porcentaje: 0,
      completada: false,
    });
  });

  it('si la guía ya no tiene tantos pasos como los que leyó, no pasa de 100 %', () => {
    expect(avance({ totalPasos: 3, pasosLeidos: 5 })).toMatchObject({
      pasosLeidos: 3,
      porcentaje: 100,
      completada: true,
    });
  });

  it('un intento aprobado de una actividad que ya no existe no cuenta', () => {
    expect(
      avance({
        pasosLeidos: 5,
        tieneActividad: false,
        actividadAprobada: true,
      }),
    ).toMatchObject({ actividadAprobada: false, porcentaje: 100 });
  });
});
