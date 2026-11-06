import { execSync } from 'node:child_process';
import pg from 'pg';
import { urlBaseDatosE2e } from './entorno.js';

/** Crea la base de datos de pruebas si no existe y aplica las migraciones. */
export default async function prepararBaseDatos(): Promise<void> {
  const url = new URL(urlBaseDatosE2e());
  const nombre = url.pathname.slice(1);

  const admin = new URL(url);
  admin.pathname = '/postgres';
  const cliente = new pg.Client({ connectionString: admin.toString() });
  await cliente.connect();
  const existe = await cliente.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [nombre],
  );
  if (existe.rowCount === 0) await cliente.query(`CREATE DATABASE "${nombre}"`);
  await cliente.end();

  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url.toString() },
  });
}
