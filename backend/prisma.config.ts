import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    // `pnpm prisma:seed` (o `prisma db seed`): aviso de privacidad y categorías iniciales.
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // `prisma generate` no necesita conexión; las migraciones sí.
    url: process.env.DATABASE_URL ?? '',
  },
});
