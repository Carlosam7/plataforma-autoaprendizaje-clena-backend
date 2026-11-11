import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Los e2e comparten la misma base de datos: uno detrás de otro.
    fileParallelism: false,
    env: { NODE_ENV: 'test', LOG_LEVEL: 'silent' },
  },
});
