import { Correo } from '../../auth/value-objects/correo.js';
import { NombrePersona } from '../../auth/value-objects/nombre-persona.js';
import { CodigoPersonal } from '../codigo-personal.js';
import {
  AutoModificacionNoPermitidaError,
  CambioPasswordNoRequeridoError,
} from '../errores.js';
import { Password } from '../password.js';
import { Personal } from '../personal.js';
import { DatoInvalidoError } from '../../shared/error-de-negocio.js';
import {
  CodigoExpiradoError,
  IntentosAgotadosError,
  ReenvioMuyProntoError,
} from '../../auth/errores.js';

const ahora = new Date('2026-11-12T15:00:00Z');

function monitor(): Personal {
  return Personal.crear({
    id: 'monitor-1',
    nombre: NombrePersona.crear('Luis Pérez'),
    correo: Correo.crear('luis@clena.example'),
    rol: 'PERSONAL',
    passwordHash: 'hash-temporal',
    creadoPorId: 'admin-1',
    ahora,
  });
}

describe('Personal', () => {
  it('se crea activo y con contraseña temporal', () => {
    const cuenta = monitor();
    expect(cuenta.activo).toBe(true);
    expect(cuenta.debeCambiarPassword).toBe(true);
    expect(cuenta.creadoPorId).toBe('admin-1');
    expect(cuenta.creadoEn).toEqual(ahora);
    expect(cuenta.ultimoAccesoEn).toBeNull();
  });

  it('un administrador desactiva y reactiva a otra persona', () => {
    const cuenta = monitor();
    cuenta.desactivar('admin-1');
    expect(cuenta.activo).toBe(false);
    cuenta.reactivar();
    expect(cuenta.activo).toBe(true);
  });

  it('nadie puede desactivarse a sí mismo', () => {
    const cuenta = monitor();
    expect(() => cuenta.desactivar('monitor-1')).toThrow(
      AutoModificacionNoPermitidaError,
    );
    expect(cuenta.activo).toBe(true);
  });

  it('edita nombre, correo y rol', () => {
    const cuenta = monitor();
    cuenta.editar(
      {
        nombre: NombrePersona.crear('Luis A. Pérez'),
        correo: Correo.crear('luis.perez@clena.example'),
        rol: 'ADMINISTRADOR',
      },
      'admin-1',
    );
    expect(cuenta.nombre.valor).toBe('Luis A. Pérez');
    expect(cuenta.correo.valor).toBe('luis.perez@clena.example');
    expect(cuenta.rol).toBe('ADMINISTRADOR');
  });

  it('no permite cambiarse el propio rol, pero sí el propio nombre', () => {
    const cuenta = monitor();
    expect(() => cuenta.editar({ rol: 'ADMINISTRADOR' }, 'monitor-1')).toThrow(
      AutoModificacionNoPermitidaError,
    );
    cuenta.editar(
      { nombre: NombrePersona.crear('Luis'), rol: 'PERSONAL' },
      'monitor-1',
    );
    expect(cuenta.nombre.valor).toBe('Luis');
  });

  it('cambia la contraseña temporal una sola vez', () => {
    const cuenta = monitor();
    cuenta.cambiarPasswordInicial('hash-nuevo');
    expect(cuenta.passwordHash).toBe('hash-nuevo');
    expect(cuenta.debeCambiarPassword).toBe(false);
    expect(() => cuenta.cambiarPasswordInicial('otro')).toThrow(
      CambioPasswordNoRequeridoError,
    );
  });
});

describe('Password', () => {
  it.each(['Temporal2026', 'ñandú1234', 'a1b2c3d4'])('acepta %s', (valor) => {
    expect(Password.crear(valor).valor).toBe(valor);
  });

  it.each(['corta1', 'sololetras', '12345678', 'a1'.repeat(37)])(
    'rechaza %s',
    (valor) => {
      expect(() => Password.crear(valor, 'passwordTemporal')).toThrow(
        DatoInvalidoError,
      );
    },
  );
});

describe('CodigoPersonal', () => {
  const politica = {
    vigenciaMinutos: 10,
    maxIntentos: 2,
    esperaReenvioSegundos: 60,
  };
  const emitido = () =>
    CodigoPersonal.emitir({
      id: 'c-1',
      personalId: 'monitor-1',
      proposito: 'CAMBIO_PASSWORD_INICIAL',
      codigoHash: 'h',
      ahora,
      politica,
    });

  it('vence según la política', () => {
    const codigo = emitido();
    expect(codigo.expiraEn).toEqual(new Date('2026-11-12T15:10:00Z'));
    expect(() => codigo.asegurarUtilizable(ahora, politica)).not.toThrow();
    expect(() =>
      codigo.asegurarUtilizable(new Date('2026-11-12T15:10:00Z'), politica),
    ).toThrow(CodigoExpiradoError);
  });

  it('se bloquea al agotar los intentos', () => {
    const codigo = emitido();
    expect(codigo.registrarIntentoFallido(politica)).toBe(1);
    expect(codigo.registrarIntentoFallido(politica)).toBe(0);
    expect(() => codigo.asegurarUtilizable(ahora, politica)).toThrow(
      IntentosAgotadosError,
    );
  });

  it('exige esperar antes de reenviar', () => {
    const codigo = emitido();
    expect(() =>
      codigo.asegurarQuePuedeReenviar(
        new Date('2026-11-12T15:00:30Z'),
        politica,
      ),
    ).toThrow(ReenvioMuyProntoError);
    expect(() =>
      codigo.asegurarQuePuedeReenviar(
        new Date('2026-11-12T15:01:00Z'),
        politica,
      ),
    ).not.toThrow();
  });

  it('registra cuándo se usó', () => {
    const codigo = emitido();
    codigo.marcarUsado(ahora);
    expect(codigo.usadoEn).toEqual(ahora);
  });
});
