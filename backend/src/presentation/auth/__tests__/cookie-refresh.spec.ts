import { describe, expect, it } from 'vitest';
import { cookieSegura } from '../cookie-refresh.js';

describe('BE-09 · atributo Secure de la cookie del refresh token', () => {
  it.each([
    [{ NODE_ENV: 'production' }, true],
    [{ NODE_ENV: 'development' }, false],
    [{ NODE_ENV: 'test' }, false],
    // Producción servida por http (la sala sin certificado): hay que apagarlo.
    [{ NODE_ENV: 'production', COOKIE_SEGURA: 'false' }, false],
    // Desarrollo detrás de un proxy con HTTPS.
    [{ NODE_ENV: 'development', COOKIE_SEGURA: 'true' }, true],
  ])('%o → Secure %s', (env, esperado) => {
    expect(cookieSegura(env as NodeJS.ProcessEnv)).toBe(esperado);
  });
});
