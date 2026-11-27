import { beforeEach, describe, expect, it } from 'vitest';
import { Actividad } from '../../../domain/practica/actividad.js';
import { ActividadRepository } from '../../../domain/practica/actividad.repository.js';
import {
  ActividadNoEncontradaError,
  IntentoNoEncontradoError,
  PreguntaYaRespondidaError,
  RespuestaInvalidaError,
} from '../../../domain/practica/errores.js';
import { Intento } from '../../../domain/practica/intento.js';
import { IntentoRepository } from '../../../domain/practica/intento.repository.js';
import {
  GeneradorIdSecuencial,
  RelojFijo,
} from '../../auth/__tests__/fakes.js';
import { SincronizarProgresoUseCase } from '../../progreso/sincronizar-progreso.use-case.js';
import { EvaluarRespuestaUseCase } from '../evaluar-respuesta.use-case.js';
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

const USUARIO_ID = '41234567';

describe('HU-21 · Resolver una pregunta con retroalimentación inmediata', () => {
  let actividades: ActividadRepositoryEnMemoria;
  let intentos: IntentoRepositoryEnMemoria;
  let evaluar: EvaluarRespuestaUseCase;
  let iniciar: IniciarIntentoUseCase;
  let responder: ResponderPreguntaUseCase;
  /** [usuario, actividad] de cada aprobación que se avisó al progreso (HU-23). */
  let aprobadas: [string, string][];

  beforeEach(() => {
    actividades = new ActividadRepositoryEnMemoria();
    actividades.porGuia.set('smishing', ACTIVIDAD);
    intentos = new IntentoRepositoryEnMemoria();
    const reloj = new RelojFijo(new Date('2026-11-12T15:00:00.000Z'));
    evaluar = new EvaluarRespuestaUseCase(actividades);
    iniciar = new IniciarIntentoUseCase(
      actividades,
      intentos,
      new GeneradorIdSecuencial(),
      reloj,
    );
    aprobadas = [];
    responder = new ResponderPreguntaUseCase(intentos, reloj, {
      deActividad: (usuarioId: string, actividadId: string) => {
        aprobadas.push([usuarioId, actividadId]);
        return Promise.resolve();
      },
    } as SincronizarProgresoUseCase);
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

  describe('EvaluarRespuestaUseCase (C-04 invitado)', () => {
    it('evalúa acierto y fallo sin crear intentos persistidos', async () => {
      const acierto = await evaluar.ejecutar({
        slugGuia: 'smishing',
        preguntaId: 'p1',
        opcionId: 'p1-b',
      });
      expect(acierto).toEqual({
        esCorrecta: true,
        opcionCorrecta: { id: 'p1-b', texto: 'No' },
        explicacion: 'Los bancos no envían enlaces por SMS.',
      });

      const fallo = await evaluar.ejecutar({
        slugGuia: 'smishing',
        preguntaId: 'p2',
        opcionId: 'p2-b',
      });
      expect(fallo).toEqual({
        esCorrecta: false,
        opcionCorrecta: { id: 'p2-a', texto: 'No' },
        explicacion: 'Llama al número de tu tarjeta.',
      });
      expect(intentos.intentos.size).toBe(0);
    });

    it('falla si la guía no tiene actividad', async () => {
      await expect(
        evaluar.ejecutar({
          slugGuia: 'vishing',
          preguntaId: 'p1',
          opcionId: 'p1-b',
        }),
      ).rejects.toThrow(ActividadNoEncontradaError);
    });

    it('falla si la opción no corresponde a la pregunta o guía', async () => {
      await expect(
        evaluar.ejecutar({
          slugGuia: 'smishing',
          preguntaId: 'p1',
          opcionId: 'p2-a',
        }),
      ).rejects.toThrow(RespuestaInvalidaError);
    });
  });

  describe('IniciarIntentoUseCase', () => {
    it('crea el intento para el usuario público', async () => {
      const { id, totalPreguntas } = await iniciar.ejecutar(
        'smishing',
        USUARIO_ID,
      );
      expect(totalPreguntas).toBe(2);
      expect(intentos.intentos.get(id)?.usuarioId).toBe(USUARIO_ID);
    });

    it('falla si la guía no tiene actividad', async () => {
      await expect(iniciar.ejecutar('vishing', USUARIO_ID)).rejects.toThrow(
        ActividadNoEncontradaError,
      );
    });
  });

  describe('ResponderPreguntaUseCase', () => {
    it('cada respuesta trae si acertó, la correcta y la explicación; la última, el resultado', async () => {
      const { id } = await iniciar.ejecutar('smishing', USUARIO_ID);

      const primera = await responder.ejecutar(
        { intentoId: id, preguntaId: 'p1', opcionId: 'p1-a' },
        USUARIO_ID,
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
        USUARIO_ID,
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
      const primero = await iniciar.ejecutar('smishing', USUARIO_ID);
      const segundo = await iniciar.ejecutar('smishing', USUARIO_ID);
      expect(segundo.id).not.toBe(primero.id);
    });

    it('no deja responder dos veces la misma pregunta', async () => {
      const { id } = await iniciar.ejecutar('smishing', USUARIO_ID);
      const comando = { intentoId: id, preguntaId: 'p1', opcionId: 'p1-b' };
      await responder.ejecutar(comando, USUARIO_ID);
      await expect(responder.ejecutar(comando, USUARIO_ID)).rejects.toThrow(
        PreguntaYaRespondidaError,
      );
    });

    it('el intento de una cuenta no lo responde otra persona', async () => {
      const { id } = await iniciar.ejecutar('smishing', USUARIO_ID);
      const comando = { intentoId: id, preguntaId: 'p1', opcionId: 'p1-b' };
      await expect(responder.ejecutar(comando, '99999999')).rejects.toThrow(
        IntentoNoEncontradoError,
      );
      await expect(
        responder.ejecutar(comando, USUARIO_ID),
      ).resolves.toMatchObject({ esCorrecta: true });
    });

    it('HU-23: avisa al progreso solo cuando alguien con cuenta aprueba la actividad', async () => {
      const responderTodo = async (aciertos: [boolean, boolean]) => {
        const { id } = await iniciar.ejecutar('smishing', USUARIO_ID);
        await responder.ejecutar(
          {
            intentoId: id,
            preguntaId: 'p1',
            opcionId: aciertos[0] ? 'p1-b' : 'p1-a',
          },
          USUARIO_ID,
        );
        await responder.ejecutar(
          {
            intentoId: id,
            preguntaId: 'p2',
            opcionId: aciertos[1] ? 'p2-a' : 'p2-b',
          },
          USUARIO_ID,
        );
      };

      await responderTodo([true, false]); // 50 %: no aprueba
      expect(aprobadas).toEqual([]);

      await responderTodo([true, true]);
      expect(aprobadas).toEqual([['41234567', 'a1']]);
    });

    it('falla si el intento no existe', async () => {
      await expect(
        responder.ejecutar(
          { intentoId: 'no-existe', preguntaId: 'p1', opcionId: 'p1-b' },
          USUARIO_ID,
        ),
      ).rejects.toThrow(IntentoNoEncontradoError);
    });
  });
});
