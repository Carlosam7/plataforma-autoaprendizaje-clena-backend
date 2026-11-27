# Kamá — Plataforma de autoaprendizaje digital para la Sala de Internet del CLENA

Proyecto final del curso Backend (Universidad del Norte) · «Soluciones para el CLENA» · Proyecto **P1**.

Kamá es una aplicación web con guías paso a paso, actividades de práctica con retroalimentación inmediata y una cola de solicitudes de ayuda presencial, pensada para adultos mayores y visitantes con poca experiencia digital.

## Problema que resuelve

En la Sala de Internet del CLENA muchos visitantes no saben usar el correo, buscar en internet, crear documentos o reconocer un mensaje fraudulento, y dependen del monitor para cada duda. El monitor recibe las mismas preguntas muchas veces al día y las atiende sin orden.

Kamá ataca ese problema de tres formas:

- **Guías de autoaprendizaje** por categoría (correo, búsqueda en internet, documentos, redes sociales y seguridad digital), con un paso por pantalla, texto corto e imágenes, administrables por el personal sin depender de programadores.
- **Práctica** con preguntas cortas que dicen de inmediato si la respuesta fue correcta y por qué.
- **Ayuda presencial ordenada**: quien no pudo resolver su duda la pide desde su equipo y el monitor atiende la cola en orden de llegada.

La plataforma se puede usar sin cuenta. Crear una cuenta sirve para guardar el progreso.

## Equipo de origen

<!-- TODO: completar con el nombre del equipo de Introducción y su contacto principal -->
Equipo de Introducción: **(por completar)** · Contacto principal: **(por completar)**

## Integrantes y roles Scrum

| Integrante | Rol Scrum |
| --- | --- |
| Wilmer Junior Santiago Donado | Development Team |
| Carlos Arango | Development Team |
| Esteban Dadul | Development Team |
| Andrés Monserrat | Development Team |

## Stack

| Parte | Tecnología |
| --- | --- |
| Backend | NestJS 12 + TypeScript, Prisma 7, JWT, class-validator, pino |
| Frontend | React 19 + TypeScript, Vite, React Router, nginx |
| Base de datos | PostgreSQL 15 |
| Calidad | Vitest, Supertest, oxlint, Prettier, GitHub Actions |

![Diagrama de contenedores de Kamá](docs/img/c4-2-contenedores.png)

## Cómo levantar el proyecto

Requisito: Docker con Docker Compose.

```bash
git clone https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend.git
cd plataforma-autoaprendizaje-clena-backend
docker compose up
```

El primer arranque construye las imágenes, aplica las migraciones y carga los datos semilla. No hay pasos manuales.

| Qué | Dirección |
| --- | --- |
| Aplicación web | http://localhost:8080 |
| Salud de la API | http://localhost:3000/api/v1/health |
| Documentación Swagger | http://localhost:3000/docs |

### Cuenta de administrador inicial

Las semillas crean un administrador con los valores de las variables `ADMIN_INICIAL_CORREO` y `ADMIN_INICIAL_PASSWORD`. Sin un archivo `.env`, `docker-compose.yml` usa valores por defecto solo para desarrollo local (se pueden consultar allí). La contraseña es temporal: el sistema pide cambiarla en el primer ingreso.

### Códigos de verificación en desarrollo

El registro y el inicio de sesión envían un código por correo o SMS. Mientras no se configure un proveedor, el código se escribe en los logs del backend:

```bash
docker compose logs -f backend
```

### Variables de entorno

Para un despliegue real, crea un archivo `.env` junto a `docker-compose.yml` con tus propios valores (base de datos, `JWT_ACCESS_SECRET`, administrador inicial, proveedor de correo y SMS). La lista completa está en `backend/.env.example`. Ningún secreto se guarda en el repositorio.

### Desarrollo sin Docker

```bash
# Backend (necesita PostgreSQL y backend/.env a partir de .env.example)
cd backend
pnpm install
pnpm prisma:deploy && pnpm prisma:seed
pnpm start:dev

# Frontend
cd frontend
pnpm install
pnpm dev
```

### Pruebas y calidad

```bash
cd backend
pnpm lint        # análisis estático
pnpm test        # pruebas unitarias
pnpm test:e2e    # pruebas de extremo a extremo de la API
pnpm build
```

Estas verificaciones corren en GitHub Actions en cada Pull Request.

## Estructura del repositorio

```
├── backend/     API NestJS con Clean Architecture (domain, application, infrastructure, presentation)
├── frontend/    Aplicación React
├── docs/        Informes de la entrega en PDF e imágenes en docs/img/
└── docker-compose.yml
```

## Documentación

- [Modelo de dominio](docs/modelo-dominio.pdf)
- [Modelo de datos](docs/modelo-datos.pdf)
- [Arquitectura (modelo C4)](docs/arquitectura.pdf)
- [Acta de Inception](docs/inception.pdf)
- [Daily Scrum](docs/daily-scrum.pdf)
- [Evidencias](docs/evidencias.pdf)

## Forma de trabajo

Scrum con tablero en GitHub Projects y GitHub Flow: ramas `feat/<issue>-descripcion`, `fix/...` o `docs/...`, commits con Conventional Commits y Pull Request con al menos una aprobación y CI en verde antes de fusionar a `main`.
