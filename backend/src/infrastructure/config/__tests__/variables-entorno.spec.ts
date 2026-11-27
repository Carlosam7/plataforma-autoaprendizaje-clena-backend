import { describe, expect, it } from 'vitest';
import { validarVariablesEntorno } from '../variables-entorno.js';

/** Lo mínimo para arrancar; los secretos son ficticios. */
const BASE = {
  DATABASE_URL: 'postgresql://kama:kama@localhost:5432/kama',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

const SMTP = {
  NOTIFICACIONES_CORREO: 'smtp',
  SMTP_HOST: 'smtp.example.test',
  SMTP_USUARIO: 'kama',
  SMTP_CLAVE: 'clave-ficticia',
  CORREO_REMITENTE: 'kama@example.test',
};

const TEXTBEE = {
  NOTIFICACIONES_SMS: 'textbee',
  TEXTBEE_API_KEY: 'clave-ficticia',
  TEXTBEE_DEVICE_ID: 'dispositivo-ficticio',
};

describe('BE-05 · validarVariablesEntorno: los códigos no salen en los logs de producción', () => {
  it('fuera de producción, los códigos se pueden escribir en la consola (por defecto)', () => {
    expect(validarVariablesEntorno({ ...BASE })).toMatchObject({
      NODE_ENV: 'development',
      NOTIFICACIONES_CORREO: 'consola',
      NOTIFICACIONES_SMS: 'consola',
    });
  });

  it.each([
    ['correo', { ...TEXTBEE }, 'NOTIFICACIONES_CORREO=consola'],
    ['SMS', { ...SMTP }, 'NOTIFICACIONES_SMS=consola'],
  ])(
    'en producción no arranca si el %s va a la consola',
    (_, canales, error) => {
      expect(() =>
        validarVariablesEntorno({
          ...BASE,
          ...canales,
          NODE_ENV: 'production',
        }),
      ).toThrow(error);
    },
  );

  it('en producción arranca con proveedores reales de correo y SMS', () => {
    expect(
      validarVariablesEntorno({
        ...BASE,
        ...SMTP,
        ...TEXTBEE,
        NODE_ENV: 'production',
      }),
    ).toMatchObject({
      NOTIFICACIONES_CORREO: 'smtp',
      NOTIFICACIONES_SMS: 'textbee',
    });
  });
});
