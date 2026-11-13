import { describe, expect, it } from 'vitest';
import { Actividad, PreguntaActividad } from '../actividad.js';
import {
  IntentoFinalizadoError,
  PreguntaYaRespondidaError,
  RespuestaInvalidaError,
} from '../errores.js';
import { Intento } from '../intento.js';

const AHORA = new Date('2026-11-12T15:00:00.000Z');

/** Pregunta `n` con dos opciones: `n-si` (correcta) y `n-no`. */
function pregunta(n: number): PreguntaActividad {
  return {
    id: `p${n}`,
    enunciado: `Pregunta ${n}`,
    explicacion: `Explicación ${n}`,
    opciones: [
      { id: `p${n}-si`, texto: 'Sí', esCorrecta: true },
      { id: `p${n}-no`, texto: 'No', esCorrecta: false },
    ],
  };
}

function iniciar(totalPreguntas = 4, porcentajeAprobacion = 70): Intento {
  const actividad: Actividad = {
    id: 'a1',
    titulo: 'Practica',
    porcentajeAprobacion,
    preguntas: Array.from({ length: totalPreguntas }, (_, i) =>
      pregunta(i + 1),
    ),
  };
  return Intento.iniciar({
    id: 'i1',
    actividad,
    usuarioId: null,
    ahora: AHORA,
  });
}

/** Responde en orden; `aciertos[i]` dice si la pregunta i+1 se acierta. */
function responder(intento: Intento, ...aciertos: boolean[]): void {
  aciertos.forEach((acierta, i) =>
    intento.responder(`p${i + 1}`, `p${i + 1}-${acierta ? 'si' : 'no'}`, AHORA),
  );
}

describe('Intento', () => {
  it('al acertar confirma y da la explicación', () => {
    const intento = iniciar();
    expect(intento.responder('p1', 'p1-si', AHORA)).toEqual({
      esCorrecta: true,
      opcionCorrecta: { id: 'p1-si', texto: 'Sí' },
      explicacion: 'Explicación 1',
    });
  });

  it('al fallar dice cuál era la respuesta correcta y por qué', () => {
    const intento = iniciar();
    expect(intento.responder('p1', 'p1-no', AHORA)).toEqual({
      esCorrecta: false,
      opcionCorrecta: { id: 'p1-si', texto: 'Sí' },
      explicacion: 'Explicación 1',
    });
  });

  it('termina al responder la última pregunta, ni antes ni después', () => {
    const intento = iniciar(2);
    responder(intento, true);
    expect(intento.finalizadoEn).toBeNull();
    intento.responder('p2', 'p2-no', AHORA);
    expect(intento.finalizadoEn).toEqual(AHORA);
  });

  it('una pregunta no se responde dos veces', () => {
    const intento = iniciar();
    responder(intento, false);
    expect(() => intento.responder('p1', 'p1-si', AHORA)).toThrow(
      PreguntaYaRespondidaError,
    );
  });

  it('un intento terminado no admite más respuestas', () => {
    const intento = iniciar(1);
    responder(intento, true);
    expect(() => intento.responder('p1', 'p1-si', AHORA)).toThrow(
      IntentoFinalizadoError,
    );
  });

  it.each([
    ['una pregunta de otra actividad', 'p9', 'p9-si'],
    ['una opción de otra pregunta', 'p1', 'p2-si'],
  ])('rechaza %s', (_, preguntaId, opcionId) => {
    expect(() => iniciar().responder(preguntaId, opcionId, AHORA)).toThrow(
      RespuestaInvalidaError,
    );
  });

  describe('calificar()', () => {
    it('3 de 4 (75 %) aprueba con el 70 % por defecto', () => {
      const intento = iniciar();
      responder(intento, true, true, false, true);
      expect(intento.calificar()).toEqual({
        respuestasCorrectas: 3,
        totalPreguntas: 4,
        porcentaje: 75,
        aprobado: true,
        porcentajeAprobacion: 70,
      });
    });

    it('2 de 4 (50 %) no aprueba', () => {
      const intento = iniciar();
      responder(intento, true, false, false, true);
      expect(intento.calificar()).toMatchObject({
        porcentaje: 50,
        aprobado: false,
      });
    });

    it('justo en el porcentaje de aprobación aprueba', () => {
      const intento = iniciar(4, 75);
      responder(intento, true, true, true, false);
      expect(intento.calificar().aprobado).toBe(true);
    });

    it('no redondea a favor: 139 de 200 (69,5 %) no aprueba el 70 %', () => {
      const intento = iniciar(200);
      responder(intento, ...Array.from({ length: 200 }, (_, i) => i < 139));
      expect(intento.calificar()).toMatchObject({
        porcentaje: 70,
        aprobado: false,
      });
    });

    it('usa el porcentaje configurado en la actividad', () => {
      const intento = iniciar(4, 100);
      responder(intento, true, true, true, false);
      expect(intento.calificar().aprobado).toBe(false);
    });
  });

  it('un intento sin cuenta lo sigue cualquiera; uno con cuenta, solo su dueño', () => {
    const anonimo = iniciar();
    expect(anonimo.perteneceA(null)).toBe(true);
    expect(anonimo.perteneceA('41234567')).toBe(true);

    const conCuenta = Intento.reconstituir({
      id: 'i2',
      actividad: {
        id: 'a1',
        titulo: 'P',
        porcentajeAprobacion: 70,
        preguntas: [],
      },
      usuarioId: '41234567',
      respuestas: [],
      iniciadoEn: AHORA,
      finalizadoEn: null,
    });
    expect(conCuenta.perteneceA('41234567')).toBe(true);
    expect(conCuenta.perteneceA('99999999')).toBe(false);
    expect(conCuenta.perteneceA(null)).toBe(false);
  });
});
