FROM node:24-alpine
WORKDIR /app
RUN npm install -g pnpm@12.4.2

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 3000
# Aplica las migraciones pendientes y carga las semillas (aviso de privacidad y
# categorías; es idempotente) antes de arrancar, para que `docker compose up`
# deje la base lista sin pasos manuales.
CMD ["sh", "-c", "pnpm prisma:deploy && pnpm prisma:seed && node dist/main"]
