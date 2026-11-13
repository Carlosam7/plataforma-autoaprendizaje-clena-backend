import { beforeEach, describe, expect, it } from 'vitest';
import { Actividad } from '../../../domain/practica/actividad.js';
import { ActividadRepository } from '../../../domain/practica/actividad.repository.js';
import {
  ActividadNoEncontradaError,
  IntentoNoEncontradoError,
  PreguntaYaRespondidaError,
} from '../../../domain/practica/errores.js';
import { Intento } from '../../../domain/practica/intento.js';
import { IntentoRepository } from '../../../domain/practica/intento.repository.js';
import {
  GeneradorIdSecuencial,
  RelojFijo,
} from '../../auth/__tests__/fakes.js';
import { IniciarIntentoUseCase } from '../iniciar-intento.use-case.js';
import { ObtenerActividadUseCase } from '../obtener-actividad.use-case.js';
import { ResponderPreguntaUseCase } from '../responder-pregunta.use-case.js';

/** Solo guarda actividades de guías publicadas y con preguntas. */
class ActividadRepositoryEnMemoria extends ActividadRepository {
  porGuia = new Map<string, Actividad>();
  buscarDeGuiaPublicada(slug: string): Promise<Actividad | null> {
    return Promise.resolve(this.porGuia.get(slug) ?? null);
  }
}

class IntentoRepositoryEnMemoria extends IntentoRepository {
  intentos = new Map<string, Intento>();
  crear(intento: Intento): Promise<void> {
    this.intentos.set(intento.id, intento);
    return Promise.resolve();
  }
  modificar<T>(id: string, cambio: (i: Intento) => T): Promise<T | null> {
    const intento = this.intentos.get(id);
    return Promise.resolve(intento ? cambio(intento) : null);
  }
}

const ACTIVIDAD: Actividad = {
  id: 'a1',
  titulo: 'Practica: smishing',
  porcentajeAprobacion: 70,
  preguntas: [
    {
      id: 'p1',
      enunciado: '¿Abres el enlace?',
      explicacion: 'Los bancos no envían enlaces por SMS.',
      opciones: [
        { id: 'p1-a', texto: 'Sí', esCorrecta: false },
        { id: 'p1-b', texto: 'No', esCorrecta: true },
      ],
    },
    {
      id: 'p2',
      enunciado: '¿Llamas al número del mensaje?',
      explicacion: 'Llama al número de tu tarjeta.',
      opciones: [
        { id: 'p2-a', texto: 'No', esCorrecta: true },
        { id: 'p2-b', texto: 'Sí', esCorrecta: false },
      ],
    },
  ],
};

const USUARIO = { id: '41234567', rol: 'USUARIO_PUBLICO' as const };

describe('HU-21 · Resolver una pregunta con retroalimentación inmediata', () => {
  let actividades: ActividadRepositoryEnMemoria;
  let intentos: IntentoRepositoryEnMemoria;
  let iniciar: IniciarIntentoUseCase;
  let responder: ResponderPreguntaUseCase;

  beforeEach(() => {
    actividades = new ActividadRepositoryEnMemoria();
    actividades.porGuia.set('smishing', ACTIVIDAD);
    intentos = new IntentoRepositoryEnMemoria();
    const reloj = new RelojFijo(new Date('2026-11-12T15:00:00.000Z'));
    iniciar = new IniciarIntentoUseCase(
      actividades,
      intentos,
      new GeneradorIdSecuencial(),
      reloj,
    );
    responder = new ResponderPreguntaUseCase(intentos, reloj);
  });

  describe('ObtenerActividadUseCase', () => {
    it('devuelve las preguntas en orden sin decir cuál opción es la correcta', async () => {
      const actividad = await new ObtenerActividadUseCase(actividades).ejecutar(
        'smishing',
      );
      expect(actividad).toMatchObject({
        titulo: 'Practica: smishing',
        porcentajeAprobacion: 70,
        totalPreguntas: 2,
      });
      expect(actividad.preguntas[0]).toEqual({
        id: 'p1',
        enunciado: '¿Abres el enlace?',
        opciones: [
          { id: 'p1-a', texto: 'Sí' },
          { id: 'p1-b', texto: 'No' },
        ],
      });
      expect(JSON.stringify(actividad)).not.toMatch(/esCorrecta|explicacion/);
    });

    it('falla si la guía no tiene actividad', async () => {
      await expect(
        new ObtenerActividadUseCase(actividades).ejecutar('vishing'),
      ).rejects.toThrow(ActividadNoEncontradaError);
    });
  });

  describe('IniciarIntentoUseCase', () => {
    it('sin sesión el intento es anónimo', async () => {
      const { id, totalPreguntas } = await iniciar.ejecutar('smishing', null);
      expect(totalPreguntas).toBe(2);
      expect(intentos.intentos.get(id)?.usuarioId).toBeNull();
    });

    it('con sesión de usuario público el intento es suyo', async () => {
      const { id } = await iniciar.ejecutar('smishing', USUARIO);
      expect(intentos.intentos.get(id)?.usuarioId).toBe('41234567');
    });

    it('con sesión del personal el intento es anónimo', async () => {
      const { id } = await iniciar.ejecutar('smishing', {
        id: 'uuid-personal',
        rol: 'PERSONAL',
      });
      expect(intentos.intentos.get(id)?.usuarioId).toBeNull();
    });

    it('falla si la guía no tiene actividad', async () => {
      await expect(iniciar.ejecutar('vishing', null)).rejects.toThrow(
        ActividadNoEncontradaError,
      );
    });
  });

  describe('ResponderPreguntaUseCase', () => {
    it('cada respuesta trae si acertó, la correcta y la explicación; la última, el resultado', async () => {
      const { id } = await iniciar.ejecutar('smishing', null);

      const primera = await responder.ejecutar(
        { intentoId: id, preguntaId: 'p1', opcionId: 'p1-a' },
        null,
      );
      expect(primera).toEqual({
        esCorrecta: false,
        opcionCorrecta: { id: 'p1-b', texto: 'No' },
        explicacion: 'Los bancos no envían enlaces por SMS.',
        respondidas: 1,
        totalPreguntas: 2,
        resultado: null,
      });

      const ultima = await responder.ejecutar(
        { intentoId: id, preguntaId: 'p2', opcionId: 'p2-a' },
        null,
      );
      expect(ultima).toMatchObject({
        esCorrecta: true,
        respondidas: 2,
        resultado: {
          respuestasCorrectas: 1,
          totalPreguntas: 2,
          porcentaje: 50,
          aprobado: false,
          porcentajeAprobacion: 70,
        },
      });
    });

    it('repetir la actividad es empezar otro intento', async () => {
      const primero = await iniciar.ejecutar('smishing', null);
      const segundo = await iniciar.ejecutar('smishing', null);
      expect(segundo.id).not.toBe(primero.id);
    });

    it('no deja responder dos veces la misma pregunta', async () => {
      const { id } = await iniciar.ejecutar('smishing', null);
      const comando = { intentoId: id, preguntaId: 'p1', opcionId: 'p1-b' };
      await responder.ejecutar(comando, null);
      await expect(responder.ejecutar(comando, null)).rejects.toThrow(
        PreguntaYaRespondidaError,
      );
    });

    it('el intento de una cuenta no lo responde otra persona', async () => {
      const { id } = await iniciar.ejecutar('smishing', USUARIO);
      const comando = { intentoId: id, preguntaId: 'p1', opcionId: 'p1-b' };
      await expect(responder.ejecutar(comando, null)).rejects.toThrow(
        IntentoNoEncontradoError,
      );
      await expect(
        responder.ejecutar(comando, { id: '99999999', rol: 'USUARIO_PUBLICO' }),
      ).rejects.toThrow(IntentoNoEncontradoError);
      await expect(responder.ejecutar(comando, USUARIO)).resolves.toMatchObject(
        { esCorrecta: true },
      );
    });

    it('falla si el intento no existe', async () => {
      await expect(
        responder.ejecutar(
          { intentoId: 'no-existe', preguntaId: 'p1', opcionId: 'p1-b' },
          null,
        ),
      ).rejects.toThrow(IntentoNoEncontradoError);
    });
  });
});
