import { DatoInvalidoError } from '../../../src/shared/domain/error-de-negocio.js';
import {
  Consentimiento,
  ConsentimientoRequeridoError,
} from '../../../src/modules/auth/domain/value-objects/consentimiento.js';
import { Correo } from '../../../src/modules/auth/domain/value-objects/correo.js';
import { FechaNacimiento } from '../../../src/modules/auth/domain/value-objects/fecha-nacimiento.js';
import { NombrePersona } from '../../../src/modules/auth/domain/value-objects/nombre-persona.js';
import { NumeroIdentificacion } from '../../../src/modules/auth/domain/value-objects/numero-identificacion.js';
import { Telefono } from '../../../src/modules/auth/domain/value-objects/telefono.js';

const HOY = new Date('2026-11-05T15:00:00Z');

describe('Correo', () => {
  it('normaliza a minúsculas y sin espacios', () => {
    expect(Correo.crear('  Carmen@Correo.COM ').valor).toBe(
      'carmen@correo.com',
    );
  });

  it.each(['sin-arroba', 'a@b', 'a b@c.com', ''])('rechaza «%s»', (valor) => {
    expect(() => Correo.crear(valor)).toThrow(DatoInvalidoError);
  });

  it('se enmascara sin revelar el usuario', () => {
    expect(Correo.crear('carmen@correo.com').enmascarado()).toBe(
      'c****@correo.com',
    );
  });

  it('compara por valor normalizado', () => {
    expect(Correo.crear('A@b.co').igualA(Correo.crear('a@B.co'))).toBe(true);
  });
});

describe('Telefono', () => {
  it.each([
    '3001234567',
    '300 123 4567',
    '+57 300-123-4567',
    '573001234567',
    '(300) 123.4567',
  ])('reconoce «%s» como el mismo celular', (valor) => {
    expect(Telefono.crear(valor).valor).toBe('+573001234567');
  });

  it.each(['6012345678', '30012345', '30012345678', 'abc', '+1 3001234567'])(
    'rechaza «%s»',
    (valor) => {
      expect(() => Telefono.crear(valor)).toThrow(DatoInvalidoError);
    },
  );

  it('se enmascara mostrando solo los últimos 4 dígitos', () => {
    expect(Telefono.crear('3001234567').enmascarado()).toBe('+57 *** *** 4567');
  });
});

describe('NumeroIdentificacion', () => {
  it('quita puntos, espacios y guiones, y pasa a mayúsculas', () => {
    expect(NumeroIdentificacion.crear(' 41.234.567 ').valor).toBe('41234567');
    expect(NumeroIdentificacion.crear('ab-12345').valor).toBe('AB12345');
  });

  it.each(['123', '1234567890123456', '12#45'])('rechaza «%s»', (valor) => {
    expect(() => NumeroIdentificacion.crear(valor)).toThrow(DatoInvalidoError);
  });
});

describe('NombrePersona', () => {
  it('quita espacios sobrantes', () => {
    expect(NombrePersona.crear('  Carmen   Rodríguez ').valor).toBe(
      'Carmen Rodríguez',
    );
  });

  it.each(['', ' a ', 'x'.repeat(101)])(
    'rechaza nombres fuera de 2 a 100 caracteres',
    (valor) => {
      expect(() => NombrePersona.crear(valor)).toThrow(DatoInvalidoError);
    },
  );
});

describe('FechaNacimiento', () => {
  it('acepta una fecha válida en formato AAAA-MM-DD', () => {
    expect(FechaNacimiento.desdeTexto('1955-08-21', HOY).aTexto()).toBe(
      '1955-08-21',
    );
  });

  it('acepta la fecha de hoy', () => {
    expect(FechaNacimiento.desdeTexto('2026-11-05', HOY).aTexto()).toBe(
      '2026-11-05',
    );
  });

  it.each(['21/08/1955', '1955-8-21', '2001-02-30', '1955-13-01'])(
    'rechaza el formato o la fecha «%s»',
    (valor) => {
      expect(() => FechaNacimiento.desdeTexto(valor, HOY)).toThrow(
        DatoInvalidoError,
      );
    },
  );

  it('rechaza fechas futuras', () => {
    expect(() => FechaNacimiento.desdeTexto('2026-11-06', HOY)).toThrow(
      'posterior a hoy',
    );
  });

  it('rechaza edades mayores a 120 años', () => {
    expect(() => FechaNacimiento.desdeTexto('1900-01-01', HOY)).toThrow(
      'Revisa el año',
    );
  });
});

describe('Consentimiento', () => {
  it('guarda la versión del aviso y la fecha de aceptación', () => {
    const consentimiento = Consentimiento.otorgar(true, 'v1', HOY);
    expect(consentimiento.versionAviso).toBe('v1');
    expect(consentimiento.aceptadoEn).toEqual(HOY);
  });

  it('exige aceptar el aviso de privacidad', () => {
    expect(() => Consentimiento.otorgar(false, 'v1', HOY)).toThrow(
      ConsentimientoRequeridoError,
    );
  });
});
