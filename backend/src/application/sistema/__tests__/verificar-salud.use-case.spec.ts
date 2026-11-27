import { describe, expect, it } from 'vitest';
import { RelojFijo } from '../../auth/__tests__/fakes.js';
import { EstadoBaseDatos } from '../estado-base-datos.port.js';
import { VerificarSaludUseCase } from '../verificar-salud.use-case.js';

class BaseDatosFalsa extends EstadoBaseDatos {
  constructor(private readonly responde: boolean) {
    super();
  }
  disponible(): Promise<boolean> {
    return Promise.resolve(this.responde);
  }
}

const reloj = new RelojFijo(new Date('2026-11-27T15:00:00.000Z'));

describe('BE-09 · VerificarSaludUseCase', () => {
  it('con la base de datos disponible está sana', async () => {
    expect(
      await new VerificarSaludUseCase(
        new BaseDatosFalsa(true),
        reloj,
      ).ejecutar(),
    ).toEqual({
      status: 'ok',
      service: 'clena-backend',
      baseDatos: 'ok',
      timestamp: '2026-11-27T15:00:00.000Z',
    });
  });

  it('sin base de datos no está sana', async () => {
    expect(
      await new VerificarSaludUseCase(
        new BaseDatosFalsa(false),
        reloj,
      ).ejecutar(),
    ).toMatchObject({ status: 'error', baseDatos: 'no_disponible' });
  });
});
