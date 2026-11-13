import { describe, expect, it } from 'vitest';
import { DatoInvalidoError } from '../../shared/error-de-negocio.js';
import {
  SolicitudCerradaError,
  SolicitudDeOtroMonitorError,
  SolicitudSinTomarError,
  SolicitudYaTomadaError,
} from '../errores.js';
import { EstadoSolicitud, SolicitudAyuda } from '../solicitud-ayuda.js';

const AHORA = new Date('2026-11-13T15:00:00.000Z');
const DESPUES = new Date('2026-11-13T15:05:00.000Z');

function crear(cambios: { equipo?: string; guiaId?: string | null } = {}) {
  return SolicitudAyuda.crear({
    id: 's1',
    equipo: '12',
    tema: 'CORREO',
    guiaId: 'g1',
    pasoId: 'p3',
    usuarioId: null,
    ahora: AHORA,
    ...cambios,
  });
}

/** Solicitud ya guardada en ese estado; si la atienden o la atendieron, fue Ana. */
function enEstado(estado: EstadoSolicitud): SolicitudAyuda {
  const atendida = estado === 'EN_ATENCION' || estado === 'RESUELTA';
  return SolicitudAyuda.reconstituir({
    id: 's2',
    equipo: '7',
    tema: 'OTRO',
    estado,
    guiaId: null,
    pasoId: null,
    usuarioId: null,
    creadaEn: AHORA,
    atendidaPorId: atendida ? 'ana' : null,
    tomadaEn: atendida ? AHORA : null,
    resueltaEn: estado === 'RESUELTA' ? AHORA : null,
    comentarioResolucion: null,
    canceladaEn: estado === 'CANCELADA' ? AHORA : null,
  });
}

describe('SolicitudAyuda', () => {
  it('nace pendiente, con la guía y el paso donde estaba la persona', () => {
    const solicitud = crear();
    expect(solicitud).toMatchObject({
      estado: 'PENDIENTE',
      estaActiva: true,
      equipo: '12',
      tema: 'CORREO',
      guiaId: 'g1',
      pasoId: 'p3',
      creadaEn: AHORA,
      canceladaEn: null,
    });
  });

  it('quita los espacios de más del equipo', () => {
    expect(crear({ equipo: '  Equipo    12 ' }).equipo).toBe('Equipo 12');
  });

  it.each([
    ['vacío', '   '],
    ['de más de 100 letras', 'x'.repeat(101)],
  ])('rechaza un equipo %s', (_, equipo) => {
    expect(() => crear({ equipo })).toThrow(DatoInvalidoError);
  });

  it('sin guía no guarda el paso', () => {
    expect(crear({ guiaId: null }).pasoId).toBeNull();
  });

  it('se puede cancelar mientras está activa, aunque ya la estén atendiendo', () => {
    const pendiente = crear();
    pendiente.cancelar(AHORA);
    expect(pendiente).toMatchObject({
      estado: 'CANCELADA',
      estaActiva: false,
      canceladaEn: AHORA,
    });

    const enAtencion = enEstado('EN_ATENCION');
    enAtencion.cancelar(AHORA);
    expect(enAtencion.estado).toBe('CANCELADA');
  });

  it.each(['RESUELTA', 'CANCELADA'] as const)(
    'una solicitud %s ya no se puede cancelar',
    (estado) => {
      expect(() => enEstado(estado).cancelar(AHORA)).toThrow(
        SolicitudCerradaError,
      );
    },
  );

  describe('tomar (HU-30)', () => {
    it('una pendiente pasa a «En atención» a nombre del monitor', () => {
      const solicitud = crear();
      solicitud.tomar('ana', DESPUES);
      expect(solicitud).toMatchObject({
        estado: 'EN_ATENCION',
        estaActiva: true,
        atendidaPorId: 'ana',
        tomadaEn: DESPUES,
      });
    });

    it('otro monitor no puede tomar la que ya está en atención', () => {
      const solicitud = enEstado('EN_ATENCION');
      expect(() => solicitud.tomar('luis', DESPUES)).toThrow(
        SolicitudYaTomadaError,
      );
      expect(solicitud.atendidaPorId).toBe('ana');
    });

    it('si el mismo monitor la toma dos veces no pasa nada', () => {
      const solicitud = enEstado('EN_ATENCION');
      solicitud.tomar('ana', DESPUES);
      expect(solicitud).toMatchObject({
        estado: 'EN_ATENCION',
        atendidaPorId: 'ana',
        tomadaEn: AHORA,
      });
    });

    it.each(['RESUELTA', 'CANCELADA'] as const)(
      'una solicitud %s ya no se puede tomar',
      (estado) => {
        expect(() => enEstado(estado).tomar('luis', DESPUES)).toThrow(
          SolicitudCerradaError,
        );
      },
    );
  });

  describe('resolver (HU-30)', () => {
    it('quien la tomó la marca como resuelta, con un comentario opcional', () => {
      const solicitud = enEstado('EN_ATENCION');
      solicitud.resolver('ana', '  No encontraba el botón.  ', DESPUES);
      expect(solicitud).toMatchObject({
        estado: 'RESUELTA',
        estaActiva: false,
        atendidaPorId: 'ana',
        resueltaEn: DESPUES,
        comentarioResolucion: 'No encontraba el botón.',
      });
    });

    it.each([null, '', '   '])(
      'sin comentario (%j) guarda null',
      (comentario) => {
        const solicitud = enEstado('EN_ATENCION');
        solicitud.resolver('ana', comentario, DESPUES);
        expect(solicitud.comentarioResolucion).toBeNull();
      },
    );

    it('rechaza un comentario de más de 500 letras', () => {
      const solicitud = enEstado('EN_ATENCION');
      expect(() => solicitud.resolver('ana', 'x'.repeat(501), DESPUES)).toThrow(
        DatoInvalidoError,
      );
      expect(solicitud.estado).toBe('EN_ATENCION');
    });

    it('no se resuelve una pendiente: primero hay que tomarla', () => {
      expect(() => crear().resolver('ana', null, DESPUES)).toThrow(
        SolicitudSinTomarError,
      );
    });

    it('no la resuelve un monitor distinto del que la tomó', () => {
      const solicitud = enEstado('EN_ATENCION');
      expect(() => solicitud.resolver('luis', null, DESPUES)).toThrow(
        SolicitudDeOtroMonitorError,
      );
      expect(solicitud.estado).toBe('EN_ATENCION');
    });

    it.each(['RESUELTA', 'CANCELADA'] as const)(
      'una solicitud %s ya no se puede resolver',
      (estado) => {
        expect(() => enEstado(estado).resolver('ana', null, DESPUES)).toThrow(
          SolicitudCerradaError,
        );
      },
    );
  });
});
