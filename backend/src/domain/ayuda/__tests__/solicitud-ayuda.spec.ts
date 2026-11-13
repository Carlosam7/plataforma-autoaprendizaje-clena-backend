import { describe, expect, it } from 'vitest';
import { DatoInvalidoError } from '../../shared/error-de-negocio.js';
import { SolicitudCerradaError } from '../errores.js';
import { SolicitudAyuda } from '../solicitud-ayuda.js';

const AHORA = new Date('2026-11-13T15:00:00.000Z');

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

    const enAtencion = SolicitudAyuda.reconstituir({
      id: 's2',
      equipo: '7',
      tema: 'OTRO',
      estado: 'EN_ATENCION',
      guiaId: null,
      pasoId: null,
      usuarioId: null,
      creadaEn: AHORA,
      canceladaEn: null,
    });
    enAtencion.cancelar(AHORA);
    expect(enAtencion.estado).toBe('CANCELADA');
  });

  it.each(['RESUELTA', 'CANCELADA'] as const)(
    'una solicitud %s ya no se puede cancelar',
    (estado) => {
      const cerrada = SolicitudAyuda.reconstituir({
        id: 's3',
        equipo: '7',
        tema: 'OTRO',
        estado,
        guiaId: null,
        pasoId: null,
        usuarioId: null,
        creadaEn: AHORA,
        canceladaEn: null,
      });
      expect(() => cerrada.cancelar(AHORA)).toThrow(SolicitudCerradaError);
    },
  );
});
