FROM node:24-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@12.4.2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM nginx:alpine
# Reenvía /api al backend y sirve index.html en las rutas de React Router.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
