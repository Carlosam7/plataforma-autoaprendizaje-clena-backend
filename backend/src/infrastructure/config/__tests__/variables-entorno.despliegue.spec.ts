import { describe, expect, it } from 'vitest';
import { validarVariablesEntorno } from '../variables-entorno.js';

/** Lo mínimo para arrancar; los secretos son ficticios. */
const BASE = {
  DATABASE_URL: 'postgresql://kama:kama@localhost:5432/kama',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};
// En producción los códigos no pueden ir a la consola: proveedores reales ficticios.
const PRODUCCION = {
  ...BASE,
  NODE_ENV: 'production',
  NOTIFICACIONES_CORREO: 'smtp',
  SMTP_HOST: 'smtp.example.test',
  SMTP_USUARIO: 'kama',
  SMTP_CLAVE: 'clave-ficticia',
  CORREO_REMITENTE: 'kama@example.test',
  NOTIFICACIONES_SMS: 'textbee',
  TEXTBEE_API_KEY: 'clave-ficticia',
  TEXTBEE_DEVICE_ID: 'dispositivo-ficticio',
};

describe('BE-09 · validarVariablesEntorno: Swagger y cookie Secure', () => {
  it('fuera de producción: Swagger sí y cookie sin Secure', () => {
    expect(validarVariablesEntorno({ ...BASE })).toMatchObject({
      SWAGGER_HABILITADO: true,
      COOKIE_SEGURA: false,
    });
  });

  it('en producción: Swagger no y cookie Secure por defecto', () => {
    expect(validarVariablesEntorno(PRODUCCION)).toMatchObject({
      SWAGGER_HABILITADO: false,
      COOKIE_SEGURA: true,
    });
  });

  it('en producción por http se puede apagar Secure, y encender Swagger', () => {
    expect(
      validarVariablesEntorno({
        ...PRODUCCION,
        SWAGGER_HABILITADO: 'true',
        COOKIE_SEGURA: 'false',
      }),
    ).toMatchObject({ SWAGGER_HABILITADO: true, COOKIE_SEGURA: false });
  });

  it.each(['SWAGGER_HABILITADO', 'COOKIE_SEGURA'])(
    'rechaza %s con un valor que no es true o false',
    (nombre) => {
      expect(() =>
        validarVariablesEntorno({ ...BASE, [nombre]: 'si' }),
      ).toThrow(`${nombre} debe ser true o false`);
    },
  );
});
