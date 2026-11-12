import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // global-setup crea la base clena_e2e, aplica migraciones y carga las semillas.
    globalSetup: ['./test/e2e/global-setup.ts'],
    setupFiles: ['./test/e2e/setup.ts'],
    // Los archivos comparten la base de datos: se ejecutan uno tras otro.
    fileParallelism: false,
    // Sin logs de pino durante las pruebas.
    env: { LOG_LEVEL: 'silent' },
  },
});
