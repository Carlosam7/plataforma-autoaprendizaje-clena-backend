---
name: kama
description: Reglas de implementación del backend Kamá (Plataforma de autoaprendizaje CLENA, P1) según el enunciado del profesor. Úsala SIEMPRE que se vaya a implementar, modificar o revisar una funcionalidad del backend (NestJS + Prisma + PostgreSQL) o su pantalla en React, crear un caso de uso, entidad, repositorio, controlador, DTO, migración, seed o prueba, o cuando el usuario diga "kama", "/kama", "implementa la HU-XX" o "revisa si esto cumple". Asegura Clean Architecture, la definición de terminado (E7) y GitHub Flow.
---

# Kamá — cómo implementamos código

Fuente de verdad: `DOCUMENTACION/Proyecto Final Backend — Soluciones para el CLENA.pdf` y `DOCUMENTACION/Entrega 1.pdf`, y el modelo de datos en `docs/` + `backend/prisma/schema.prisma`. Si algo de esta skill choca con esos PDFs, ganan los PDFs: léelos y avisa al usuario.

Stack fijo (cambiarlo = entrega no válida): NestJS + TypeScript, Clean Architecture, Prisma, PostgreSQL ≥ 15, React + TypeScript (Vite), Docker Compose, Vitest, oxlint, prettier, pnpm.

## 1. Antes de escribir código

1. Identifica la historia de usuario (issue de GitHub `HU-XX` / `#N`). Si no hay issue, pídelo: sin issue no hay rama ni PR válidos.
2. Lee sus criterios de aceptación (Dado/Cuando/Entonces). Cada criterio debe terminar siendo una prueba o algo demostrable en vivo.
3. Revisa `backend/prisma/schema.prisma` para las tablas implicadas. No inventes columnas: si falta algo, es una migración nueva.
4. Rama: `feat/<issue>-descripcion-corta` (o `fix/...`, `docs/...`), creada desde la rama base del equipo.

## 2. Capas y regla de dependencia (lo que más se califica)

Las dependencias apuntan hacia el dominio. Ninguna capa interna importa a una externa.

```
presentation  ─►  application  ─►  domain  ◄─  infrastructure
     (Nest)        (casos de uso)   (TS puro)      (Prisma)
                 modules/  = composition root (une todo)
```

| Capa | Carpeta | Contiene | Puede importar | NUNCA importa |
|---|---|---|---|---|
| Dominio | `src/domain/<modulo>/` | entidades, objetos de valor, reglas de negocio, errores de dominio, puertos (repositorios como `abstract class`) | solo `src/domain/**` | `@nestjs/*`, `@prisma/*`, `class-validator`, `class-transformer`, `@nestjs/swagger`, nada de `application/infrastructure/presentation` |
| Aplicación | `src/application/<modulo>/` | un caso de uso por acción del negocio (`RegistrarSolicitudAyuda`, `BuscarGuias`), tipos de entrada/salida planos, puertos a servicios externos (correo, archivos) | `domain` | `@nestjs/*`, Prisma, decoradores de swagger/validación, `presentation`, `infrastructure` |
| Infraestructura | `src/infrastructure/` | `PrismaService`, `repositories/prisma-<x>.repository.ts`, mappers fila→entidad, correo, almacenamiento | `domain`, `application` (puertos) | `presentation` |
| Presentación | `src/presentation/<modulo>/` | controladores REST, DTOs HTTP con `class-validator` + `@nestjs/swagger`, guards, pipes, filtros, `health/` | `application` (casos de uso y sus tipos) | `infrastructure`, Prisma |
| Composición | `src/modules/<modulo>.module.ts` | el `@Module` de Nest que une token de repositorio → implementación Prisma y construye los casos de uso | todas | — |

Reglas duras:
- Los tipos generados por Prisma no salen de `infrastructure/`. El repositorio siempre devuelve entidades de dominio (`new Categoria(...)`), mapeadas a mano.
- El controlador solo valida (vía DTO), llama a **un** caso de uso y devuelve su resultado. Cero lógica de negocio, cero Prisma.
- La lógica de negocio (estados válidos, permisos sobre el recurso, cálculos) vive en la entidad o en el caso de uso, no en el repositorio ni en el controlador.
- Errores de negocio: clase de error de dominio (`GuiaNoEncontradaError extends ErrorDominio`) lanzada desde dominio/aplicación; el filtro global de presentación la traduce a HTTP (404, 409…). El dominio nunca lanza `HttpException`.

Comprobación rápida antes de cerrar (debe salir vacío):

```bash
grep -rnE "from '@nestjs|from '@prisma|class-validator|class-transformer|infrastructure/|presentation/" backend/src/domain backend/src/application
```

## 3. Plantillas por capa

Ejemplo con `categoria` (ajusta nombres). Imports con extensión `.js` (el proyecto es ESM).

**Dominio — puerto** `src/domain/<modulo>/<modulo>.repository.ts`
```ts
import { Pagina, Paginacion } from '../shared/pagina.js';
import { Categoria } from './categoria.js';

export const CAMPOS_ORDEN_CATEGORIA = ['orden', 'nombre'] as const;

export interface CriterioCategorias extends Paginacion {
  q?: string;
  ordenarPor: (typeof CAMPOS_ORDEN_CATEGORIA)[number];
  direccion: 'asc' | 'desc';
}

// abstract class (no interface) para que sirva como token de inyección de Nest.
export abstract class CategoriaRepository {
  abstract listar(criterio: CriterioCategorias): Promise<Pagina<Categoria>>;
}
```

**Aplicación — caso de uso** `src/application/<modulo>/<accion>.use-case.ts` (sin `@Injectable`)
```ts
import { CategoriaRepository, CriterioCategorias } from '../../domain/categoria/categoria.repository.js';

export interface CategoriaResumen { slug: string; nombre: string; icono: string; }
export interface ResultadoPaginado<T> { datos: T[]; total: number; pagina: number; limite: number; }

export class ListarCategoriasUseCase {
  constructor(private readonly categorias: CategoriaRepository) {}

  async ejecutar(criterio: CriterioCategorias): Promise<ResultadoPaginado<CategoriaResumen>> {
    const { elementos, total } = await this.categorias.listar(criterio);
    return {
      datos: elementos.map(({ slug, nombre, icono }) => ({ slug, nombre, icono })),
      total,
      pagina: criterio.pagina,
      limite: criterio.limite,
    };
  }
}
```

**Infraestructura — repositorio** `src/infrastructure/database/repositories/prisma-<modulo>.repository.ts`
- `@Injectable()`, recibe `PrismaService`, `implements CategoriaRepository`.
- Listados: `findMany` + `count` dentro de `this.prisma.$transaction([...])`, `skip = (pagina-1)*limite`, `take = limite`, `orderBy` solo con campos de la lista blanca.
- Búsqueda de texto: `contains` + `mode: 'insensitive'`, y la columna debe tener índice (si no lo tiene, migración nueva).
- Mapea cada fila a entidad de dominio antes de devolver.

**Presentación — DTO HTTP** `src/presentation/<modulo>/dto/<accion>.dto.ts`
- Clase con `class-validator` + `@ApiProperty/@ApiPropertyOptional`, `implements` el tipo de entrada del dominio/aplicación.
- Listados extienden `PaginacionDto` (`pagina` ≥ 1 por defecto 1, `limite` 1–100 por defecto 20) y añaden filtros + `ordenarPor` (`@IsIn` lista blanca) + `direccion`.
- Respuesta: clase con `@ApiProperty` que `implements` el tipo de salida del caso de uso (solo para Swagger).

**Presentación — controlador** `src/presentation/<modulo>/<modulo>.controller.ts`
```ts
@ApiTags('categorias')
@Controller('categorias')
export class CategoriaController {
  constructor(private readonly listarCategorias: ListarCategoriasUseCase) {}

  @Get()
  @ApiOkResponse({ type: CategoriasPaginadasDto })
  listar(@Query() query: ListarCategoriasDto) {
    return this.listarCategorias.ejecutar(query);
  }
}
```
Rutas protegidas: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMINISTRADOR', 'PERSONAL')` + `@ApiBearerAuth()`. Lecturas públicas para el usuario público se marcan explícitamente (`@Publico()`).

**Composición — módulo** `src/modules/<modulo>.module.ts` (este es el fragmento que pide E5)
```ts
@Module({
  controllers: [CategoriaController],
  providers: [
    { provide: CategoriaRepository, useClass: PrismaCategoriaRepository },
    {
      provide: ListarCategoriasUseCase,
      useFactory: (repo: CategoriaRepository) => new ListarCategoriasUseCase(repo),
      inject: [CategoriaRepository],
    },
  ],
})
export class CategoriaModule {}
```
Regístralo en `AppModule.imports`.

## 4. Requisitos transversales que todo endpoint respeta

- Prefijo `/api/v1` (global en `main.ts`); Swagger en `/docs`; salud en `/api/v1/health`.
- Toda entrada validada por DTO (`crearPipeValidacion()` global: `whitelist`, `forbidNonWhitelisted`, `transform`). Cada decorador de `class-validator` lleva `{ message: '...' }` en español sencillo: ese texto es el que ve el usuario.
- Todo listado: paginación + filtros + ordenamiento. Respuesta `{ datos, total, pagina, limite }`.
- Errores uniformes vía el único filtro global `ExcepcionesFilter`: `{ statusCode, codigo, mensaje, detalles?, ruta, fecha }`. Validación → `codigo: 'DATOS_INVALIDOS'`, `mensaje` = primer error y `detalles.campos` = `{ campo: [mensajes] }`. Errores de negocio: clases que extienden `ErrorDeNegocio` (`src/domain/shared/error-de-negocio.ts`) con un `tipo` (`validacion`, `conflicto`, `no_encontrado`, `expirado`…) que el filtro traduce a HTTP. Nunca filtrar SQL/stack al cliente.
- Roles: `ADMINISTRADOR`, `PERSONAL` (personal del CLENA) y usuario público. JWT access + refresh, contraseñas con bcrypt/argon2.
- El access token **no lleva datos personales**: solo `{ sid, rol }`, donde `sid` es la fila de `refresh_token`; el usuario se obtiene de esa fila. Nunca pongas la cédula (llave de `usuario_publico`) en el JWT ni en respuestas que no la necesiten.
- Ley 1581: datos personales mínimos, consentimiento explícito, aviso de privacidad, opción de eliminar cuenta. No pidas ni guardes datos que la HU no necesite.
- Configuración solo por variables de entorno; toda variable nueva va a `backend/.env.example` (sin valores secretos reales). Nada de secretos en el código.
- Logs: `Logger` de Nest (o el logger estructurado del proyecto), nunca `console.log`.

## 5. Base de datos

- Cambios de esquema = `pnpm prisma:migrate --name <descripcion>` → migración versionada en `prisma/migrations/`. Prohibido `db push`/`synchronize` fuera de local. Nunca edites una migración ya fusionada; crea otra.
- Índice en toda columna por la que se busca o filtra.
- Datos semilla ficticios (nunca datos reales del CLENA) en `prisma/seed.ts` (`pnpm prisma:seed`), con `upsert` para que sea idempotente; añade los registros que tu HU necesita para la demo. El contenedor y los e2e lo ejecutan solos.
- El modelo de datos oficial (`docs/Modelo de datos — Kamá.pdf` + migración inicial) manda: no crees tablas paralelas para una HU; si de verdad falta algo, migración nueva y actualizar el PDF.

## 6. Pruebas (mínimo por HU)

- Unitaria del caso de uso en `src/application/<modulo>/__tests__/<accion>.use-case.spec.ts` con un repositorio falso que extiende el puerto (sin Nest, sin BD). Cubre camino feliz + cada regla/criterio de aceptación + errores de dominio.
- Unitaria de reglas de la entidad en `src/domain/<modulo>/__tests__/` si la entidad tiene lógica.
- e2e del flujo principal en `test/e2e/<modulo>.e2e-spec.ts` con supertest contra `/api/v1/...` (incluye 400 por validación y 401/403 si la ruta es protegida). Usa `crearApp()`/`limpiarBaseDatos()` de `test/e2e/app.ts`; corren contra la base `clena_e2e` que prepara `global-setup.ts` (migraciones + semillas).
- Meta: ≥ 70 % de cobertura en `domain` y `application` (`pnpm test:cov`).

## 7. Frontend (la HU no está terminada sin pantalla)

- Pantalla en `frontend/src` que consume el endpoint, con ruta protegida según rol.
- Accesibilidad obligatoria en P1: letra grande y escalable (rem), alto contraste, `<label>` en cada campo, navegación por teclado, foco visible, responsive para celular.

## 8. Definición de terminado (E7) — checklist antes del PR

Una funcionalidad solo cuenta si cumple las seis:
- [ ] Caso de uso en `application/`, invocado por un controlador en `/api/v1`.
- [ ] Persistencia en PostgreSQL por migración versionada + datos semilla para la demo.
- [ ] Endpoint en Swagger, validación por DTO, paginación y filtros en listados.
- [ ] Pantalla en React que lo consume, con ruta protegida por rol.
- [ ] Al menos una prueba unitaria del caso de uso pasando en el CI.
- [ ] Criterios de aceptación de la HU demostrables en vivo.

Y además:
- [ ] `grep` de la sección 2 sale vacío (dominio y aplicación sin framework).
- [ ] `cd backend && pnpm format:check && pnpm lint && pnpm test && pnpm build` en verde (lo mismo que corre el CI).
- [ ] `.env.example` actualizado si hubo variables nuevas.

## 9. Git y PR (25 % de la nota del proyecto)

- Conventional Commits: `feat(<modulo>): ...`, `fix:`, `test:`, `refactor:`, `docs:`. Commits pequeños por capa ayudan a demostrar autoría.
- PR con la plantilla de `.github/PULL_REQUEST_TEMPLATE.md`, `Closes #<issue>`, qué cambia y cómo probarlo (curl o pasos en Swagger).
- Mínimo una aprobación de otro integrante y CI en verde antes de fusionar; se borra la rama después.
- Nunca push directo a `main`. Lo que se califica es `main` (tag `entrega-1`).
- No subir videos ni archivos pesados; los informes de `docs/` van en PDF con diagramas como imagen (no Mermaid/PlantUML).
- Uso de IA permitido, pero quien sube el código debe poder explicarlo: al terminar, resume al usuario qué hace cada archivo nuevo y por qué está en esa capa.

## 10. Forma de trabajar con esta skill

1. Lee la HU y confirma el alcance con el usuario si es ambiguo.
2. Implementa en este orden: dominio → aplicación (+ prueba unitaria) → infraestructura (+ migración/seed si aplica) → presentación → módulo → e2e → pantalla React.
3. Corre la verificación de la sección 8.
4. Entrega un resumen corto: archivos por capa, cómo probarlo, qué falta del checklist.
