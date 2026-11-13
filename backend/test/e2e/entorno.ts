import 'dotenv/config';

/**
 * Las pruebas e2e usan una base de datos propia para no borrar los datos de desarrollo.
 * Por defecto es la misma URL de DATABASE_URL con la base `clena_e2e`.
 */
export function urlBaseDatosE2e(): string {
  if (process.env.DATABASE_URL_E2E) return process.env.DATABASE_URL_E2E;
  const base = process.env.DATABASE_URL;
  if (!base)
    throw new Error(
      'Define DATABASE_URL o DATABASE_URL_E2E para las pruebas e2e',
    );
  const url = new URL(base);
  url.pathname = '/clena_e2e';
  return url.toString();
}
