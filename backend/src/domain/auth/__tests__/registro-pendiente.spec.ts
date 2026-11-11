import { RegistroPendiente, PoliticaCodigo } from '../registro-pendiente.js';
import {
  CanalSinContactoError,
  CodigoExpiradoError,
  ContactoRequeridoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from '../errores.js';
import { CanalVerificacion } from '../tipos.js';
import { Consentimiento } from '../value-objects/consentimiento.js';
import { Correo } from '../value-objects/correo.js';
import { FechaNacimiento } from '../value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../value-objects/numero-identificacion.js';
import { Telefono } from '../value-objects/telefono.js';

const AHORA = new Date('2026-11-05T15:00:00Z');
const POLITICA: PoliticaCodigo = {
  vigenciaMinutos: 10,
  maxIntentos: 3,
  esperaReenvioSegundos: 60,
};

function crear(
  contacto: { telefono?: string; correo?: string } = {
    telefono: '3001234567',
    correo: 'carmen@correo.com',
  },
  canalPreferido?: CanalVerificacion,
): RegistroPendiente {
  return RegistroPendiente.solicitar({
    id: 'reg-1',
    nombre: NombrePersona.crear('Carmen Rodríguez'),
    numeroIdentificacion: NumeroIdentificacion.crear('41234567'),
    fechaNacimiento: FechaNacimiento.desdeTexto('1955-08-21', AHORA),
    telefono: contacto.telefono ? Telefono.crear(contacto.telefono) : null,
    correo: contacto.correo ? Correo.crear(contacto.correo) : null,
    consentimiento: Consentimiento.otorgar(true, 'v1', AHORA),
    canalPreferido,
    codigoHash: 'hash-1',
    ahora: AHORA,
    politica: POLITICA,
  });
}

const segundosDespues = (s: number) => new Date(AHORA.getTime() + s * 1000);

describe('RegistroPendiente', () => {
  describe('canal de verificación', () => {
    it('prefiere el correo cuando hay correo y teléfono', () => {
      expect(crear().canal).toBe('CORREO');
    });

    it('usa el teléfono cuando no hay correo', () => {
      const registro = crear({ telefono: '3001234567' });
      expect(registro.canal).toBe('TELEFONO');
      expect(registro.destino.valor).toBe('+573001234567');
    });

    it('respeta el canal elegido por el usuario', () => {
      expect(crear(undefined, 'TELEFONO').canal).toBe('TELEFONO');
    });

    it('exige al menos un teléfono o un correo', () => {
      expect(() => crear({})).toThrow(ContactoRequeridoError);
    });

    it.each([
      [{ telefono: '3001234567' }, 'CORREO'],
      [{ correo: 'a@b.co' }, 'TELEFONO'],
    ] as const)(
      'rechaza un canal sin su dato de contacto',
      (contacto, canal) => {
        expect(() => crear(contacto, canal)).toThrow(CanalSinContactoError);
      },
    );
  });

  it('el código vence según la política', () => {
    expect(crear().codigoExpiraEn).toEqual(segundosDespues(600));
  });

  describe('uso del código', () => {
    it('se puede usar antes de vencer', () => {
      expect(() =>
        crear().asegurarCodigoUtilizable(segundosDespues(599), POLITICA),
      ).not.toThrow();
    });

    it('no se puede usar al vencer', () => {
      expect(() =>
        crear().asegurarCodigoUtilizable(segundosDespues(600), POLITICA),
      ).toThrow(CodigoExpiradoError);
    });

    it('cuenta los intentos fallidos y se bloquea al agotarlos', () => {
      const registro = crear();
      expect(registro.registrarIntentoFallido(POLITICA)).toBe(2);
      expect(registro.registrarIntentoFallido(POLITICA)).toBe(1);
      expect(registro.registrarIntentoFallido(POLITICA)).toBe(0);
      expect(() => registro.asegurarCodigoUtilizable(AHORA, POLITICA)).toThrow(
        IntentosAgotadosError,
      );
    });
  });

  describe('reenvío', () => {
    it('exige esperar entre envíos', () => {
      expect(() =>
        crear().renovarCodigo('hash-2', segundosDespues(30), POLITICA),
      ).toThrow(ReenvioMuyProntoError);
    });

    it('informa cuántos segundos faltan', () => {
      expect(() =>
        crear().asegurarQuePuedeReenviar(segundosDespues(45), POLITICA),
      ).toThrow(expect.objectContaining({ segundosRestantes: 15 }));
    });

    it('un código nuevo reinicia los intentos y la vigencia', () => {
      const registro = crear();
      registro.registrarIntentoFallido(POLITICA);
      registro.renovarCodigo('hash-2', segundosDespues(60), POLITICA);

      expect(registro.codigoHash).toBe('hash-2');
      expect(registro.intentosFallidos).toBe(0);
      expect(registro.codigoExpiraEn).toEqual(segundosDespues(660));
    });
  });

  describe('registro abandonado', () => {
    it('no está abandonado mientras el código sigue vigente', () => {
      expect(crear().estaAbandonado(segundosDespues(599))).toBe(false);
    });

    it('está abandonado cuando el código venció sin verificarse', () => {
      expect(crear().estaAbandonado(segundosDespues(600))).toBe(true);
    });
  });

  it('al confirmar devuelve la cuenta pública con el consentimiento', () => {
    const usuario = crear().confirmar();

    expect(usuario.id).toBe('41234567');
    expect(usuario.rol).toBe('USUARIO_PUBLICO');
    expect(usuario.nombre.valor).toBe('Carmen Rodríguez');
    expect(usuario.numeroIdentificacion.valor).toBe('41234567');
    expect(usuario.consentimiento.versionAviso).toBe('v1');
    expect(usuario.creadoEn).toEqual(AHORA);
  });
});
