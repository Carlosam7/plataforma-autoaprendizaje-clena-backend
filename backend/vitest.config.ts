import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      // El enunciado exige 70 % en las capas de dominio y aplicación.
      include: ['src/**/domain/**/*.ts', 'src/**/application/**/*.ts'],
      exclude: ['**/*.port.ts', '**/tokens.ts', '**/repositories/*.ts', '**/configuracion-*.ts'],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
