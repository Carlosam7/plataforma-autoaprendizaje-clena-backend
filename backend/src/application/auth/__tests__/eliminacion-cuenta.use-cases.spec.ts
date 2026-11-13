import { beforeEach, describe, expect, it } from 'vitest';
import { CodigoInicioSesion } from '../../../domain/auth/codigo-inicio-sesion.js';
import {
  ContactoCuenta,
  EliminacionCuentaRepository,
} from '../../../domain/auth/eliminacion-cuenta.repository.js';
import {
  CodigoExpiradoError,
  CodigoIncorrectoError,
  ContactoNoVerificadoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
  SolicitudEliminacionNoEncontradaError,
} from '../../../domain/auth/errores.js';
import { Correo } from '../../../domain/auth/value-objects/correo.js';
import { Telefono } from '../../../domain/auth/value-objects/telefono.js';
import { ConfirmarEliminacionCuentaUseCase } from '../confirmar-eliminacion-cuenta.use-case.js';
import { SolicitarEliminacionCuentaUseCase } from '../solicitar-eliminacion-cuenta.use-case.js';
import {
  configuracionPrueba,
  EnviadorEnMemoria,
  GeneradorCodigoFijo,
  GeneradorIdSecuencial,
  HasherFalso,
  RelojFijo,
} from './fakes.js';

class EliminacionCuentaRepositoryEnMemoria extends EliminacionCuentaRepository {
  cuentas = new Map<string, ContactoCuenta[]>();
  codigos: CodigoInicioSesion[] = [];
  eliminadas: string[] = [];
  private intentos = new Map<string, number>();

  contactos(usuarioId: string): Promise<ContactoCuenta[]> {
    return Promise.resolve(this.cuentas.get(usuarioId) ?? []);
  }
  ultimoCodigoSinUsar(metodoInicioId: string) {
    const codigo = this.codigos.findLast(
      (c) => c.metodoInicioId === metodoInicioId && c.usadoEn === null,
    );
    return Promise.resolve(codigo ?? null);
  }
  emitirCodigo(codigo: CodigoInicioSesion): Promise<void> {
    this.codigos
      .filter((c) => c.metodoInicioId === codigo.metodoInicioId)
      .forEach((c) => c.marcarUsado(codigo.creadoEn));
    this.codigos.push(codigo);
    return Promise.resolve();
  }
  reservarIntento(codigoId: string, maxIntentos: number): Promise<boolean> {
    const usados = this.intentos.get(codigoId) ?? 0;
    if (usados >= maxIntentos) return Promise.resolve(false);
    this.intentos.set(codigoId, usados + 1);
    return Promise.resolve(true);
  }
  eliminar(usuarioId: string): Promise<void> {
    this.eliminadas.push(usuarioId);
    this.cuentas.delete(usuarioId);
    return Promise.resolve();
  }
}

const CARMEN = '41234567';
const RAFAEL = '52345678';

describe('HU-05 · Eliminar mi cuenta', () => {
  let cuentas: EliminacionCuentaRepositoryEnMemoria;
  let enviador: EnviadorEnMemoria;
  let reloj: RelojFijo;
  let solicitar: SolicitarEliminacionCuentaUseCase;
  let confirmar: ConfirmarEliminacionCuentaUseCase;

  beforeEach(() => {
    cuentas = new EliminacionCuentaRepositoryEnMemoria();
    cuentas.cuentas.set(CARMEN, [
      {
        metodoInicioId: 'carmen-celular',
        canal: 'TELEFONO',
        destino: Telefono.crear('3001234567'),
      },
      {
        metodoInicioId: 'carmen-correo',
        canal: 'CORREO',
        destino: Correo.crear('carmen@correo.com'),
      },
    ]);
    cuentas.cuentas.set(RAFAEL, [
      {
        metodoInicioId: 'rafael-celular',
        canal: 'TELEFONO',
        destino: Telefono.crear('3109876543'),
      },
    ]);
    enviador = new EnviadorEnMemoria();
    reloj = new RelojFijo(new Date('2026-11-13T15:00:00.000Z'));
    const hasher = new HasherFalso();
    solicitar = new SolicitarEliminacionCuentaUseCase(
      cuentas,
      new GeneradorCodigoFijo('483920'),
      hasher,
      enviador,
      new GeneradorIdSecuencial(),
      reloj,
      configuracionPrueba,
    );
    confirmar = new ConfirmarEliminacionCuentaUseCase(
      cuentas,
      hasher,
      reloj,
      configuracionPrueba,
    );
  });

  describe('SolicitarEliminacionCuentaUseCase', () => {
    it('envía un código para eliminar la cuenta al correo, y todavía no borra nada', async () => {
      const solicitud = await solicitar.ejecutar(CARMEN);

      expect(solicitud).toMatchObject({
        solicitudId: 'carmen-correo',
        canal: 'CORREO',
        destino: 'c****@correo.com',
      });
      expect(enviador.enviados).toEqual([
        {
          canal: 'CORREO',
          destino: 'carmen@correo.com',
          codigo: '483920',
          proposito: 'ELIMINAR_CUENTA',
          vigenciaMinutos: 10,
        },
      ]);
      expect(cuentas.eliminadas).toEqual([]);
    });

    it('lo envía por el canal que el usuario elija', async () => {
      const solicitud = await solicitar.ejecutar(CARMEN, 'TELEFONO');
      expect(solicitud).toMatchObject({
        solicitudId: 'carmen-celular',
        canal: 'TELEFONO',
      });
    });

    it('sin correo lo envía al celular', async () => {
      expect((await solicitar.ejecutar(RAFAEL)).canal).toBe('TELEFONO');
    });

    it('falla si la cuenta no tiene confirmado el contacto elegido', async () => {
      await expect(solicitar.ejecutar(RAFAEL, 'CORREO')).rejects.toThrow(
        ContactoNoVerificadoError,
      );
      expect(enviador.enviados).toEqual([]);
    });

    it('no reenvía el código antes de la espera mínima', async () => {
      await solicitar.ejecutar(CARMEN);
      await expect(solicitar.ejecutar(CARMEN)).rejects.toThrow(
        ReenvioMuyProntoError,
      );
      reloj.avanzarSegundos(61);
      await solicitar.ejecutar(CARMEN);
      expect(enviador.enviados).toHaveLength(2);
    });
  });

  describe('ConfirmarEliminacionCuentaUseCase', () => {
    const conCodigo = (codigo: string, solicitudId = 'carmen-correo') => ({
      solicitudId,
      codigo,
    });

    it('con el código correcto elimina la cuenta', async () => {
      await solicitar.ejecutar(CARMEN);
      await confirmar.ejecutar(CARMEN, conCodigo(' 483920 '));
      expect(cuentas.eliminadas).toEqual([CARMEN]);
    });

    it('con un código incorrecto no elimina nada y dice cuántos intentos quedan', async () => {
      await solicitar.ejecutar(CARMEN);
      await expect(
        confirmar.ejecutar(CARMEN, conCodigo('000000')),
      ).rejects.toMatchObject({
        constructor: CodigoIncorrectoError,
        detalles: { intentosRestantes: 2 },
      });
      expect(cuentas.eliminadas).toEqual([]);
    });

    it('agotados los intentos, ni el código correcto sirve', async () => {
      await solicitar.ejecutar(CARMEN);
      for (let i = 0; i < configuracionPrueba.politicaCodigo.maxIntentos; i++) {
        await expect(
          confirmar.ejecutar(CARMEN, conCodigo('000000')),
        ).rejects.toThrow(CodigoIncorrectoError);
      }
      await expect(
        confirmar.ejecutar(CARMEN, conCodigo('483920')),
      ).rejects.toThrow(IntentosAgotadosError);
      expect(cuentas.eliminadas).toEqual([]);
    });

    it('un código vencido no sirve', async () => {
      await solicitar.ejecutar(CARMEN);
      reloj.avanzarSegundos(10 * 60 + 1);
      await expect(
        confirmar.ejecutar(CARMEN, conCodigo('483920')),
      ).rejects.toThrow(CodigoExpiradoError);
      expect(cuentas.eliminadas).toEqual([]);
    });

    it('nadie elimina la cuenta de otra persona con el código de ella', async () => {
      await solicitar.ejecutar(CARMEN);
      // Rafael, con su propia sesión, intenta usar la solicitud de Carmen.
      await expect(
        confirmar.ejecutar(RAFAEL, conCodigo('483920')),
      ).rejects.toThrow(SolicitudEliminacionNoEncontradaError);
      expect(cuentas.eliminadas).toEqual([]);
    });

    it('falla si no se ha pedido un código', async () => {
      await expect(
        confirmar.ejecutar(CARMEN, conCodigo('483920')),
      ).rejects.toThrow(SolicitudEliminacionNoEncontradaError);
    });

    it('sirve el código enviado a cualquiera de sus contactos', async () => {
      await solicitar.ejecutar(CARMEN);
      reloj.avanzarSegundos(61);
      await solicitar.ejecutar(CARMEN, 'TELEFONO');
      await confirmar.ejecutar(CARMEN, conCodigo('483920', 'carmen-celular'));
      expect(cuentas.eliminadas).toEqual([CARMEN]);
    });
  });
});
