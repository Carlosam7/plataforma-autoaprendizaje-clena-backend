# Kamá — Plan maestro del frontend y sistema SDD para Claude Code

> **Documento de coordinación e implementación (v1.0, 9 de noviembre de 2026).**  
> **Repositorio único:** https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend  
> **Rama base inspeccionada:** [`dev`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/tree/dev) · commit `84a6807eb1b98162b845e4813f68f18a051614f2` (7 de noviembre de 2026).  
> **Ámbito de edición:** exclusivamente el frontend y la documentación/Skills de SDD aprobadas. **Prohibido generar o editar código backend.**

**Propósito del documento:** explicar al equipo **(Parte I)** cómo ejecutar el frontend de forma incremental, por qué se toma cada decisión y cómo se verifica cada historia, y **(Parte II)** qué conocimiento, archivos, normas, prompts y controles necesita Claude Code para trabajar con Spec-Driven Development (SDD). Incluye un anexo de trazabilidad con **45 historias y los 151 criterios de aceptación del backlog adjunto**, preservando su redacción y señalando cuáles están pendientes de revalidación por el cambio de alcance.

**Regla de procedencia:** `FUENTE` = constatación del backlog/modelo/repositorio; `ACUERDO` = decisión comunicada por el equipo; `PROPUESTA` = recomendación de implementación que debe aprobarse; `PENDIENTE` = desconocido o conflicto. Un plan no convierte por sí solo una propuesta en requisito aprobado.

## Resumen ejecutivo: decisiones ya tomadas y evidencia

| Tema | Situación y evidencia | Implicación para Claude |
|---|---|---|
| Monorepositorio | **FUENTE**: raíz con `backend/`, `frontend/`, `.github/` y `docker-compose.yml` en `dev` | Trabajar en el mismo repositorio y respetar archivos de otros equipos. |
| Estado del frontend | **FUENTE**: ya está creado un **scaffold React 19 + TypeScript + Vite 8** (`frontend/package.json`, `frontend/src/App.tsx`). `App.tsx` todavía es la demo de Vite/React; no hay flujo de Kamá | **No ejecutar `npm create vite` ni crear otra carpeta frontend**; evolucionar la estructura existente. |
| Gestión de paquetes | **FUENTE**: `pnpm-lock.yaml` y scripts pnpm; CI usa **Node 24 y pnpm 12.4.2** | Mantener gestor y lockfile actuales; no introducir npm/yarn de manera paralela. |
| Calidad instalada | **FUENTE**: CI frontend ejecuta `pnpm format:check`, `pnpm lint`, `pnpm build`; **Vitest aún no está instalado** y su job está comentado | Agregar pruebas sólo después de aprobar dependencias, sin romper job backend. |
| Backend ejecutable en `dev` | **FUENTE**: NestJS con prefijo global `/api/v1`, Swagger configurado en `/docs`, `GET /health` excluido del prefijo; `AppModule` sólo registra los controladores App y Health. El Prisma schema visible es inicial, sin tablas de Kamá | **No afirmar que existen endpoints de guías, auth, progreso, cola o administración.** Contratos futuros = `PENDIENTE`; mocks temporales explícitos. |
| Backend + frontend | **FUENTE**: Docker Compose conecta PostgreSQL, backend, frontend; imagen frontend usa Nginx, sin fallback SPA (`try_files`) al momento de la revisión | Reportar a infraestructura la necesidad de fallback cuando se use React Router; no modificar Docker/Compose sin revisión del dueño. |
| Contenido inicial | **ACUERDO comunicado**: una sola categoría inicial **Phishing**, con cinco guías de estafas digitales | La interfaz presenta cinco guías; no crear categorías antiguas ni una administración multicategoría no aprobada. |
| Extensibilidad | **PROPUESTA compatible** con el modelo documental: conservar relación categoría–guía, pero sólo poblar Phishing en v1 | Componentes leen datos de API; no codificar IDs ni nombres de guías en lógica. Se confirma con backend antes de integrar. |
| Backlog | **FUENTE**: 45 HU, 151 criterios; 28 Must en el documento original. Historial de roles contiene IDs desplazados respecto al backlog | Identificador canónico = HU del backlog adjunto; mapear alias antiguos antes de asociar issues/PR. |
| Diseño de marca | **PROPUESTA**: búho Kamá con gafas, verde profundo y acentos cálidos, asociado a aprender/revisar/proteger | Recurso gráfico decorativo, no control de seguridad ni sustituto de texto. Se necesita licencia/asset aprobado para la app. |

### Fuentes de partida y jerarquía

1. **Product Owner y acuerdos formales de alcance** posteriores al backlog: prevalecen para decidir *qué* se implementa; deben registrarse por escrito.
2. **Backlog P1 — Plataforma de autoaprendizaje digital CLENA.docx** (archivo adjunto): fuente de títulos, prioridades y criterios de aceptación originales. Los 151 criterios se transcriben en el anexo.
3. **Modelo de datos — Kamá.docx** (6 nov 2026): diseño previsto de 23 tablas; **no equivale a esquema migrado ni API implementada**.
4. **roles-y-responsabilidades.md**, **sprint-planning.md**, **daily-scrum.md** y **Acta de Incersion.md**: responsabilidades y contexto; **pueden usar numeración antigua**.
5. **Código de la rama `dev` en commit observado**: fuente de verdad para tecnologías, archivos existentes y endpoints implementados en ese commit.
6. **Contrato OpenAPI/API real** cuando el backend publique nuevos módulos: fuente de verdad para rutas y DTOs de integración. Si contradice una HU, no cambiar la HU silenciosamente; registrar incidencia al PO/BE.
7. **Documentación oficial de herramientas**: fuente para comandos de Spec Kit y Claude Code; comprobar versión instalada antes de ejecutar.

> **Advertencia de sincronización:** esta fotografía está anclada al commit indicado. Cuando avance `dev`, Claude debe verificar `git status`, `git fetch` y el nuevo diff antes de usar esta descripción como estado actual.

---
# PARTE I — Ruta de implementación del frontend

## I.1 Producto, personas y alcance

**Kamá** es una plataforma de autoaprendizaje digital para la Sala de Internet del CLENA, pensada prioritariamente para personas mayores o con poca experiencia digital. Su primera entrega enseñará a reconocer y prevenir phishing, no a aprender todas las competencias digitales del backlog anterior.

**Roles definidos en backlog:** visitante sin cuenta (lectura, prácticas de resultado temporal, ayuda), usuario público registrado (además guarda progreso/preferencias), personal CLENA (administra contenido, cola, estadísticas) y administrador (además personal y posibles categorías según alcance). La interfaz pública debe tratar a la persona adulta con respeto y sin lenguaje infantilizante.

**La única categoría de v1 será `Phishing`**, inicialmente con estas cinco guías (*nombres educativos propuestos; el PO aprueba su redacción*):

| Nº | Nombre visible | Concepto y simulación posible |
|---|---|---|
| 1 | Mensajes falsos de bancos | Correos/SMS que imitan alertas financieras; aprender a comprobar remitente y entrar por canales oficiales. |
| 2 | Llamadas que buscan engañarte | Vishing: supuesto asesor solicita código OTP o presiona para actuar. |
| 3 | Mensajes de familiares falsos | Smishing/suplantación por WhatsApp/SMS; verificar por número conocido antes de transferir dinero. |
| 4 | Premios y subsidios falsos | Promesas de ayuda o premio con enlaces a captura de datos. |
| 5 | Alertas falsas de virus | Ventanas y soporte técnico falsos; no instalar ni llamar desde alertas engañosas. |

**Aclaración pedagógica:** son cinco escenarios temáticos, no una clasificación exclusiva de los «cinco más comunes» verificada estadísticamente. **Cinco guías ≠ al menos cinco mensajes simulados** de HU-25: esta última exige cinco ejemplos dentro de una actividad. Las tres reglas transversales serán **no compartir claves ni códigos**, **verificar por un canal conocido** y **detenerse ante urgencia o miedo**. Los mensajes son ficticios, no enlaces reales, y nunca deben pedir credenciales verdaderas.

### I.1.1 Estado de los conflictos (no resolver en secreto)

| ID | Fuente | Situación | Estado y decisión requerida |
|---|---|---|---|
| DEC-01 | Acuerdo reciente vs HU-09/HU-16/HU-17–20 | La estructura antigua contempla cinco categorías y guías de correo, documentos, búsqueda y redes | **PENDIENTE:** PO debe aprobar reemplazo de criterios de contenido y confirmar que `Phishing` es única categoría en datos, sin eliminar soporte estructural. |
| DEC-02 | HU-16 vs modelo de datos | HU-16 figura **Should** en backlog; el modelo la excluye como **Won't** | **PENDIENTE:** PO determina si se difiere la administración dinámica de categorías; recomendación: diferirla. |
| DEC-03 | HU-26 y HU-27 vs especialización Phishing | Siguen como **Must** para contraseñas e información confiable en backlog | **PENDIENTE:** conservarlas explícitas, integrarlas como pasos/prácticas dentro de Phishing o posponerlas con nuevo acuerdo. No eliminarlas silenciosamente. |
| DEC-04 | HU-30 | Texto «pendiente → en atención → resuelta → cancelada» sugiere cancelación después de resolver | **PENDIENTE:** backend/PO confirman transiciones válidas; no inventar máquina de estados. |
| DEC-05 | HU-01/HU-02 y backend | Flujos de OTP, tokens y permisos definidos en historia/modelo, **sin endpoints correspondientes observados en `dev`** | **PENDIENTE:** documentar contrato y mocks aislados mientras backend los construye. |
| DEC-06 | HU-38 vs DoD en backlog | HU-38 exige Lighthouse CI + axe automáticos; DoD original los menciona como posible mejora en CI | **PROPUESTA:** prevalezca el criterio de HU-38 para su aceptación; acordar esfuerzo y soporte del CI. |
| DEC-07 | Roles vs backlog | Algunos documentos de reparto renumeran historias (ej. HU-08 en roles es explorar categorías, HU-09 en backlog) | **PENDIENTE:** matriz de equivalencias con issues reales, sin renumerar historias canónicas. |
| DEC-08 | HU-30/HU-29 temas de ayuda | Enum conceptual incluye temas antiguos y no Phishing como valor específico | **PENDIENTE BE:** cuáles temas reales acepta la API; FE no enviará valores inventados. |
| DEC-09 | HU-35, HU-40, HU-08 | Guardado local y sincronización perfil pueden discrepar entre dispositivos | **PENDIENTE:** precedencia, estado inicial y reglas de persistencia. |
| DEC-10 | CI existente y root | Adaptar Nginx para rutas SPA puede afectar infraestructura compartida | **PENDIENTE:** requerir PR aprobado por responsable de infraestructura. |

## I.2 Arquitectura de información y pantallas

### Experiencia pública (visita sin registro)

`/` inicio: marca Kamá, propósito, CTA «Comenzar a aprender», cinco guías de Phishing y Ayuda. `/phishing` catálogo de guías; `/guias/:id` ficha/objetivo y pasos; `/guias/:id/practica` preguntas; `/guias/:id/resultado` resultado; `/ayuda`, `/ayuda/solicitar`, `/preguntas-frecuentes`, `/glosario`; QR enlaza URLs públicas. **Rutas propuestas, no endpoints reales.**

### Experiencia usuario registrado

`/registro`, `/acceso`, `/verificar-codigo`, `/mi-progreso`, `/perfil`, `/preferencias`. Rutas y pasos definitivos dependen del contrato de autenticación y requisitos de privacidad. Las actividades deben poder resolverse sin cuenta (HU-03) y guardar progreso únicamente cuando hay sesión válida (HU-23).

### Experiencia personal y administrador

`/personal/acceso`, `/personal/guias`, `/personal/guias/nueva`, `/personal/guias/:id/editar`, `/personal/actividades`, `/personal/solicitudes`, `/personal/estadisticas`, `/personal/faq`, `/personal/glosario`; `/admin/personal` sólo administrador. Las rutas para búsqueda/filtros, FAQ y glosario se implementan según prioridad **Should** aprobada; la administración de categorías no forma parte de la propuesta v1.

### Estados obligatorios para cada pantalla

`idle`, `loading`, `success`, `empty`, `error` (red, autorización, validación o inexistencia), `unauthorized/forbidden` cuando corresponda; en formularios `dirty`, `submitting`, `success`, `field-error`; en prácticas `unanswered`, `submitted`, `feedback`, `finished`. Nunca exponer «401», «DTO», «token» ni stack traces al usuario final. No ocultar errores de red con resultados falsos.

### Componentes compartidos esenciales

`AppShell`, `PublicHeader`, `StaffShell`, `AccessibleButton`, `AccessibleLink`, `FormField`, `ErrorSummary`, `EmptyState`, `LoadingState`, `HelpEntry`, `FontSizeControl`, `ContrastToggle`, `GuideCard`, `GuideStepper`, `StepContent`, `QuestionCard`, `AnswerOption`, `FeedbackPanel`, `ProgressSummary`, `ConfirmDialog`, `StatusBadge`, `DataTable`, `QRCodePanel`, `Toast/StatusRegion`. El diseño visual se refactoriza en componentes; **nunca un `div` clicable en sustitución de un botón**.

## I.3 Sistema visual: propuesta justificada para el público del CLENA

**Intención:** confianza, claridad, tranquilidad y autonomía. Evitar estética amenazante (rojo constante, sirenas, neón, fondos oscuros) y también estética infantil. La mascota opcional es **búho con gafas** que acompaña, explica y señala alertas; no usa símbolos solos para comunicar seguridad.

| Token semántico propuesto | HEX inicial | Uso | Revisión obligatoria |
|---|---|---|---|
| `--color-brand-strong` | `#174C49` | Logo textual, encabezados | Contraste sobre fondo claro. |
| `--color-action` | `#17695D` | CTA y enlaces primarios | Texto blanco debe cumplir ratio requerido. |
| `--color-surface-tint` | `#DDEFE7` | Paneles pedagógicos | Verificar texto oscuro. |
| `--color-page` | `#F7F9F6` | Fondo principal | Mantener contraste de contenido. |
| `--color-text` | `#253B38` | Texto principal | Mínimo 4.5:1. |
| `--color-advice` | `#FFF1CF` | Consejos preventivos | No comunicar riesgo solo por el amarillo. |
| `--color-focus` | **por validar** | Anillo de foco | Visible contra todas las superficies. |
| `--color-danger`, `--color-success` | **por validar** | Estados con texto/icono | Contraste + significado no solo cromático. |

**Fundamento honesto:** estos tonos buscan transmitir calma y estructura; **no existe validación clínica del aprendizaje por elegir verde**. Se aceptan definitivamente sólo tras medición de contraste y prueba de comprensión. No trasladar literalmente HEX a todos los componentes: crear tokens semánticos por propósito.

| Propiedad | Base propuesta | Justificación y prueba |
|---|---|---|
| Fuente | Atkinson Hyperlegible (previa revisión de distribución) o sans-serif equivalente | Legibilidad sin depender de fuente ornamental; incluir fallback de sistema. |
| Base texto | 18 px mínimo, incluso móvil | HU-36 explícita; no reducir a 16 px en media queries. |
| Jerarquía | h1 30–36 px, h2 24–28 px, cuerpo 18+ | Niveles consistentes y orden lógico de encabezados. |
| Altura de CTA/tap target | mínimo 44×44 px; preferir 48 px en acciones primarias | HU-39 exige 44×44. |
| Espaciados | escala 4/8/12/16/24/32 px | Ritmo predecible, sin compactación excesiva. |
| Bordes | radios 12–16 px | Identidad acogedora y consistente. |
| Texto extenso | ancho limitado, separación y frases cortas | Ayuda a lectura y comprensión. |
| Movimiento | discreto, `prefers-reduced-motion` | No impedir foco ni generar distracción. |
| Preferencias | tamaño normal/grande/muy grande + alto contraste | HU-36/37: local invitado, perfil autenticado. |

**Accesibilidad base y verificable:** HTML semántico (`header`, `nav`, `main`, `section`, `article`, `form`, `label`, `fieldset`, `legend`, `button`), `lang="es"`, enlace «Saltar al contenido», encabezados lógicos, foco visible, navegación con teclado, formularios con error asociado mediante `aria-describedby`/`aria-invalid`, regiones `role="status"` o `aria-live="polite"` para anuncios pertinentes (sin duplicar), anuncios no intrusivos. Preferir `<button>` con nombre visible a `div` + `role`; usar ARIA sólo cuando aporte semántica. Pruebas manuales NVDA o VoiceOver y teclado, Lighthouse/axe; zoom 200 %, 360 px, objetivo WCAG 2.2 AA y **alto contraste 7:1** previsto en HU-37.

## I.4 Arquitectura frontend propuesta y sus límites

La raíz **ya contiene `frontend/`**. Conservar la infraestructura visible y evolucionar el código de la demo. **Tecnología confirmada:** React 19, TypeScript ~6, Vite 8, pnpm. **Opciones no instaladas que requieren aprobación:** React Router, Tailwind CSS, TanStack Query, React Hook Form, Zod, Vitest, Testing Library, Playwright y axe. Adoptarlas por necesidad real, no por moda. Si el equipo prefiere CSS Tokens nativos (ya hay CSS), Tailwind no es requisito.

```text
repositorio-compartido/
├── backend/                    # SOLO LECTURA para Claude/frontend
├── frontend/                   # EXISTENTE (no reinicializar)
│   ├── src/
│   │   ├── app/                # proveedores, layouts, rutas
│   │   ├── features/
│   │   │   ├── auth/ ├── catalog/ ├── guides/
│   │   │   ├── activities/ ├── progress/ ├── help/
│   │   │   ├── preferences/ ├── staff/ └── administration/
│   │   ├── components/ui/      # componentes semánticos compartidos
│   │   ├── services/api/       # HTTP, DTOs, errores y adapters
│   │   ├── styles/             # tokens, tipografía, contraste
│   │   ├── assets/             # mascotas aprobadas
│   │   └── test/
│   ├── package.json            # existente; sólo cambios justificados
│   ├── pnpm-lock.yaml          # existente
│   └── Dockerfile              # existente; cambio requiere coord. infra
├── .github/                    # compartido: no tocar sin permiso
├── docker-compose.yml         # compartido: no tocar sin permiso
├── docs/frontend/             # DOCUMENTACIÓN NUEVA
├── specs/                     # artefactos de Spec Kit por feature
├── .specify/                  # autogenerado por Spec Kit al aprobar init
├── .claude/skills/             # custom, sin duplicar Spec Kit
└── CLAUDE.md                  # guía breve root aprobada
```

**Flujo de integración:** `Page/React component → hook/capa de aplicación → API adapter tipado → servidor` (el servidor gestiona reglas de negocio). La URL del backend, autenticación, serialización y DTOs viven en la capa de API. Prohibido incrustar `fetch('/api/v1/guias')` sin prueba del endpoint publicado. Validar respuestas externas y errores; jamás exponer secretos en `VITE_*` (Vite las incluye en el bundle). Para sesiones, definir con el equipo si son cookies HttpOnly/SameSite o tokens; no seleccionar `localStorage` de tokens por defecto ni inventar refresh.

**Contrato vigente observado:** `GET /health`, prefijo previsto `/api/v1`, Swagger en `/docs`; sin rutas funcionales registradas. `docker-compose.yml` no equivale a un contrato de URL del navegador. Requiere decidir host/proxy/CORS con backend e infraestructura. Separar `mock` de `real` por adaptadores; ningún mock puede estar activo silenciosamente en producción.

## I.5 Ruta de trabajo SDD: diez puertas de calidad

| Etapa | Qué hace el equipo | Por qué así | Entregable verificable | Condición de avance / dueño propuesto |
|---|---|---|---|---|
| 00. Congelar decisiones | Aprobar alcance Phishing, conflictos DEC, rutas editables y criterios reescritos | Evita codificar contenido viejo o afectar backend | `scope.md`, `decision-log.md`, backlog actualizado | **PO Wilmer** firma alcance; Andrés/Carlos revisan. |
| 01. Constitución | Establecer principios SDD, accesibilidad, permisos y pruebas | Evita decisiones incoherentes entre sesiones Claude | `.specify/memory/constitution.md` y `CLAUDE.md` | Equipo acuerda reglas; no se implementa todavía. |
| 02. Arquitectura de información | Mapear visitantes, registrados, personal/admin, pantallas, rutas y estados | Reduce pantallas redundantes y pérdidas de contexto | `screens.md`, `user-flows.md`, wireframes | Todo Must tiene flujo o dependencia marcada. |
| 03. Sistema de diseño | Tokens, componentes, foco, tipografía, mascota, alto contraste, móvil | Reutilización y accesibilidad uniforme | `design-system.md`, `accessibility.md` + prototipos | Contrastes medidos, componentes con estados definidos. |
| 04. Contratos y arquitectura | Inspeccionar `dev`; escribir solo contratos observados/confirmados; mocks tipados | Desacopla frontend sin inventar APIs | `api-contracts.md`, `architecture.md`, `dependency-register.md` | Cada feature tiene contrato confirmado o estado `BLOCKED_API`. |
| 05. Especificar features | En Spec Kit: `spec` (qué), `plan` (cómo), `tasks` (orden), análisis | Requisitos explícitos antes del código | `specs/<feature>/spec.md`, `plan.md`, `tasks.md` | PO/UI revisan escenarios; cero requisitos críticos ambiguos. |
| 06. Preparar infraestructura FE | Adaptar scaffold existente, router, tokens, test runner, mock adapters | Base compartida y testable antes de módulos | PR de setup sólo frontend | `pnpm format:check`, `pnpm lint`, `pnpm build`, tests en verde. |
| 07. Implementar incrementalmente | Componente y flujo por vertical slice con referencias AC | PR pequeños y fácil detección de regresiones | Feature + pruebas + evidencia | Revisar todos los AC de la feature; mocks etiquetados. |
| 08. Integración real | Sustituir mocks por adapters de API confirmados y manejar 401/403/errores | Evitar «demo funcional» sin backend | Tests contract y E2E | Verificado contra backend en entorno acordado. |
| 09. QA integral | WCAG, teclado/lector, 360px, 200 %, Lighthouse/axe, seguridad y usabilidad | Población requiere accesibilidad real, no solo estética | Matriz de evidencia + defectos | Must del alcance aprobado completos o excepción formal. |
| 10. Entrega | README FE, manual, decisiones, PRs, CI y demo | Transferencia y mantenibilidad | Incremento revisado y desplegable | PO acepta; no abrir trabajo extra no autorizado. |

**Ejecución por vertical slices, no por pantalla aislada:**

1. Foundation: layout público, tokens, semántica, preferencia invitado (HU-36/37/38/39 transversal) y Ayuda visible (HU-28).
2. Catálogo (HU-03/09 + HU-11/12 si se aprueban): datos temporales explícitos o contrato real.
3. Guía (HU-10): ficha y motor de pasos + salida y deep link QR (HU-45).
4. Actividad (HU-21/25): cinco mensajes simulados seguros, feedback posterior a respuesta, guest flow.
5. Cuentas y progreso (HU-01/02/05/06/08/23/24): se integran según disponibilidad BE; no inferir API.
6. Ayuda y cola (HU-29/30/28; FAQ/glosario HU-33/34 si Should): polling ≤15 s.
7. CMS y panel (HU-04/13/14/15/22/31/32/35): interfaz administrativa por rol.
8. Mejoras (HU-07/40/41/42/43) sólo tras Must y decisión del PO; HU-44 Won't.

**Responsabilidades por frente (fuente `roles-y-responsabilidades.md`):** Andrés = frontend de guías, actividades, sesión/UI y progreso; Carlos = design system, accesibilidad, ayuda, QR y QA; Wilmer = PO e infraestructura/autenticación/cola; Esteban = contratos backend de guías/progreso/cuentas. Las asignaciones se revisan por historia porque el documento de roles trae IDs de otra versión.

**GitHub Flow:** tomar `dev` como base cuando esa sea la política acordada; rama de feature `feat/<issue>-<slug>`; PR **contra `dev`** si así lo aprueba el equipo; Conventional Commits y revisión de otro integrante; CI existente corre en `main`/`dev`. No hacer push directo ni a `dev` ni a `main`. El PR incluye IDs HU/AC, capturas de estados, pruebas ejecutadas, y declaración «Backend no modificado». No afirmar que la rama `dev` está protegida en todas las reglas: revisar permisos reales y política de PR.

## I.6 Definition of Ready (DoR), Definition of Done (DoD) y verificación

**DoR para cada feature:** historia canónica + criterios, estado Must/Should, resolución de DEC si afecta, contrato API versionado o mock temporal/impedimento formal, ruta y estados de UI, accesibilidad, ejemplos sin PII, casos de prueba diseñados y tareas partidas. Si falta un contrato, puede desarrollarse *sólo* la presentación y debe marcarse `MOCKED`, nunca `DONE_INTEGRATED`.

**DoD frontend mínimo:** todos los AC vigentes comprobados; pruebas de componentes para estados y formularios; E2E de recorrido principal; chequeo TypeScript/build/lint/format, acceso por teclado y lector, ancho 360 px/zoom 200 %, contraste medido, Lighthouse accesibilidad ≥90 + axe sin `serious`/`critical` (HU-38), ninguna credencial real, sin llamadas ficticias en producción, sin modificación BE, PR aprobado, evidencia enlazada en matriz. Las métricas de pruebas backend (cobertura de dominio, Prisma, guards) siguen siendo responsabilidad BE.

**Comandos ya existentes en `frontend/`**:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm build
```

`pnpm test` y `pnpm test:e2e` **no existen aún** según `frontend/package.json` observado. Añadir scripts y CI **después** de instalar/consensuar Vitest/Testing Library/Playwright. El job frontend en `.github/workflows/ci.yml` ya existe, pero test está comentado; modificar archivo compartido requiere revisión de infraestructura.

**Pruebas E2E críticas recomendadas:** invitado abre guía/actividad y recibe resultado; registrada se autentica/guarda progreso (si API lista); monitor toma/resuelve solicitud sin duplicarla; lector de pantalla anuncia error y feedback; a 360px con 200% no hay cortes; botón Ayuda está disponible; el panel no expone acciones admin a personal; QR abre guía sin registro. Validar estados `loading/empty/offline/403/404/500`, con mocks contractuales que se retirarán al conectar.

---
# PARTE II — Qué debe saber Claude Code para ejecutar SDD de forma óptima

## II.1 Información que no puede faltar al iniciar cada sesión

1. **Objetivo de producto y usuario:** Kamá enseña phishing a adultos mayores; lenguaje claro, aprendizaje paso a paso, dignidad y autonomía.
2. **Fuente vigente de alcance:** `docs/frontend/scope.md` + decisión PO; única categoría inicial Phishing; cinco guías; conflictos DEC documentados.
3. **Repo y branch:** monorepo `Carlosam7/plataforma-autoaprendizaje-clena-backend`, base `dev`, SHA del trabajo actual; **frontend scaffold existente**.
4. **Permisos estrictos:** puede leer BE; no escribir `backend/**`, `docker-compose.yml`, archivos CI/root sin autorización específica; prohibido borrar código de otro compañero.
5. **Stack confirmado vs candidato:** React, TS, Vite, pnpm confirmados; no instalar nuevas dependencias sin propuesta y verificación.
6. **Contrato real vs modelo documental:** backend visible actualmente expone sólo base `/api/v1`, health y Swagger; una entidad en Word no es un endpoint.
7. **Alcance exacto de la tarea:** HU/AC activos, `spec.md`, `plan.md`, `tasks.md`, archivos que se tocarán, pruebas obligatorias.
8. **Diseño accesible:** sistema de tokens, tamaño ≥18 px, targets ≥44 px, estado de foco, semántica HTML/ARIA, teclado, feedback accesible.
9. **Entornos:** URL API confirmada, CORS/proxy, mock/real toggle, variables públicas vs secretos, Docker/nginx ownership.
10. **Salida requerida:** archivos modificados, criterios satisfechos con evidencia, pruebas realmente ejecutadas, deuda, bloqueos y diferencias de la especificación.

**Orden de precedencia para Claude:** decisión formal PO > backlog vigente + criterios > contrato API implementado/observado para forma técnica de integración > constitución SDD y límites de escritura > especificación aprobada > plan y tareas > sugerencias de IA. Si una precedencia revela contradicción, pausar la acción específica y registrar `BLOCKED_DECISION`, no inventar una solución. Los principios de seguridad/accesibilidad no se reducen por capricho.

## II.2 Archivos recomendados, contenido mínimo y justificación

> **No crear todos como duplicados al instalar Spec Kit.** Primero ejecutar su instalador aprobado y revisar los nombres/rutas que genera; escribir solo los documentos propios de Kamá que faltan.

| Archivo en la raíz compartida (propuesto) | Contenido obligatorio | Justificación / carga en Claude |
|---|---|---|
| `CLAUDE.md` | Objetivo, límites de directorio, stack confirmado, mandatos de no backend, ubicación de fuentes y comandos de calidad | Reglas globales **breves** (recomendación <200 líneas) siempre presentes en la sesión. |
| `frontend/CLAUDE.md` | Patrones React/TS, HTML nativo/ARIA, organización FE, pruebas y estilos | Se carga cuando Claude trabaja sobre frontend; no contamina sesiones del backend. |
| `.specify/memory/constitution.md` | Principios SDD aprobados, puertas de calidad, restricciones de privacidad y DoD | Constitución para `/speckit-constitution`; no copiar completa en `CLAUDE.md`. |
| `docs/frontend/scope.md` | Producto, categoría inicial, cinco guías, Must/Should/Could/Won't y cambios aprobados | Evita que Claude implemente contenidos antiguos. |
| `docs/frontend/traceability.md` | Matriz HU ↔ AC ↔ feature ↔ test ↔ PR ↔ estado/evidencia | Cobertura objetiva: **ningún criterio huérfano**. |
| `docs/frontend/decisions.md` | ADR-001 Phishing y conflictos DEC-01...10 con fecha/aprobador | Facilita resolver cambios sin falsificar certezas. |
| `docs/frontend/screens.md` | Pantallas, rutas, roles, componentes, estados, redirecciones y accesibilidad | Define UX antes de programar. |
| `docs/frontend/user-flows.md` | Recorridos por rol en pasos con caminos de error y abandono | E2E alineados a interacción real. |
| `docs/frontend/design-system.md` | Tokens, tipografía, espaciado, marca/búho, variantes de componentes, foco, altos contrastes | Cohesión visual; por qué un color/tamaño se elige. |
| `docs/frontend/accessibility.md` | WCAG 2.2 AA, HTML, ARIA, foco, formularios, lector, 360 px, 200%, patrones permitidos/prohibidos | Fuente de reglas específicas de accesibilidad. |
| `docs/frontend/architecture.md` | Features, límites, rutas, estados remotos, mocks y autenticación | Prevé acoplamientos y duplicación. |
| `docs/frontend/api-contracts.md` | Por endpoint: estado confirmado/pendiente, método, ruta, auth, DTO, errores, ejemplos y fecha del Swagger/commit | Evita alucinación de endpoints; integración verificable. |
| `docs/frontend/dependencies.md` | API pendiente, responsable BE, fecha de solicitud, workaround/mock, desbloqueo | Permite avanzar sin declarar completadas historias bloqueadas. |
| `docs/frontend/content-phishing.md` | Objetivo de cada guía, pasos/escenarios, 5 mensajes simulados HU-25, tres reglas de oro, revisión pedagógica | Separa contenido de componentes. |
| `docs/frontend/testing.md` | Matriz de niveles de prueba, herramientas, CI, cobertura, manual QA y evidencias | DoD repetible y comprobable. |
| `specs/<id-feature>/spec.md` | HU/AC, escenarios de usuario, reglas, no objetivos, riesgos, estados y éxito | **Qué** se construye, sin implementación temprana. |
| `specs/<id-feature>/plan.md` | Arquitectura concreta FE, API, componentes, tipos, edge cases y plan de pruebas | **Cómo** se hará sin alterar BE. |
| `specs/<id-feature>/tasks.md` | Tareas atómicas `T001...`, archivos esperados, dependencia, AC y prueba de cierre | **Orden** ejecutable y trazable para Claude. |
| `specs/<id-feature>/checklists/*` | Revisión de accesibilidad, seguridad, contratos, criterios | Puerta de calidad antes de merge. |
| `.claude/skills/kama-accessibility/SKILL.md` | Procedimiento para auditar y arreglar accesibilidad de componentes React | Skill **procedimental**, se carga cuando se necesita. |
| `.claude/skills/kama-ui/SKILL.md` | Cómo transformar el design system en componentes, estados y evidencias | Estabiliza la implementación visual. |
| `.claude/skills/kama-api-integration/SKILL.md` | Inspección read-only, identificación de contratos y adapters con mocks rotulados | Evita inventar rutas, tokens o respuestas. |
| `.claude/skills/kama-acceptance/SKILL.md` | Generar tests desde criterios AC y producir tabla de cobertura | Control de verificación por historia. |
| `docs/frontend/README.md` | Cómo ejecutar, probar, construir y navegar el frontend; limitaciones conocidas | Transferencia al resto del equipo. |

**Evitar:** un `MASTER_PROMPT.md` gigante re-leído en cada turno, dos árboles de specs paralelos o Skills que reimplementen los comandos de Spec Kit. `CLAUDE.md` define reglas persistentes; **Skills** ejecutan procedimientos; las **specs** definen objetivos de cada feature; los **tests** verifican resultados.

## II.3 Instalación SDD en el repositorio existente (no ejecutada aquí)

Según documentación oficial de Spec Kit consultada en noviembre de 2026, la clave de Claude Code es `claude`. Se requiere revisar versiones de CLI y requisitos de Python/uv antes de usarlo. **Estos comandos son propuestas de ejecución para el equipo, no operaciones ya realizadas:**

```bash
# 1. Desde la raíz del repositorio existente (NO dentro de frontend/)
git status --short
git fetch origin
git switch dev
git pull --ff-only origin dev
git switch -c docs/kama-sdd-foundation

# 2. Herramientas disponibles: comprobar versiones reales
python --version
uv --version
claude --version

# 3. Instalar CLI oficial (pin de versión recomendado por equipo)
uv tool install specify-cli
specify --help

# 4. Previsualizar archivos antes de aceptar una instalación en repositorio no vacío
# ¡Respaldo/revisión del diff obligatorios! --force puede reemplazar rutas gestionadas.
specify init --here --force --integration claude

git status --short
git diff --stat
git diff -- .specify .claude CLAUDE.md
# Revisar con Wilmer/Carlos ANTES de hacer commit.
```

La documentación oficial advierte que `--force` puede reemplazar archivos gestionados que choquen con los nuevos; por eso **no se ejecuta a ciegas**, y se usa una rama de trabajo limpia. **No volver a inicializar Vite ni backend.** Los comandos de SDD de Claude varían por modo; tras instalar, consultar `specify integration list`, la integración Claude y la lista de Skills/comandos en el entorno real antes de invocarlos. Documentación: https://github.github.io/spec-kit/how-to/existing-projects.html , https://github.github.io/spec-kit/integrations/index.html .

### Flujo de Spec Kit (una vez por proyecto + por funcionalidad)

1. **Una vez:** constitución (`speckit-constitution`) basada en los acuerdos Kamá.
2. **Por funcionalidad pequeña:** especificar (`speckit-specify`), aclarar (`speckit-clarify`), planificar (`speckit-plan`), descomponer (`speckit-tasks`), analizar coherencia (`speckit-analyze`), implementar (`speckit-implement`) y comprobar convergencia (`speckit-converge`). Se repite implementación/convergencia hasta `Converged` y todas las pruebas **efectivamente pasadas**.
3. **Revisión humana:** entre `specify`, `plan`, `tasks` e `implement` hay puerta de aprobación. No pasar de una fase a otra por inercia.

En algunas instalaciones la invocación visible usa **puntos** (`/speckit.specify`); en otras, **guiones** (`/speckit-specify`). No asumir que el ejemplo es universal; usar lo que la instalación Claude exponga. Los comandos anteriores se invocan dentro del chat del agente, **no en terminal**. Fuente: https://github.github.io/spec-kit/integrations/cli.html .

## II.4 Ejemplo de `CLAUDE.md` global propuesto (texto listo para adaptar)

```markdown
# Kamá — reglas para Claude Code

Proyecto: plataforma educativa del CLENA para adultos mayores; primera entrega de phishing.
Repositorio compartido: frontend y backend en la misma raíz. Base de trabajo: dev.

## Rutas y permisos
- Backend (`backend/**`) es estrictamente de solo lectura.
- Editar únicamente `frontend/**`, `docs/frontend/**`, `specs/**` y archivos SDD aprobados.
- `docker-compose.yml`, `.github/**`, root scripts/lockfiles: solicitar permiso antes de editar.
- No crear endpoints, DTOs backend, migraciones, seeds, guards ni lógica NestJS.
- Leer información BE sólo para descubrir contratos reales.

## Fuentes
- Leer `docs/frontend/scope.md` antes de iniciar una feature.
- Consultar `docs/frontend/traceability.md` y spec de la HU asignada.
- No confundir el modelo Word con la implementación API.
- Registrar contradicciones en `docs/frontend/decisions.md`.

## Stack y consistencia
- El frontend ya existe en `frontend/`: React, TS, Vite, pnpm.
- No reinicializar frontend; no usar otro gestor ni cambiar herramientas sin aprobación.
- Preferir componentes React tipados, organizados por features.
- No hardcodear categoría, IDs, respuestas ni endpoints falsos en código productivo.
- Mocks sólo mediante adaptador y señalización explícita; no entregarlos como integrados.

## Accesibilidad
- Usar HTML semántico nativo antes que ARIA.
- Inputs con label; button real para acciones; foco visible; teclado completo.
- Texto base >=18 px, targets >=44×44, 360px, zoom 200%, alto contraste.
- ARIA sólo para complementar nombres, estados, relaciones y anuncios dinámicos.
- Sin PII real ni enlaces peligrosos en simulaciones phishing.

## Método SDD
- Antes de editar: identificar HU/AC, contrato, archivos y pruebas.
- Ejecutar SPEC -> PLAN -> TASKS -> ANÁLISIS -> IMPLEMENTACIÓN -> VERIFICACIÓN.
- Si falta API, declarar BLOCKED_API y aislar mock; no inventar integración.
- Para terminar, reportar cada AC con PASS / FAIL / BLOCKED y evidencia.
- Ejecutar desde frontend/ `pnpm format:check`, `pnpm lint`, `pnpm build`.
- No afirmar pruebas no ejecutadas ni hacer merge/push automáticamente.
```

**Importante:** lo anterior es una **plantilla de contenido**, no un archivo existente en el repositorio. Para que no moleste al equipo backend, agregar un `frontend/CLAUDE.md` específico con reglas React más extensas y dejar el root conciso.

## II.5 Skills personalizadas, alcance y contenidos

**Por qué no buscar 20 Skills públicas:** cuanto más superpuestas, más oportunidades para instrucciones contradictorias. Spec Kit provee el workflow SDD; cuatro Skills específicas aportan conocimientos de Kamá. Anthropic recomienda descripciones de disparo concretas, `SKILL.md` corto y referencias cargadas bajo demanda. Fuentes: https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more y https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices .

### Skill 1: accesibilidad

Ruta: `.claude/skills/kama-accessibility/SKILL.md`.

```yaml
---
name: kama-accessibility
description: Auditar o construir componentes React de Kamá para adultos mayores; usar al diseñar formularios, actividades, navegación, lector de guías o revisar WCAG, HTML semántico y ARIA.
---
```

**Cuerpo obligatorio:** leer `docs/frontend/accessibility.md`, inspeccionar componente actual, preferir HTML nativo, verificar foco/teclado/nombres, `aria-describedby` y feedback, comprobar 360px/200%/contrast, proponer pruebas Testing Library y axe, y emitir reporte por HU/AC. Prohibido inventar accesibilidad «aprobada» sin revisión manual.

### Skill 2: UI y diseño

Ruta: `.claude/skills/kama-ui/SKILL.md`; descripción dirigida a crear/editar UI Kamá. **Cuerpo:** leer design system y pantallas, consumir tokens, reutilizar componentes, implementar `loading/empty/error/focus/disabled`, no generar estética distinta en cada página, exigir captura móvil/escritorio/alto contraste, mantener la mascota opcional decorativa con `alt=""` si no añade información.

### Skill 3: contratos API

Ruta: `.claude/skills/kama-api-integration/SKILL.md`; descripción para consumo de backend. **Cuerpo:** inspección read-only del backend y Swagger, registrar ruta/método/auth/DTO/error en `api-contracts.md` con commit de fuente, generar types/adapters sólo del lado frontend, usar mock reversible si BE aún no publica, pruebas de contrato; reportar bloqueo sin crear endpoint NestJS.

### Skill 4: criterios y pruebas

Ruta: `.claude/skills/kama-acceptance/SKILL.md`; descripción para transformar AC en tests. **Cuerpo:** para cada `AC-HUxx-nn` generar test id `T-...`, clasificar tipo FE / integración / BE / contenido, ejecutar pruebas disponibles, detectar AC huérfanos, registrar PASS/FAIL/BLOCKED con evidencias PR, no marcar PASS por mock cuando exige API real.

**No editar archivos de Skill generados por Spec Kit**: personalizar los propios `kama-*`, y usar presets/overrides si se necesitan ajustes al workflow Spec Kit.

## II.6 Ejemplo de una especificación real: HU-10

**`specs/002-lector-guia/spec.md` (borrador):**

```markdown
# Lector de guías — HU-10
Estado: DRAFT hasta aprobación del PO.

## Objetivo
Como adulto mayor, ver una instrucción por vez sin perder la posición.

## Requisitos
- RQ-GUI-01: mostrar objetivo y número total de pasos.
- RQ-GUI-02: paso N de M; máximo 3 oraciones; imagen opcional con alt.
- RQ-GUI-03: botones Anterior/Siguiente usables con teclado.
- RQ-GUI-04: al finalizar, felicitación y actividad cuando exista.
- RQ-GUI-05: apertura de guía registrada mediante contrato backend real.

## No objetivos
- No editar pasos en vista pública.
- No modificar guías ni esquema backend.

## Validación
RQ-GUI-01 => AC-HU10-01 / E2E-GUI-01
RQ-GUI-02 => AC-HU10-02 / E2E-GUI-02
RQ-GUI-03 => AC-HU10-03 / E2E-GUI-03
RQ-GUI-04 => AC-HU10-04 / E2E-GUI-04
RQ-GUI-05 => AC-HU10-05 / INT-GUI-05 (BLOCKED_API si no existe)
```

**`plan.md`:** ruta pública propuesta `/guias/:id`, `GuidePage`, `GuideStepper`, `GuideStepContent`, `GuideCompletion`; carga por `guideService.get(id)` sólo tras contrato; URL/IDs exactos pendientes. Foco gestionado al cambiar paso; el paso se anuncia de forma apropiada sin excesivos `aria-live`.

**`tasks.md`:** `T001` crear DTO/viewmodel tipado a partir de contrato o mock; `T002` componente semántico de paso + test AC-02; `T003` navegación + test teclado AC-03; `T004` finalización + test AC-04; `T005` integración registro apertura + contract test AC-05; `T006` revisión axe/360/200 y evidencia. **No adelantar T005 si API no existe.**

## II.7 Contratos de interfaz: plantilla que Claude debe completar, no inventar

```markdown
## API-<ID> — <nombre de operación>
- Estado: OBSERVED / CONFIRMED_BY_BACKEND / MOCKED / BLOCKED_API
- Entorno y branch/commit consultado:
- Responsable BE y fecha de confirmación:
- HTTP method y path EXACTOS:
- Auth: visitante / usuario / personal / admin; credencial/cookie:
- Request: query/path/body; DTO real y validaciones:
- Response éxito: status, shape, ejemplo sanitizado:
- Error: status, shape, mensajes seguros:
- Paginación, filtro y orden si aplican:
- Side effects y reglas backend:
- Consumidor FE: feature, hook, vista:
- Pruebas de contrato y E2E:
- Fuente: enlace a Swagger, archivo TS del endpoint o PR BE:
```

**No convertir entidades `categoria`, `guia`, `paso`, `actividad`, `intento`, `solicitud_ayuda` del modelo documental en DTOs de API por inferencia:** pueden ser nombres de persistencia, no respuesta pública.

## II.8 Prompts de trabajo recomendados para Claude (secuenciales)

**Prompt A — Constitución:**

> Inspecciona únicamente las rutas existentes y los documentos del frontend Kamá. La rama base es dev, repositorio compartido. Crea/ajusta la constitución SDD con principios de accesibilidad, trazabilidad, no modificación de backend y contratos reales; antes de cualquier modificación muestra archivos potencialmente afectados. No implementes funcionalidades.

**Prompt B — Especificación de feature:**

> Trabaja sólo en HU-10, con los AC-HU10-01 a AC-HU10-05 del documento maestro. Produce spec.md con recorridos felices, vacíos, errores, accesibilidad y no objetivos. NO escribas código; marca como BLOCKED_API cualquier endpoint inexistente. Comprueba trazabilidad 1:1.

**Prompt C — Plan y tareas:**

> Genera plan.md y tasks.md para la feature aprobada, respetando `frontend/` existente, React/TS/Vite y pnpm. Lista archivos que tocarás, dependencias verificadas y prueba para cada AC. No propongas tocar `backend/**` o configuración compartida sin autorización. Detente al finalizar el plan.

**Prompt D — Implementación:**

> Implementa únicamente las tareas T001–T003 aprobadas del lector de guías. Usa componentes semánticos, tokens de Kamá y tests. No hagas push ni merge. Ejecuta las validaciones que existan y entrega tabla de AC con PASS/FAIL/BLOCKED, adjuntando resultados reales.

**Prompt E — Convergencia:**

> Compara spec.md, plan.md, tasks.md, diff y pruebas. Encuentra AC huérfanos, fallos de teclado/ARIA/contraste, llamadas a rutas inventadas y archivos BE modificados. No declares completada la feature mientras existan fallos o bloqueos de integración.

## II.9 Plantilla de matriz de trazabilidad viva

| ID HU | ID AC | Pantalla/componente | Requisito spec | Test | Estado | Evidencia PR | Dependencia BE/PO |
|---|---|---|---|---|---|---|---|
| HU-10 | AC-HU10-01 | Ficha/lector | RQ-GUI-01 | E2E-GUI-01 | TODO | — | Contrato guía |
| HU-10 | AC-HU10-02 | StepContent | RQ-GUI-02 | RTL-GUI-02 | TODO | — | Contrato pasos |
| HU-10 | AC-HU10-03 | Stepper | RQ-GUI-03 | E2E-GUI-03 | TODO | — | No |
| HU-10 | AC-HU10-04 | Completion | RQ-GUI-04 | E2E-GUI-04 | TODO | — | Actividad opcional |
| HU-10 | AC-HU10-05 | GuidePage | RQ-GUI-05 | INT-GUI-05 | BLOCKED_API | — | Tracking visitas |

**Estados permitidos**: `TODO`, `SPECIFIED`, `MOCKED`, `IN_PROGRESS`, `PASS_FE`, `PASS_INTEGRATED`, `BLOCKED_API`, `BLOCKED_DECISION`, `FAIL`, `DEFERRED_BY_PO`. Sólo `PASS_INTEGRATED` cuando el criterio exige servidor y se verifica con el servicio real; los criterios exclusivamente de presentación pueden llegar a `PASS_FE`.

## II.10 Política de cambios, seguridad y operación

- Claude se ejecuta preferentemente desde la raíz compartida para localizar specs, pero toda escritura de código se limita a `frontend/**`.
- No ejecutar auto-fix masivo del repositorio (`format .` desde raíz), limpieza agresiva, `rm -rf` o scripts que modifiquen bases de datos.
- Al instalar dependencias trabajar bajo `frontend/` con pnpm y revisar `pnpm-lock.yaml` del frontend.
- Archivos de entorno con valores de ejemplo; no subir claves, OTP reales, tokens, teléfonos reales, cédulas ni datos de usuarios.
- Los QR deben enlazar rutas de lectura pública y nunca incluir credenciales.
- Simulaciones de phishing: bancos y familiares ficticios, sin hyperlinks activos ni sitios externos engañosos; imágenes con «simulado» cuando corresponda.
- Para 401/403 mostrar mensajes comprensibles; no resolver autorización sólo ocultando un botón.
- El backend decide la calificación, la corrección y reglas de aprobación; **nunca distribuir `es_correcta` antes de responder**.
- Si el backend no está listo, permitir demo aislada con datos ficticios y etiqueta `MOCK MODE`; no dar la HU como integrada.
- Revisar PR con otro compañero, demostración accesible y vínculo al AC. Sin cambios directos a `main`/`dev`.

## II.11 Riesgos e hitos para coordinación

| Riesgo | Señal | Respuesta |
|---|---|---|
| API aún no implementada | Swagger sólo tiene health o los DTOs cambian | `BLOCKED_API`; adapter mock, contrato con dueño y fecha, integración posterior. |
| Cambio de contenido | AC-HU17–20 exigen antiguos temas | PO publica nuevo texto; FE reutiliza `GuideCard/Stepper`. |
| Claude cambia BE | Diff incluye `backend/` u otros archivos protegidos | Rechazar cambios, restaurar sólo mediante revisión segura; no fusionar PR. |
| Estilo inconsistente | Variantes aleatorias de botón/carta | Tokens obligatorios y Story/Component QA. |
| Accesibilidad superficial | Lighthouse pasa, pero foco/lector falla | Pruebas manuales y criterios HU-36/37/38/39 en cada PR. |
| Mock confundido con implementación | No hay API real pero vista parece completa | Etiquetar estado `MOCKED`; prohibir salida a producción con mocks ocultos. |
| CI compartido | Cambios frontend rompen jobs backend | PR infraestructura separado y coordinado; revisar ambos jobs. |
| Confusión de IDs | Sprint/planning con HU desplazadas | Canonizar HU del backlog y mapping a issues. |

**Reunión de inicio sugerida (sin necesidad de esperar para redactar specs):** aprobar DEC-01/02/03, elegir librerías frontend, elegir almacenamiento de sesiones según BE, y pactar el contrato mínimo de catálogo/guía/actividad. **Criterio de éxito de la metodología:** toda HU implementada tiene criterio verificado, evidencia y responsable; ninguna funcionalidad existe sólo porque Claude la imaginó.

---
# ANEXO A — Trazabilidad exhaustiva de 45 historias y 151 criterios originales

Este anexo preserva el texto de los **criterios de aceptación originales** del backlog adjunto (incluidas expresiones imprecisas o que ya contradicen la decisión Phishing). **No modifica silenciosamente** el compromiso del PO. Junto a cada criterio está la **evidencia propuesta para el frontend** o la dependencia fuera del frontend. Es una matriz *propuesta* hasta que el PO apruebe el cambio de contenido y la rama avance.

**Convenciones:** `AC-HUxx-nn` = criterio original; `FE` = interfaz/test cliente; `BE` = sólo servidor/infraestructura; `CONTENIDO` = guías/semillas; `PO` = decisión; `MOCK` = prueba de UI aún no integrada. Cada criterio tiene un verificador sugerido; esto **no significa que el test ya exista ni que pase**. Las prioridades y puntos reflejan el backlog adjunto, no se recalculan tras el cambio de alcance.

### Épica 1 — Cuentas, roles y privacidad

#### HU-01 — Registro con consentimiento

- **Historia original:** Como visitante de la Sala de Internet quiero crear una cuenta con mi nombre para guardar mi progreso entre visitas.
- **Backlog:** Must · 5 puntos · sprint 1.

**AC-HU01-01 — Criterio original (literal):** Dado que estoy en la pantalla de registro, deberé ingresar mi nombre, número de identificación, fecha de nacimiento, teléfono y/o correo, y aceptando las políticas de privacidad, entonces se crea mi cuenta con rol de usuario público y queda con la sesión iniciada.

- **Verificación / traducción frontend:** Formulario accesible recoge nombre, identificación, fecha de nacimiento y al menos un contacto; se acepta consentimiento explícito; tras verificación y respuesta válida, se muestra sesión iniciada. **Dependencia BE:** alta, envío y verificación de código y tokens.
- **Caso de prueba propuesto:** `T-AC-HU01-01` · estado inicial: `TODO`. 

**AC-HU01-02 — Criterio original (literal):** Dado que no marcó la casilla de consentimiento, cuando intento registrarme, entonces el sistema no crea la cuenta y me explica que debo aceptar el aviso.

- **Verificación / traducción frontend:** Intentar enviar sin consentimiento: botón o validación impide alta y explica el requisito; comprobar que no se hace la mutación.
- **Caso de prueba propuesto:** `T-AC-HU01-02` · estado inicial: `TODO`. 

**AC-HU01-03 — Criterio original (literal):** Dado que el teléfono ya está registrado en otra cuenta, cuando intento registrarme con él, entonces veo el mensaje “Ese teléfono ya está en uso, prueba con otro”.

- **Verificación / traducción frontend:** Simular respuesta de contacto telefónico duplicado: mostrar el texto exigido sin perder valores ya ingresados.
- **Caso de prueba propuesto:** `T-AC-HU01-03` · estado inicial: `TODO`. 

**AC-HU01-04 — Criterio original (literal):** Dado que el correo ya está registrado en otra cuenta, cuando intento registrarme con él, entonces veo el mensaje “Ese correo ya está en uso, prueba con otro”.

- **Verificación / traducción frontend:** Simular correo duplicado: mostrar el texto exigido y enfocar el campo pertinente.
- **Caso de prueba propuesto:** `T-AC-HU01-04` · estado inicial: `TODO`. 

**AC-HU01-05 — Criterio original (literal):** Dado que mi número de identificación está registrado, cuando intento registrarme con él, entonces veo el mensaje “Este usuario ya tiene una cuenta”.

- **Verificación / traducción frontend:** Simular identificación duplicada: mostrar el texto exigido y opción de acceso.
- **Caso de prueba propuesto:** `T-AC-HU01-05` · estado inicial: `TODO`. 

**AC-HU01-06 — Criterio original (literal):** Se le enviará al usuario un código a su correo o a su teléfono para validar y poder registrarse.

- **Verificación / traducción frontend:** Flujo de dos pasos solicita y verifica código por canal elegido; errores, reenvío y vencimiento conforme a contrato **pendiente**.
- **Caso de prueba propuesto:** `T-AC-HU01-06` · estado inicial: `TODO`. 

#### HU-02 — Inicio de sesión con sesión persistente

- **Historia original:** Como usuario registrado quiero iniciar sesión con mi identificación con teléfono o correo para continuar con mis guías y actividades.
- **Backlog:** Must · 3 puntos · sprint 1.

**AC-HU02-01 — Criterio original (literal):** Dado que ingreso correctamente mi número de identificación junto mi correo o mi teléfono, entonces recibo un código a mi correo o a mi teléfono y lo digito en la plataforma para poder entrar a mi página de inicio.

- **Verificación / traducción frontend:** Formulario de identificación + correo o teléfono, pantalla de OTP, entrada con código válido; no anticipar API.
- **Caso de prueba propuesto:** `T-AC-HU02-01` · estado inicial: `TODO`. 

**AC-HU02-02 — Criterio original (literal):** Dado que mis datos son incorrectos, cuando inicio sesión, entonces veo «Credenciales inválidas», sin indicar cuál de los dos falló.

- **Verificación / traducción frontend:** Error genérico de credenciales; nunca revelar qué factor falló.
- **Caso de prueba propuesto:** `T-AC-HU02-02` · estado inicial: `TODO`. 

**AC-HU02-03 — Criterio original (literal):** Dado que inicié sesión, recibo un access token y refresh token, si mi access token venció, cuando sigo usando la aplicación, entonces se renueva con el refresh token sin sacarme de lo que estaba haciendo.

- **Verificación / traducción frontend:** Expiración simulada del access token: recuperar sesión por método acordado con BE, reintentar operación sin pérdida del estado; pruebas de rotación **BE**.
- **Caso de prueba propuesto:** `T-AC-HU02-03` · estado inicial: `TODO`. 

**AC-HU02-04 — Criterio original (literal):** Dado que presiono «Cerrar sesión», entonces el refresh token se invalida y vuelvo a la pantalla de inicio.

- **Verificación / traducción frontend:** Cerrar sesión limpia el estado cliente, invoca cierre del servidor si está disponible y redirige; invalidación de refresh corresponde a BE.
- **Caso de prueba propuesto:** `T-AC-HU02-04` · estado inicial: `TODO`. 

**AC-HU02-05 — Criterio original (literal):** Dado que intento entrar a una ruta que mi rol no permite, entonces el backend responde 403 y el frontend me lleva a una página con un mensaje claro.

- **Verificación / traducción frontend:** Acceso directo a URL no permitida muestra página 403; verificar protección de navegación, la autorización real corresponde a BE.
- **Caso de prueba propuesto:** `T-AC-HU02-05` · estado inicial: `TODO`. 

#### HU-03 — Usar la plataforma sin cuenta

- **Historia original:** Como visitante que llega por primera vez quiero leer las guías sin tener que registrarme para empezar a aprender de inmediato.
- **Backlog:** Must · 2 puntos · sprint 1.

**AC-HU03-01 — Criterio original (literal):** Dado que no he iniciado sesión, cuando abro la plataforma, entonces puedo ver categorías, guías y la ayuda.

- **Verificación / traducción frontend:** Abrir la web sin sesión y acceder a categoría Phishing, sus guías y Ayuda.
- **Caso de prueba propuesto:** `T-AC-HU03-01` · estado inicial: `TODO`. 

**AC-HU03-02 — Criterio original (literal):** Dado que no he iniciado sesión, cuando termino una actividad, entonces veo mi resultado y una invitación opcional a crear cuenta para guardar el progreso.

- **Verificación / traducción frontend:** Terminar práctica como invitado y ver resultado más CTA opcional; no guardar progreso personal.
- **Caso de prueba propuesto:** `T-AC-HU03-02` · estado inicial: `TODO`. 

**AC-HU03-03 — Criterio original (literal):** Dado que no he iniciado sesión, cuando intento una acción que requiere cuenta, entonces veo una invitación a registrarse sin perder lo que estaba haciendo. (La ayuda presencial sin cuenta se cubre en HU-29.)

- **Verificación / traducción frontend:** Intentar guardar progreso: invitación no bloqueante y conservación del contexto local para volver tras autenticarse si es viable.
- **Caso de prueba propuesto:** `T-AC-HU03-03` · estado inicial: `TODO`. 

#### HU-04 — Gestión de cuentas del personal

- **Historia original:** Como administrador quiero crear, editar y desactivar cuentas del personal del CLENA para controlar quién puede modificar el contenido y atender solicitudes.
- **Backlog:** Must · 5 puntos · sprint 1.

**AC-HU04-01 — Criterio original (literal):** Dado que soy administrador, cuando creo una cuenta con nombre, correo y contraseña temporal, entonces la cuenta queda activa.

- **Verificación / traducción frontend:** Formulario de alta de personal con nombre, correo y contraseña temporal; listado actualizado tras confirmación API.
- **Caso de prueba propuesto:** `T-AC-HU04-01` · estado inicial: `TODO`. 

**AC-HU04-02 — Criterio original (literal):** Dado que un monitor deja de trabajar en el CLENA, cuando desactivo su cuenta, entonces ya no puede iniciar sesión, pero sus registros históricos se conservan.

- **Verificación / traducción frontend:** Desactivar desde la tabla con confirmación; se representa estado inactivo; conservación de historial se verifica con BE.
- **Caso de prueba propuesto:** `T-AC-HU04-02` · estado inicial: `TODO`. 

**AC-HU04-03 — Criterio original (literal):** Dado que una cuenta tiene contraseña temporal, cuando su dueño inicia sesión por primera vez, entonces el sistema le pide cambiarla verificando su identidad con un mensaje a su correo electrónico.

- **Verificación / traducción frontend:** Primer acceso solicita cambio de clave y verificación por correo cuando lo indica la API.
- **Caso de prueba propuesto:** `T-AC-HU04-03` · estado inicial: `TODO`. 

**AC-HU04-04 — Criterio original (literal):** Dado que no soy administrador, cuando intento acceder a esta gestión, entonces el sistema lo impide.

- **Verificación / traducción frontend:** Ocultar rutas/acciones a no administradores y mostrar 403 ante navegación directa.
- **Caso de prueba propuesto:** `T-AC-HU04-04` · estado inicial: `TODO`. 

**AC-HU04-05 — Criterio original (literal):** El script de semillas crea un administrador inicial con credenciales tomadas de variables de entorno.

- **Verificación / traducción frontend:** **Sólo BE:** semilla de administrador mediante entorno; FE verifica que una cuenta válida pueda entrar, sin generar semillas.
- **Caso de prueba propuesto:** `T-AC-HU04-05` · estado inicial: `TODO`. 

#### HU-05 — Eliminar mi cuenta

- **Historia original:** Como usuario registrado quiero eliminar mi cuenta y mis datos para ejercer mi derecho de supresión.
- **Backlog:** Must · 3 puntos · sprint 1.

**AC-HU05-01 — Criterio original (literal):** Dado que estoy en mi perfil, cuando elijo «Eliminar mi cuenta», entonces el sistema me explica qué se borrará y me pide confirmar con correo o mi teléfono

- **Verificación / traducción frontend:** Vista de perfil advierte qué se suprime y muestra paso de confirmación por correo/teléfono.
- **Caso de prueba propuesto:** `T-AC-HU05-01` · estado inicial: `TODO`. 

**AC-HU05-02 — Criterio original (literal):** Dado que confirmo, entonces se borran mis datos personales y mi progreso, y se cierra mi sesión.

- **Verificación / traducción frontend:** Tras confirmación exitosa API, limpiar sesión y navegar a portada; borrado real de datos/progreso es BE.
- **Caso de prueba propuesto:** `T-AC-HU05-02` · estado inicial: `TODO`. 

**AC-HU05-03 — Criterio original (literal):** Las estadísticas agregadas (por ejemplo, cuántas veces se consultó una guía) se conservan sin datos que me identifiquen.

- **Verificación / traducción frontend:** **Sólo BE:** anonimización de estadísticas; FE no envía PII en reportes y documenta prueba de contrato.
- **Caso de prueba propuesto:** `T-AC-HU05-03` · estado inicial: `TODO`. 

#### HU-06 — Iniciar sesión como personal del CLENA

- **Historia original:** Como personal del CLENA quiero poder iniciar sesión con mi correo y contraseña para administrar la plataforma
- **Backlog:** Must · 3 puntos · sprint 1.

**AC-HU06-01 — Criterio original (literal):** Dado que registre correctamente mi correo y contraseña ya creados, se me enviará un código de verificación al correo para poder iniciar sesión

- **Verificación / traducción frontend:** Formulario de correo + contraseña del personal; flujo de código por correo con estados de espera, reenviar y errores según API.
- **Caso de prueba propuesto:** `T-AC-HU06-01` · estado inicial: `TODO`. 

**AC-HU06-02 — Criterio original (literal):** Dado que registré incorrectamente mi correo o mi contraseña, se me mostrará un mensaje diciendo: “Credenciales incorrectas”

- **Verificación / traducción frontend:** Mensaje genérico «Credenciales incorrectas» para error de acceso, sin desglosar factor.
- **Caso de prueba propuesto:** `T-AC-HU06-02` · estado inicial: `TODO`. 

#### HU-07 — Restablecimiento de contraseña para personal del CLENA

- **Historia original:** Como personal del CLENA que olvidó su contraseña y tengo el correo quiero poder restablecer mi contraseña para no perder mi cuenta.
- **Backlog:** Should · 2 puntos · sprint no asignado.

**AC-HU07-01 — Criterio original (literal):** Dado que tengo un correo asociado, me llegará un correo con un código único que verifique mi identidad y en la plataforma se me habilitará la opción de poder cambiar la contraseña.

- **Verificación / traducción frontend:** Recuperación de contraseña: solicitar código por correo, introducir código, nueva clave y confirmación; estados y reglas de API pendientes.
- **Caso de prueba propuesto:** `T-AC-HU07-01` · estado inicial: `TODO`. 

#### HU-08 — Perfil y preferencias

- **Historia original:** Como usuario registrado quiero guardar mis preferencias de tamaño de letra, contraste y nivel de experiencia para no tener que configurarlas en cada visita.
- **Backlog:** Should · 2 puntos · sprint no asignado.

**AC-HU08-01 — Criterio original (literal):** Dado que cambio mis preferencias, cuando cierro sesión y vuelvo a entrar desde otro computador, entonces se aplican automáticamente.

- **Verificación / traducción frontend:** Modificar letra/contraste/nivel; cerrar y abrir sesión y comprobar recuperación desde perfil por API, sin asumir endpoint.
- **Caso de prueba propuesto:** `T-AC-HU08-01` · estado inicial: `TODO`. 

**AC-HU08-02 — Criterio original (literal):** Dado que estoy en mi perfil, entonces puedo editar mi nombre y mi correo opcional.

- **Verificación / traducción frontend:** Editar nombre y correo opcional y presentar cambios guardados/errores accesibles.
- **Caso de prueba propuesto:** `T-AC-HU08-02` · estado inicial: `TODO`. 

### Épica 2 — Catálogo de guías

#### HU-09 — Explorar guías por categoría

- **Historia original:** Como visitante con poca experiencia digital quiero ver las guías organizadas por categoría con íconos y nombres claros para encontrar rápido lo que necesito aprender.
- **Backlog:** Must · 3 puntos · sprint 1.

**AC-HU09-01 — Criterio original (literal):** Dado que abro la plataforma, entonces la página de inicio muestra las categorías como botones grandes con ícono y texto.

- **Verificación / traducción frontend:** Portada presenta categoría Phishing como acción grande con icono y texto; opcionalmente cinco guías visibles sin salto extra, con acceso a la categoría.
- **Caso de prueba propuesto:** `T-AC-HU09-01` · estado inicial: `TODO`. 

**AC-HU09-02 — Criterio original (literal):** Dado que elijo una categoría, entonces veo sus guías publicadas con título, nivel y duración estimada.

- **Verificación / traducción frontend:** Al seleccionar Phishing, mostrar sólo guías PUBLICADAS y sus título, nivel y duración.
- **Caso de prueba propuesto:** `T-AC-HU09-02` · estado inicial: `TODO`. 

**AC-HU09-03 — Criterio original (literal):** Dado que una categoría no tiene guías publicadas, entonces se muestra el mensaje «Pronto habrá guías en esta sección» en lugar de una pantalla vacía.

- **Verificación / traducción frontend:** Estado vacío con mensaje literal y acción de ayuda, tanto con lista vacía como sin publicadas.
- **Caso de prueba propuesto:** `T-AC-HU09-03` · estado inicial: `TODO`. 

#### HU-10 — Seguir una guía paso a paso

- **Historia original:** Como adulto mayor quiero ver una guía con un paso a la vez, con texto corto e imágen para seguir las instrucciones sin perderme.
- **Backlog:** Must · 5 puntos · sprint 1.

**AC-HU10-01 — Criterio original (literal):** Dado que abro una guía, entonces veo primero su objetivo («Al terminar sabrás...») y el número total de pasos.

- **Verificación / traducción frontend:** Pantalla inicial de la guía informa objetivo y número total de pasos.
- **Caso de prueba propuesto:** `T-AC-HU10-01` · estado inicial: `TODO`. 

**AC-HU10-02 — Criterio original (literal):** Dado que estoy en un paso, entonces veo su número («Paso 2 de 6»), una instrucción de máximo tres oraciones y, si existe, una imagen con texto alternativo.

- **Verificación / traducción frontend:** Paso N de M, instrucción de máximo tres oraciones, imagen opcional y alt no vacío cuando informativa.
- **Caso de prueba propuesto:** `T-AC-HU10-02` · estado inicial: `TODO`. 

**AC-HU10-03 — Criterio original (literal):** Dado que estoy en un paso, entonces tengo botones grandes «Anterior» y «Siguiente», y puedo usarlos también con el teclado.

- **Verificación / traducción frontend:** Anterior/Siguiente con controles nativos de tamaño mínimo, teclado, primera/última posición protegidas.
- **Caso de prueba propuesto:** `T-AC-HU10-03` · estado inicial: `TODO`. 

**AC-HU10-04 — Criterio original (literal):** Dado que llego al último paso, entonces veo un mensaje de felicitación y la invitación a practicar con la actividad de la guía, si tiene una.

- **Verificación / traducción frontend:** Final muestra felicitación y CTA a actividad si existe; sin actividad muestra finalización simple.
- **Caso de prueba propuesto:** `T-AC-HU10-04` · estado inicial: `TODO`. 

**AC-HU10-05 — Criterio original (literal):** Cada apertura de una guía queda registrada para las estadísticas del panel (HU-31), sin datos personales si el usuario no inició sesión.

- **Verificación / traducción frontend:** Abrir guía invoca mecanismo de registro si API lo exige; estadística anónima sin sesión verificada **BE**.
- **Caso de prueba propuesto:** `T-AC-HU10-05` · estado inicial: `TODO`. 

#### HU-11 — Buscar guías por palabra

- **Historia original:** Como visitante quiero escribir lo que quiero hacer, por ejemplo «mandar foto», para encontrar la guía sin recorrer todas las categorías.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU11-01 — Criterio original (literal):** Dado que escribo una palabra, cuando busco, entonces veo las guías cuyo título, descripción o palabras clave la contienen.

- **Verificación / traducción frontend:** Buscar por palabra y verificar coincidencias en título/descripción/palabras clave usando respuesta servidor; estados cargando/error.
- **Caso de prueba propuesto:** `T-AC-HU11-01` · estado inicial: `TODO`. 

**AC-HU11-02 — Criterio original (literal):** Dado que escribo con errores de tilde o mayúsculas («correo electronico»), entonces la búsqueda encuentra igual los resultados.

- **Verificación / traducción frontend:** Buscar sin tilde y con mayúsculas da mismo resultado; normalización en BE, FE no la presupone.
- **Caso de prueba propuesto:** `T-AC-HU11-02` · estado inicial: `TODO`. 

**AC-HU11-03 — Criterio original (literal):** Dado que no hay resultados, entonces veo sugerencias de categorías y la opción de pedir ayuda presencial.

- **Verificación / traducción frontend:** Sin resultados: mensaje, sugerencia y acceso a ayuda presencial.
- **Caso de prueba propuesto:** `T-AC-HU11-03` · estado inicial: `TODO`. 

#### HU-12 — Filtrar guías por nivel

- **Historia original:** Como usuario nuevo quiero filtrar las guías por nivel básico, intermedio o avanzado para empezar por las que corresponden a mi experiencia.
- **Backlog:** Should · 2 puntos · sprint no asignado.

**AC-HU12-01 — Criterio original (literal):** Dado que estoy en una categoría, cuando elijo un nivel, entonces solo veo las guías de ese nivel.

- **Verificación / traducción frontend:** Selector de nivel filtra guías de la categoría conforme a parámetros documentados.
- **Caso de prueba propuesto:** `T-AC-HU12-01` · estado inicial: `TODO`. 

**AC-HU12-02 — Criterio original (literal):** Dado que tengo un nivel guardado en mi perfil (HU-08), entonces ese filtro viene aplicado por defecto y puedo quitarlo.

- **Verificación / traducción frontend:** Aplicar nivel guardado cuando se recuperan preferencias; permitir quitar y recuperar listado completo.
- **Caso de prueba propuesto:** `T-AC-HU12-02` · estado inicial: `TODO`. 

#### HU-13 — Crear y editar guías

- **Historia original:** Como personal del CLENA quiero crear y editar guías con sus pasos desde un formulario para mantener el contenido actualizado sin depender de programadores.
- **Backlog:** Must · 8 puntos · sprint 2.

**AC-HU13-01 — Criterio original (literal):** Dado que soy personal, cuando creo una guía, entonces ingreso título, objetivo, categoría, nivel, duración estimada y palabras clave.

- **Verificación / traducción frontend:** Formulario de personal para título, objetivo, categoría Phishing, nivel, duración y palabras clave; validar.
- **Caso de prueba propuesto:** `T-AC-HU13-01` · estado inicial: `TODO`. 

**AC-HU13-02 — Criterio original (literal):** Dado que edito una guía, entonces puedo agregar, editar y eliminar pasos, cada uno con instrucción de texto e imagen opcional.

- **Verificación / traducción frontend:** Editor de lista ordenada de pasos con alta, cambio, eliminación e imagen opcional.
- **Caso de prueba propuesto:** `T-AC-HU13-02` · estado inicial: `TODO`. 

**AC-HU13-03 — Criterio original (literal):** Dado que dejo un campo obligatorio vacío, entonces el formulario me indica cuál falta antes de guardar.

- **Verificación / traducción frontend:** Intentar guardar campos obligatorios vacíos: error asociado a campo con etiqueta y foco.
- **Caso de prueba propuesto:** `T-AC-HU13-03` · estado inicial: `TODO`. 

**AC-HU13-04 — Criterio original (literal):** Toda guía nueva se crea en estado borrador y no es visible al público hasta publicarla (HU-15).

- **Verificación / traducción frontend:** Crear y verificar etiqueta BORRADOR; el catálogo público no lo muestra.
- **Caso de prueba propuesto:** `T-AC-HU13-04` · estado inicial: `TODO`. 

**AC-HU13-05 — Criterio original (literal):** Cada guía guarda quién la creó, quién la editó por última vez y cuándo.

- **Verificación / traducción frontend:** Mostrar metadatos de autor/edición si contrato los entrega; persistencia y auditoría corresponden a BE.
- **Caso de prueba propuesto:** `T-AC-HU13-05` · estado inicial: `TODO`. 

#### HU-14 — Agregar imágenes a los pasos

- **Historia original:** Como personal del CLENA quiero subir una captura de pantalla a cada paso para que el usuario vea exactamente dónde hacer clic.
- **Backlog:** Should · 5 puntos · sprint no asignado.

**AC-HU14-01 — Criterio original (literal):** Dado que edito un paso, cuando subo una imagen PNG, JPG o WEBP de máximo 5 MB, entonces queda asociada al paso.

- **Verificación / traducción frontend:** Seleccionar PNG/JPG/WEBP de hasta 5 MB, previsualizar y enlazar el archivo devuelto por API.
- **Caso de prueba propuesto:** `T-AC-HU14-01` · estado inicial: `TODO`. 

**AC-HU14-02 — Criterio original (literal):** Dado que subo un archivo de otro tipo o más pesado, entonces el sistema lo rechaza con un mensaje claro.

- **Verificación / traducción frontend:** Rechazar inmediatamente tipo/tamaño incorrectos y mostrar rechazo del servidor si aplica.
- **Caso de prueba propuesto:** `T-AC-HU14-02` · estado inicial: `TODO`. 

**AC-HU14-03 — Criterio original (literal):** Dado que subo una imagen, entonces debo escribir un texto alternativo para lectores de pantalla.

- **Verificación / traducción frontend:** Exigir campo de texto alternativo y mostrarlo donde corresponda.
- **Caso de prueba propuesto:** `T-AC-HU14-03` · estado inicial: `TODO`. 

**AC-HU14-04 — Criterio original (literal):** El almacenamiento de archivos se implementa mediante un proveedor externo de almacén de objetos

- **Verificación / traducción frontend:** **Sólo BE/infra:** proveedor de objetos; FE consume mecanismo aprobado (URL firmada o upload API), sin implementarlo.
- **Caso de prueba propuesto:** `T-AC-HU14-04` · estado inicial: `TODO`. 

#### HU-15 — Publicar, ocultar y reordenar guías

- **Historia original:** Como personal del CLENA quiero publicar u ocultar guías y cambiar el orden de los pasos para controlar qué ve el público y corregir el contenido.
- **Backlog:** Must · 3 puntos · sprint 2.

**AC-HU15-01 — Criterio original (literal):** Dado que una guía está en borrador y tiene al menos un paso, cuando la publico, entonces aparece en el catálogo público.

- **Verificación / traducción frontend:** Publicar borrador con >=1 paso; mostrar estado y refrescar catálogo, impidiendo acción sin pasos visibles.
- **Caso de prueba propuesto:** `T-AC-HU15-01` · estado inicial: `TODO`. 

**AC-HU15-02 — Criterio original (literal):** Dado que oculto una guía publicada, entonces desaparece del catálogo, pero el progreso de los usuarios en ella se conserva.

- **Verificación / traducción frontend:** Ocultar y verificar ausencia pública; conservación de progreso depende del backend.
- **Caso de prueba propuesto:** `T-AC-HU15-02` · estado inicial: `TODO`. 

**AC-HU15-03 — Criterio original (literal):** Dado que reordeno los pasos, entonces el nuevo orden se refleja inmediatamente en la vista pública.

- **Verificación / traducción frontend:** Reordenar pasos por botones subir/bajar accesibles y verificar orden reflejado al consultar guía pública.
- **Caso de prueba propuesto:** `T-AC-HU15-03` · estado inicial: `TODO`. 

#### HU-16 — Gestionar categorías

- **Historia original:** Como administrador quiero editar el nombre, ícono y orden de las categorías para adaptarlas a las necesidades de la sala.
- **Backlog:** Should · 2 puntos · sprint no asignado.

- **CONFLICTO DOCUMENTAL:** backlog Should vs modelo Won’t; propuesto DEFERRED_BY_PO.

**AC-HU16-01 — Criterio original (literal):** Dado que soy administrador, entonces puedo crear, editar y reordenar categorías.

- **Verificación / traducción frontend:** **Pendiente de alcance:** si PO reactiva HU-16, administración de categorías con form y orden accesibles.
- **Caso de prueba propuesto:** `T-AC-HU16-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU16-02 — Criterio original (literal):** Dado que una categoría tiene guías, cuando intento eliminarla, entonces el sistema lo impide y me pide moverlas primero.

- **Verificación / traducción frontend:** **Pendiente de alcance/BE:** intento de borrar categoría con guías muestra explicación del servidor.
- **Caso de prueba propuesto:** `T-AC-HU16-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU16-03 — Criterio original (literal):** Las cinco categorías del alcance mínimo vienen creadas en las semillas.

- **Verificación / traducción frontend:** **Sustituido por decisión reciente:** sólo Phishing inicial; no crear cinco categorías antiguas.
- **Caso de prueba propuesto:** `T-AC-HU16-03` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

#### HU-17 — Contenido: correo electrónico

- **Historia original:** Como adulto mayor quiero guías para crear un correo, escribir, adjuntar una foto y responder para comunicarme con mi familia y con entidades.
- **Backlog:** Must · 3 puntos · sprint 2.

- **CAMBIO DE ALCANCE:** AC antiguos de correo no corresponden a Phishing; necesitan sustitución formal PO.

**AC-HU17-01 — Criterio original (literal):** Las semillas incluyen al menos tres guías publicadas de correo: crear una cuenta, enviar un mensaje con adjunto y responder o reenviar.

- **Verificación / traducción frontend:** **Criterio antiguo no vigente sin aprobación:** no producir interfaz ni semilla de correo como parte de las cinco guías de phishing.
- **Caso de prueba propuesto:** `T-AC-HU17-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU17-02 — Criterio original (literal):** Algunas guías tienen al menos una pregunta de práctica asociada (E3).

- **Verificación / traducción frontend:** **Criterio de contenido pendiente de sustitución:** si se aprueba nueva guía, verificar que tenga práctica asociada cuando corresponda.
- **Caso de prueba propuesto:** `T-AC-HU17-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

#### HU-18 — Contenido: documentos de texto

- **Historia original:** Como adulto mayor quiero guías para crear, escribir, guardar y abrir un documento de texto para escribir cartas o trámites por mi cuenta.
- **Backlog:** Must · 3 puntos · sprint 2.

- **CAMBIO DE ALCANCE:** AC antiguos de documentos no corresponden a Phishing; necesitan sustitución formal PO.

**AC-HU18-01 — Criterio original (literal):** Las semillas incluyen al menos tres guías de documentos: crear y escribir, guardar en una carpeta y abrir un documento guardado.

- **Verificación / traducción frontend:** **Criterio antiguo pendiente de cambio:** no generar guías de documentos sin validación del PO.
- **Caso de prueba propuesto:** `T-AC-HU18-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU18-02 — Criterio original (literal):** Cada guía tiene al menos una pregunta de práctica asociada.

- **Verificación / traducción frontend:** **Pendiente de nuevo criterio:** asociación de actividad a las guías de phishing aprobadas.
- **Caso de prueba propuesto:** `T-AC-HU18-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

#### HU-19 — Contenido: búsqueda en internet

- **Historia original:** Como visitante del CLENA quiero guías para buscar información en internet usando palabras clave para resolver dudas de salud, trámites y noticias.
- **Backlog:** Must · 3 puntos · sprint 2.

- **CAMBIO DE ALCANCE:** AC antiguos de búsqueda general no corresponden a Phishing; necesitan sustitución formal PO.

**AC-HU19-01 — Criterio original (literal):** Las semillas incluyen al menos tres guías: abrir el navegador y buscar, elegir buenas palabras clave y distinguir anuncios de resultados.

- **Verificación / traducción frontend:** **Criterio antiguo pendiente:** no generar navegación ni semillas de tutorial de búsqueda general.
- **Caso de prueba propuesto:** `T-AC-HU19-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU19-02 — Criterio original (literal):** Cada guía enlaza con el módulo de información confiable.

- **Verificación / traducción frontend:** **Pendiente de decisión:** enlace a información confiable sólo si HU-27 se mantiene o integra.
- **Caso de prueba propuesto:** `T-AC-HU19-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

#### HU-20 — Contenido: redes sociales

- **Historia original:** Como visitante quiero guías básicas de redes sociales y mensajería para mantenerme en contacto y configurar mi privacidad.
- **Backlog:** Must · 3 puntos · sprint 2.

- **CAMBIO DE ALCANCE:** AC antiguos de redes no corresponden a Phishing; necesitan sustitución formal PO.

**AC-HU20-01 — Criterio original (literal):** Las semillas incluyen al menos dos guías: usar una red social o mensajería web y revisar la configuración de privacidad.

- **Verificación / traducción frontend:** **Criterio antiguo pendiente:** no generar tutorial de red social sin aprobación.
- **Caso de prueba propuesto:** `T-AC-HU20-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU20-02 — Criterio original (literal):** Las guías no usan marcas ni capturas que identifiquen a personas reales.

- **Verificación / traducción frontend:** **Regla reutilizable de contenido:** no usar capturas de personas reales ni marcas innecesarias; simulaciones identificadas.
- **Caso de prueba propuesto:** `T-AC-HU20-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

### Épica 3 — Práctica y progreso

#### HU-21 — Resolver una pregunta con retroalimentación inmediata

- **Historia original:** Como adulto mayor que terminó una guía quiero responder preguntas cortas y saber de inmediato si acerté y por qué para confirmar que entendí.
- **Backlog:** Must · 3 puntos · sprint 2.

**AC-HU21-01 — Criterio original (literal):** Dado que abro una actividad, entonces veo una pregunta a la vez, con opciones grandes y el progreso de la actividad («Pregunta 2 de 4»).

- **Verificación / traducción frontend:** Actividad muestra una pregunta por vez, opciones >=44px y «Pregunta N de M».
- **Caso de prueba propuesto:** `T-AC-HU21-01` · estado inicial: `TODO`. 

**AC-HU21-02 — Criterio original (literal):** Dado que elijo una respuesta correcta, entonces veo una confirmación en verde con ícono y texto, y una explicación corta.

- **Verificación / traducción frontend:** Confirmación positiva con icono + texto + explicación sólo después de responder.
- **Caso de prueba propuesto:** `T-AC-HU21-02` · estado inicial: `TODO`. 

**AC-HU21-03 — Criterio original (literal):** Dado que elijo una respuesta incorrecta, entonces veo un mensaje amable («Casi. La respuesta correcta es...») con la explicación, sin sonidos ni colores que alarmen.

- **Verificación / traducción frontend:** Respuesta errónea con lenguaje amable, explicación y sin alarmas; opción correcta revelada tras respuesta BE.
- **Caso de prueba propuesto:** `T-AC-HU21-03` · estado inicial: `TODO`. 

**AC-HU21-04 — Criterio original (literal):** Dado que termino la actividad, entonces veo cuántas respuestas acerté y si la aprobé (70 % o más, configurable).

- **Verificación / traducción frontend:** Final calcula resultado visible según respuesta de BE; umbral 70% configurable es propiedad del dominio BE.
- **Caso de prueba propuesto:** `T-AC-HU21-04` · estado inicial: `TODO`. 

**AC-HU21-05 — Criterio original (literal):** Dado que no aprobé, entonces puedo repetir la actividad o volver a la guía.

- **Verificación / traducción frontend:** Si no aprobó, botones Repetir y Volver a guía; preservar navegación.
- **Caso de prueba propuesto:** `T-AC-HU21-05` · estado inicial: `TODO`. 

**AC-HU21-06 — Criterio original (literal):** El color nunca es la única señal de acierto o error: siempre hay texto e ícono.

- **Verificación / traducción frontend:** Prueba visual/axe comprueba que icono y texto acompañan al color y se anuncian a lector.
- **Caso de prueba propuesto:** `T-AC-HU21-06` · estado inicial: `TODO`. 

#### HU-22 — Crear actividades de práctica

- **Historia original:** Como personal del CLENA quiero tener la posibilidad de crear actividades con preguntas de selección múltiple asociadas a una guía para que los usuarios practiquen lo que leyeron.
- **Backlog:** Should · 5 puntos · sprint no asignado.

**AC-HU22-01 — Criterio original (literal):** Dado que edito una guía, cuando creo una actividad, entonces puedo agregar entre 1  y 10 preguntas.

- **Verificación / traducción frontend:** Editor de 1–10 preguntas; altas/bajas con numeración y validación.
- **Caso de prueba propuesto:** `T-AC-HU22-01` · estado inicial: `TODO`. 

**AC-HU22-02 — Criterio original (literal):** Dado que creo una pregunta, entonces escribo el enunciado, entre 2 y 4 opciones, marco exactamente una correcta y escribo una explicación.

- **Verificación / traducción frontend:** Editor con enunciado, 2–4 opciones, una correcta y explicación; en modo edición solamente.
- **Caso de prueba propuesto:** `T-AC-HU22-02` · estado inicial: `TODO`. 

**AC-HU22-03 — Criterio original (literal):** Dado que no marco ninguna opción correcta o marco más de una, entonces el sistema no guarda la pregunta y me dice por qué.

- **Verificación / traducción frontend:** Impedir guardar si 0 o >1 opción marcada; error visible accesible.
- **Caso de prueba propuesto:** `T-AC-HU22-03` · estado inicial: `TODO`. 

**AC-HU22-04 — Criterio original (literal):** Una pregunta puede incluir una imagen opcional (por ejemplo, una captura de una bandeja de entrada).

- **Verificación / traducción frontend:** Adjuntar imagen opcional con alt y previsualización cuando API lo permita.
- **Caso de prueba propuesto:** `T-AC-HU22-04` · estado inicial: `TODO`. 

#### HU-23 — Ver mi progreso

- **Historia original:** Como usuario que sigue varias guías quiero ver una barra de progreso por guía y la lista de lo que he completado para saber cuánto he avanzado y qué me falta.
- **Backlog:** Must · 5 puntos · sprint 2.

**AC-HU23-01 — Criterio original (literal):** Dado que inicié sesión, entonces en «Mi progreso» veo por cada guía una barra con el porcentaje de guías completadas, acompañada del número.

- **Verificación / traducción frontend:** Mi progreso con barra y porcentaje numérico por guía; fuente de verdad API.
- **Caso de prueba propuesto:** `T-AC-HU23-01` · estado inicial: `TODO`. 

**AC-HU23-02 — Criterio original (literal):** Una guía cuenta como completada cuando la leí hasta el último paso y, si tiene actividad, la aprobé.

- **Verificación / traducción frontend:** Marcar completada sólo según estado del servidor tras último paso y aprobación si hay actividad.
- **Caso de prueba propuesto:** `T-AC-HU23-02` · estado inicial: `TODO`. 

**AC-HU23-03 — Criterio original (literal):** Dado que veo mi progreso, entonces las guías completadas tienen una marca visible y las pendientes un botón «Empezar».

- **Verificación / traducción frontend:** Insignia de completada y CTA «Empezar» para pendientes.
- **Caso de prueba propuesto:** `T-AC-HU23-03` · estado inicial: `TODO`. 

**AC-HU23-04 — Criterio original (literal):** Dado que no he iniciado sesión, entonces esta sección me invita a crear una cuenta.

- **Verificación / traducción frontend:** Sin sesión, invitación a crear cuenta en vez de error de permisos.
- **Caso de prueba propuesto:** `T-AC-HU23-04` · estado inicial: `TODO`. 

#### HU-24 — Retomar donde quedé

- **Historia original:** Como usuario que no terminó una guía en su última visita quiero que la plataforma me ofrezca continuar en el paso donde quedé para no empezar de cero.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU24-01 — Criterio original (literal):** Dado que dejé una guía en el paso 4, cuando vuelvo a iniciar sesión, entonces mi página de inicio muestra «Continúa donde quedaste» con esa guía.

- **Verificación / traducción frontend:** Portada autenticada presenta «Continúa donde quedaste» con guía y paso 4 según API.
- **Caso de prueba propuesto:** `T-AC-HU24-01` · estado inicial: `TODO`. 

**AC-HU24-02 — Criterio original (literal):** Dado que elijo continuar, entonces la guía se abre en el paso 4.

- **Verificación / traducción frontend:** CTA Continuar abre guía en paso guardado; maneja borrado u ocultación de guía.
- **Caso de prueba propuesto:** `T-AC-HU24-02` · estado inicial: `TODO`. 

### Épica 4 — Seguridad digital

#### HU-25 — Reconocer mensajes fraudulentos (phishing)

- **Historia original:** Como adulto mayor que recibe correos y mensajes de supuestos bancos o entidades quiero practicar con ejemplos para distinguir un mensaje falso de uno real para no entregar mis datos ni mi dinero.
- **Backlog:** Must · 5 puntos · sprint 2.

**AC-HU25-01 — Criterio original (literal):** Las semillas incluyen una guía con las señales de alerta: urgencia, petición de claves o códigos, remitente extraño, enlaces que no coinciden y premios inesperados.

- **Verificación / traducción frontend:** **Contenido/BE:** confirmar guía publicada con señales de urgencia, credenciales, remitente, enlaces y premios; FE muestra contenido sin alterarlo.
- **Caso de prueba propuesto:** `T-AC-HU25-01` · estado inicial: `TODO`. 

**AC-HU25-02 — Criterio original (literal):** Dado que hago la actividad de phishing, entonces veo al menos 5 mensajes simulados y respondo para cada uno «¿Es confiable o es un fraude?».

- **Verificación / traducción frontend:** Actividad de phishing con al menos cinco mensajes simulados, cada uno pregunta confiable/fraude; no confundir con las cinco guías temáticas.
- **Caso de prueba propuesto:** `T-AC-HU25-02` · estado inicial: `TODO`. 

**AC-HU25-03 — Criterio original (literal):** Dado que respondo, entonces la retroalimentación señala sobre el mensaje dónde estaba la pista.

- **Verificación / traducción frontend:** Después de responder, destacar visualmente la pista en texto y anunciarla con descripción accesible.
- **Caso de prueba propuesto:** `T-AC-HU25-03` · estado inicial: `TODO`. 

**AC-HU25-04 — Criterio original (literal):** Los mensajes simulados usan entidades ficticias (por ejemplo, «Banco Ejemplo») y enlaces que no llevan a ningún sitio real. Los textos alternativos de las imágenes también dicen que son simulados (por ejemplo, «Correo simulado de Banco Ejemplo, entidad ficticia»).

- **Verificación / traducción frontend:** Entidades y enlaces de ejemplo ficticios e inertes; alt incluye «simulado»; prueba verifica que no haya URL real activa.
- **Caso de prueba propuesto:** `T-AC-HU25-04` · estado inicial: `TODO`. 

#### HU-26 — Crear y cuidar contraseñas

- **Historia original:** Como visitante quiero aprender a crear una contraseña segura y fácil de recordar para proteger mis cuentas.
- **Backlog:** Must · 3 puntos · sprint 3.

- **DECISIÓN PENDIENTE:** Must original; decidir si se integra prevención de contraseñas en las cinco guías.

**AC-HU26-01 — Criterio original (literal):** Las semillas incluyen una guía sobre cómo armar una contraseña con una frase, por qué no repetirla y por qué no compartirla con nadie, ni siquiera con el personal.

- **Verificación / traducción frontend:** **Decisión de alcance pendiente:** si HU-26 se retiene, mostrar guía de frase segura/no repetición/no compartir.
- **Caso de prueba propuesto:** `T-AC-HU26-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU26-02 — Criterio original (literal):** La guía incluye recomendaciones para computadores compartidos: no guardar contraseñas en el navegador y cerrar sesión al terminar.

- **Verificación / traducción frontend:** Mostrar consejo para puestos compartidos: no guardar contraseñas y cerrar sesión.
- **Caso de prueba propuesto:** `T-AC-HU26-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU26-03 — Criterio original (literal):** La actividad presenta contraseñas de ejemplo y pide clasificarlas como débiles o seguras.

- **Verificación / traducción frontend:** Práctica clasificatoria débil/segura; sólo contenido ficticio, ninguna clave real.
- **Caso de prueba propuesto:** `T-AC-HU26-03` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

#### HU-27 — Identificar información confiable

- **Historia original:** Como visitante que busca información de salud, trámites y noticias quiero aprender a revisar si una página es confiable para no tomar decisiones con información falsa.
- **Backlog:** Must · 3 puntos · sprint 3.

- **DECISIÓN PENDIENTE:** Must original; decidir si información confiable se integra al contenido phishing.

**AC-HU27-01 — Criterio original (literal):** Las semillas incluyen una guía con una lista corta de verificación: quién publica, dirección del sitio (por ejemplo, terminaciones .gov.co), fecha y si otras fuentes dicen lo mismo.

- **Verificación / traducción frontend:** **Decisión de alcance pendiente:** guía con autor, dominio, fecha y corroboración por fuentes.
- **Caso de prueba propuesto:** `T-AC-HU27-01` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

**AC-HU27-02 — Criterio original (literal):** La actividad muestra titulares o páginas simuladas y pide decidir si son confiables.

- **Verificación / traducción frontend:** Actividad con páginas/titulares simulados, juicio de confiabilidad y explicación accesible.
- **Caso de prueba propuesto:** `T-AC-HU27-02` · estado inicial: `TODO` / `BLOCKED_DECISION`. 

### Épica 5 — Ayuda, personal y analítica

#### HU-28 — Botón de ayuda siempre visible

- **Historia original:** Como adulto mayor quiero un botón de ayuda visible en todas las pantallas para resolver mis dudas sin depender de otra persona.
- **Backlog:** Must · 3 puntos · sprint 3.

**AC-HU28-01 — Criterio original (literal):** Dado que estoy en cualquier pantalla, entonces veo un botón «Ayuda» grande, con texto, en la misma posición siempre.

- **Verificación / traducción frontend:** Acceso Ayuda grande, con texto y lugar consistente en cada layout público.
- **Caso de prueba propuesto:** `T-AC-HU28-01` · estado inicial: `TODO`. 

**AC-HU28-02 — Criterio original (literal):** Dado que lo presiono, entonces veo tres opciones: «Preguntas frecuentes», «¿Qué significa esta palabra?» (glosario) y «Llamar a un monitor».

- **Verificación / traducción frontend:** Menú de ayuda con FAQ, glosario y solicitud de monitor cuando servicios disponibles.
- **Caso de prueba propuesto:** `T-AC-HU28-02` · estado inicial: `TODO`. 

**AC-HU28-03 — Criterio original (literal):** Dado que las preguntas frecuentes o el glosario aún no están disponibles, entonces solo aparece la opción de llamar a un monitor.

- **Verificación / traducción frontend:** Si FAQ/glosario no están disponibles, mostrar únicamente contacto con monitor; sin enlaces rotos.
- **Caso de prueba propuesto:** `T-AC-HU28-03` · estado inicial: `TODO`. 

#### HU-29 — Solicitar ayuda presencial

- **Historia original:** Como visitante que no pudo resolver su duda quiero pedir ayuda indicando mi equipo y el tema para que un monitor venga a mi puesto sin que yo tenga que levantarme a buscarlo.
- **Backlog:** Must · 5 puntos · sprint 3.

**AC-HU29-01 — Criterio original (literal):** Dado que elijo «Llamar a un monitor», entonces indico el número de equipo y elijo un tema de una lista corta.

- **Verificación / traducción frontend:** Formulario de equipo y tema, ambos con etiquetas accesibles.
- **Caso de prueba propuesto:** `T-AC-HU29-01` · estado inicial: `TODO`. 

**AC-HU29-02 — Criterio original (literal):** Dado que estaba en una guía, entonces la solicitud incluye automáticamente la guía y el paso donde estaba.

- **Verificación / traducción frontend:** Contexto de guía/paso se adjunta automáticamente cuando existe.
- **Caso de prueba propuesto:** `T-AC-HU29-02` · estado inicial: `TODO`. 

**AC-HU29-03 — Criterio original (literal):** Dado que envío la solicitud, entonces veo «Un monitor vendrá pronto» y mi posición en la cola.

- **Verificación / traducción frontend:** Confirmación «Un monitor vendrá pronto» y posición informada por API.
- **Caso de prueba propuesto:** `T-AC-HU29-03` · estado inicial: `TODO`. 

**AC-HU29-04 — Criterio original (literal):** Dado que ya tengo una solicitud pendiente desde el mismo equipo, entonces el sistema no crea una duplicada y me muestra la existente.

- **Verificación / traducción frontend:** Intento repetido muestra solicitud existente y no duplica UI, BE aplica unicidad.
- **Caso de prueba propuesto:** `T-AC-HU29-04` · estado inicial: `TODO`. 

**AC-HU29-05 — Criterio original (literal):** Puedo cancelar mi solicitud si resolví la duda por mi cuenta. La solicitud no exige haber iniciado sesión: basta con el número de equipo.

- **Verificación / traducción frontend:** Cancelar solicitud y solicitar sin login; mensajes de error recuperables.
- **Caso de prueba propuesto:** `T-AC-HU29-05` · estado inicial: `TODO`. 

#### HU-30 — Atender la cola de solicitudes

- **Historia original:** Como monitor de la sala quiero ver las solicitudes de ayuda en orden de llegada y marcar su estado para atender a quien lo necesita sin interrupciones desordenadas.
- **Backlog:** Must · 5 puntos · sprint 3.

**AC-HU30-01 — Criterio original (literal):** Dado que soy personal, entonces veo las solicitudes pendientes con equipo, tema, guía y paso, y tiempo de espera, ordenadas de la más antigua a la más reciente.

- **Verificación / traducción frontend:** Tabla/lista ordenada por antigüedad, equipo, tema, guía, paso y espera.
- **Caso de prueba propuesto:** `T-AC-HU30-01` · estado inicial: `TODO`. 

**AC-HU30-02 — Criterio original (literal):** Dado que tomo una solicitud, entonces pasa a «En atención» con mi nombre, para que otro monitor no la tome.

- **Verificación / traducción frontend:** Acción Tomar muestra asignación a monitor autenticado; conflictos (409 u otro contrato) resueltos con mensaje y recarga.
- **Caso de prueba propuesto:** `T-AC-HU30-02` · estado inicial: `TODO`. 

**AC-HU30-03 — Criterio original (literal):** Dado que la resuelvo, entonces la marco como «Resuelta» y puedo anotar un comentario breve opcional.

- **Verificación / traducción frontend:** Acción Resolver permite comentario opcional y estado accesible.
- **Caso de prueba propuesto:** `T-AC-HU30-03` · estado inicial: `TODO`. 

**AC-HU30-04 — Criterio original (literal):** La lista se actualiza sola al menos cada 15 segundos, sin recargar la página, mediante consultas periódicas desde el frontend (polling). No se usan WebSockets.

- **Verificación / traducción frontend:** Polling de máximo 15 s durante pantalla activa, sin WebSocket; detener al desmontar y pausar/reanudar según visibilidad.
- **Caso de prueba propuesto:** `T-AC-HU30-04` · estado inicial: `TODO`. 

**AC-HU30-05 — Criterio original (literal):** Las transiciones de estado válidas: pendiente → en atención → resuelta → cancelada

- **Verificación / traducción frontend:** **Aclaración necesaria:** la secuencia de estados listada permite cancelada tras resuelta; solicitar al PO/BE transiciones válidas reales antes de implementarlas.
- **Caso de prueba propuesto:** `T-AC-HU30-05` · estado inicial: `TODO`. 

#### HU-31 — Ver los temas más consultados

- **Historia original:** Como coordinadora de la sala quiero ver qué guías y categorías se consultan más en un periodo para decidir qué contenido reforzar y dónde se concentran las dudas.
- **Backlog:** Must · 5 puntos · sprint 3.

**AC-HU31-01 — Criterio original (literal):** Dado que abro el panel, entonces veo el top 10 de guías más abiertas y las consultas por categoría en un gráfico, con filtro por rango de fechas (últimos 7 días por defecto).

- **Verificación / traducción frontend:** Panel top-10 guías y consultas por categoría, fechas últimos siete días por defecto.
- **Caso de prueba propuesto:** `T-AC-HU31-01` · estado inicial: `TODO`. 

**AC-HU31-02 — Criterio original (literal):** Dado que veo el panel, entonces también veo cuántas solicitudes de ayuda hubo y los temas más pedidos.

- **Verificación / traducción frontend:** Métricas y temas de ayuda por periodo; mostrar fuente y unidades.
- **Caso de prueba propuesto:** `T-AC-HU31-02` · estado inicial: `TODO`. 

**AC-HU31-03 — Criterio original (literal):** Dado que no hay datos en el rango, entonces el panel lo indica en lugar de mostrar gráficos vacíos.

- **Verificación / traducción frontend:** Estado sin datos con texto claro, sin gráficos vacíos ni 0% engañoso.
- **Caso de prueba propuesto:** `T-AC-HU31-03` · estado inicial: `TODO`. 

**AC-HU31-04 — Criterio original (literal):** Las consultas del panel usan agregaciones en la base de datos, no cálculos en memoria sobre todos los registros. Con Prisma se usa groupBy o $queryRaw, y la tabla de consultas tiene un índice por guía y fecha.

- **Verificación / traducción frontend:** **Sólo BE:** agregaciones SQL e índices; FE consume datos agregados, sin traer registros completos.
- **Caso de prueba propuesto:** `T-AC-HU31-04` · estado inicial: `TODO`. 

#### HU-32 — Ver el desempeño en las actividades

- **Historia original:** Como personal del CLENA quiero ver qué actividades y preguntas tienen más respuestas incorrectas para mejorar las guías que no se están entendiendo.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU32-01 — Criterio original (literal):** Dado que abro esta sección del panel, entonces veo por actividad el número de intentos y el porcentaje de aprobación.

- **Verificación / traducción frontend:** Lista de actividades con intentos y porcentaje aprobación entregados por API.
- **Caso de prueba propuesto:** `T-AC-HU32-01` · estado inicial: `TODO`. 

**AC-HU32-02 — Criterio original (literal):** Dado que elijo una actividad, entonces veo el porcentaje de acierto de cada pregunta, de menor a mayor.

- **Verificación / traducción frontend:** Detalle ordena porcentaje de acierto por pregunta de menor a mayor; tabla accesible.
- **Caso de prueba propuesto:** `T-AC-HU32-02` · estado inicial: `TODO`. 

#### HU-33 — Preguntas frecuentes

- **Historia original:** Como usuario con dudas operativas quiero revisar una sección de preguntas frecuentes para resolver inquietudes rápidas sobre cómo usar la plataforma y la sala.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU33-01 — Criterio original (literal):** Dado que abro las preguntas frecuentes, entonces las veo agrupadas por tema y puedo desplegar cada respuesta.

- **Verificación / traducción frontend:** FAQ por tema con secciones expandibles nativas (`details/summary`) o patrón ARIA probado.
- **Caso de prueba propuesto:** `T-AC-HU33-01` · estado inicial: `TODO`. 

**AC-HU33-02 — Criterio original (literal):** Dado que soy personal, entonces puedo crear, editar, ordenar y ocultar preguntas.

- **Verificación / traducción frontend:** Panel personal para crear/editar/ordenar/ocultar FAQ según API.
- **Caso de prueba propuesto:** `T-AC-HU33-02` · estado inicial: `TODO`. 

**AC-HU33-03 — Criterio original (literal):** Las semillas incluyen al menos 8 preguntas reales, recogidas con el equipo G5 y el personal (por ejemplo, «¿Cómo imprimo?», «¿Cuánto tiempo puedo usar el equipo?»).

- **Verificación / traducción frontend:** **Contenido/BE:** mínimo ocho FAQs reales; FE debe mostrar exactamente lo publicado.
- **Caso de prueba propuesto:** `T-AC-HU33-03` · estado inicial: `TODO`. 

#### HU-34 — Glosario de términos

- **Historia original:** Como visitante con poca experiencia digital quiero consultar el significado de palabras como «descargar», «cuenta» o «pestaña» para entender las guías.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU34-01 — Criterio original (literal):** Dado que abro el glosario, entonces veo los términos en orden alfabético con buscador, cada uno con una definición sencilla y, opcionalmente, una imagen.

- **Verificación / traducción frontend:** Glosario alfabético, buscador, definiciones simples e imagen opcional accesible.
- **Caso de prueba propuesto:** `T-AC-HU34-01` · estado inicial: `TODO`. 

**AC-HU34-02 — Criterio original (literal):** Dado que un término del glosario aparece en un paso de una guía, entonces se muestra resaltado y al tocarlo veo su definición sin salir de la guía.

- **Verificación / traducción frontend:** Término en paso abre explicación sin abandonar guía; foco se administra de forma accesible.
- **Caso de prueba propuesto:** `T-AC-HU34-02` · estado inicial: `TODO`. 

**AC-HU34-03 — Criterio original (literal):** Dado que soy personal, entonces puedo administrar los términos.

- **Verificación / traducción frontend:** Panel personal puede administrar términos con permisos.
- **Caso de prueba propuesto:** `T-AC-HU34-03` · estado inicial: `TODO`. 

**AC-HU34-04 — Criterio original (literal):** Las semillas incluyen al menos 20 términos.

- **Verificación / traducción frontend:** **Contenido/BE:** al menos veinte términos en semillas; FE muestra contenido provisto.
- **Caso de prueba propuesto:** `T-AC-HU34-04` · estado inicial: `TODO`. 

#### HU-35 — Calificar mi experiencia

- **Historia original:** Como usuario que termina su sesión quiero calificar mi experiencia con caritas para ayudar a mejorar las herramientas de la institución.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU35-01 — Criterio original (literal):** Dado que cierro sesión o termino una guía, entonces se me ofrece una calificación opcional con tres caritas grandes con texto («Me ayudó», «Más o menos», «No me ayudó»).

- **Verificación / traducción frontend:** Tras terminar guía o cerrar sesión ofrecer opción no obligatoria con tres caritas + etiquetas.
- **Caso de prueba propuesto:** `T-AC-HU35-01` · estado inicial: `TODO`. 

**AC-HU35-02 — Criterio original (literal):** Dado que califico, entonces puedo dejar un comentario opcional de máximo 300 caracteres.

- **Verificación / traducción frontend:** Comentario opcional con máximo 300 caracteres; contador y validación.
- **Caso de prueba propuesto:** `T-AC-HU35-02` · estado inicial: `TODO`. 

**AC-HU35-03 — Criterio original (literal):** Dado que soy personal, entonces veo en el panel el resumen de calificaciones por periodo y por guía.

- **Verificación / traducción frontend:** Panel personal con resumen por fecha y guía cuando API exista.
- **Caso de prueba propuesto:** `T-AC-HU35-03` · estado inicial: `TODO`. 

**AC-HU35-04 — Criterio original (literal):** La calificación es anónima si el usuario no inició sesión.

- **Verificación / traducción frontend:** No pedir login para calificar; no asociar identidad en frontend visitante.
- **Caso de prueba propuesto:** `T-AC-HU35-04` · estado inicial: `TODO`. 

### Épica 6 — Accesibilidad y QR

#### HU-36 — Ajustar el tamaño de la letra

- **Historia original:** Como adulto mayor con dificultades de visión quiero agrandar el texto de la aplicación con un botón para leer las guías con comodidad.
- **Backlog:** Must · 3 puntos · sprint 3.

**AC-HU36-01 — Criterio original (literal):** El tamaño base del texto es de al menos 18 px.

- **Verificación / traducción frontend:** Tokens CSS: texto base >=18px en todas las pantallas, incluido móvil.
- **Caso de prueba propuesto:** `T-AC-HU36-01` · estado inicial: `TODO`. 

**AC-HU36-02 — Criterio original (literal):** Dado que estoy en cualquier pantalla, entonces tengo controles visibles «A-» y «A+» con al menos tres tamaños (normal, grande, muy grande).

- **Verificación / traducción frontend:** Controles A−/A+ permanentes, tres tamaños normal, grande, muy grande; estado anunciado.
- **Caso de prueba propuesto:** `T-AC-HU36-02` · estado inicial: `TODO`. 

**AC-HU36-03 — Criterio original (literal):** Dado que agrando el texto, entonces el diseño se reacomoda sin cortar texto ni generar desplazamiento horizontal.

- **Verificación / traducción frontend:** Capturas automatizadas a 360/768/1280 y tamaños grandes sin corte ni overflow horizontal.
- **Caso de prueba propuesto:** `T-AC-HU36-03` · estado inicial: `TODO`. 

**AC-HU36-04 — Criterio original (literal):** Dado que no inicié sesión, entonces la preferencia se recuerda en ese navegador; si inicié sesión, se guarda en mi perfil.

- **Verificación / traducción frontend:** Visitante guarda en almacenamiento local; autenticado sincroniza con preferencias de API y decide precedencia.
- **Caso de prueba propuesto:** `T-AC-HU36-04` · estado inicial: `TODO`. 

**AC-HU36-05 — Criterio original (literal):** El zoom del navegador hasta 200 % también funciona sin romper el diseño.

- **Verificación / traducción frontend:** Zoom navegador 200% (y reflow) verificado manualmente y en E2E de tamaños.
- **Caso de prueba propuesto:** `T-AC-HU36-05` · estado inicial: `TODO`. 

#### HU-37 — Modo de alto contraste

- **Historia original:** Como adulto mayor con baja visión quiero activar un modo de alto contraste para distinguir mejor el texto y los botones.
- **Backlog:** Must · 3 puntos · sprint 3.

**AC-HU37-01 — Criterio original (literal):** El modo normal cumple contraste mínimo 4,5:1 para texto (WCAG 2.1 AA).

- **Verificación / traducción frontend:** Comprobar todas combinaciones de texto normal >=4.5:1 según tipo de texto.
- **Caso de prueba propuesto:** `T-AC-HU37-01` · estado inicial: `TODO`. 

**AC-HU37-02 — Criterio original (literal):** Dado que activo el alto contraste, entonces los colores cambian a una paleta de contraste de al menos 7:1 (WCAG AAA).

- **Verificación / traducción frontend:** Tema de alto contraste >=7:1 para texto relevante y control funcional con token semántico.
- **Caso de prueba propuesto:** `T-AC-HU37-02` · estado inicial: `TODO`. 

**AC-HU37-03 — Criterio original (literal):** Los botones y enlaces se distinguen por forma o subrayado, no solo por color.

- **Verificación / traducción frontend:** Enlaces subrayados, botones distinguibles por forma/etiqueta; no depender del color.
- **Caso de prueba propuesto:** `T-AC-HU37-03` · estado inicial: `TODO`. 

**AC-HU37-04 — Criterio original (literal):** La preferencia se guarda igual que la del tamaño de letra.

- **Verificación / traducción frontend:** Persistencia local y en perfil como HU-36; evitar flash al inicio.
- **Caso de prueba propuesto:** `T-AC-HU37-04` · estado inicial: `TODO`. 

#### HU-38 — Navegación con teclado y lectores de pantalla

- **Historia original:** Como persona con dificultades motrices o visuales quiero usar toda la plataforma con el teclado y con un lector de pantalla para no depender del ratón ni de leer la pantalla.
- **Backlog:** Must · 5 puntos · sprint 3.

**AC-HU38-01 — Criterio original (literal):** Todas las acciones se pueden hacer con Tab, Shift+Tab, Enter y Espacio, en un orden lógico.

- **Verificación / traducción frontend:** E2E sólo teclado de recorridos principales, orden de foco coherente.
- **Caso de prueba propuesto:** `T-AC-HU38-01` · estado inicial: `TODO`. 

**AC-HU38-02 — Criterio original (literal):** El elemento enfocado tiene un indicador visible y grueso.

- **Verificación / traducción frontend:** Estados `:focus-visible` claramente visibles, incluyendo alto contraste.
- **Caso de prueba propuesto:** `T-AC-HU38-02` · estado inicial: `TODO`. 

**AC-HU38-03 — Criterio original (literal):** Todos los campos de formulario tienen etiqueta, y los errores se anuncian a los lectores de pantalla.

- **Verificación / traducción frontend:** Todos los inputs `label`; errores asociados `aria-describedby`, resumen y anuncio accesible.
- **Caso de prueba propuesto:** `T-AC-HU38-03` · estado inicial: `TODO`. 

**AC-HU38-04 — Criterio original (literal):** Todas las imágenes tienen texto alternativo, y los íconos decorativos están ocultos para lectores de pantalla.

- **Verificación / traducción frontend:** Imágenes informativas con alt; decorativas `alt=""`/`aria-hidden`; no repetir texto redundante.
- **Caso de prueba propuesto:** `T-AC-HU38-04` · estado inicial: `TODO`. 

**AC-HU38-05 — Criterio original (literal):** Cada pantalla pasa dos verificaciones automáticas en CI: Lighthouse CI con puntaje de accesibilidad de al menos 90 y axe (por ejemplo, @axe-core/playwright) sin violaciones graves o críticas. El job falla si alguna no se cumple.

- **Verificación / traducción frontend:** CI frontend con Lighthouse >=90 y axe sin critical/serious; ejecutar también revisión manual (axe no garantiza AA).
- **Caso de prueba propuesto:** `T-AC-HU38-05` · estado inicial: `TODO`. 

#### HU-39 — Uso desde el celular

- **Historia original:** Como visitante con su celular quiero que la plataforma se vea bien en pantallas pequeñas para seguir las guías desde mi teléfono mientras uso el computador.
- **Backlog:** Must · 3 puntos · sprint 3.

**AC-HU39-01 — Criterio original (literal):** Todas las pantallas funcionan desde 360 px de ancho sin desplazamiento horizontal.

- **Verificación / traducción frontend:** Comprobar 360 px y zoom 200% sin barra horizontal indebida.
- **Caso de prueba propuesto:** `T-AC-HU39-01` · estado inicial: `TODO`. 

**AC-HU39-02 — Criterio original (literal):** Los botones y zonas táctiles miden al menos 44 × 44 px.

- **Verificación / traducción frontend:** Comprobar botones/targets >=44×44px incluyendo cerrar, iconos y radios.
- **Caso de prueba propuesto:** `T-AC-HU39-02` · estado inicial: `TODO`. 

**AC-HU39-03 — Criterio original (literal):** En celular, una guía se puede seguir en una pestaña mientras el usuario practica en el computador.

- **Verificación / traducción frontend:** Deep-link de guía en móvil y estado independiente en otro equipo; nunca requerir compartir sesión.
- **Caso de prueba propuesto:** `T-AC-HU39-03` · estado inicial: `TODO`. 

#### HU-40 — Tutorial de primera visita

- **Historia original:** Como persona que usa la plataforma por primera vez quiero un recorrido corto que me muestre dónde está cada cosa para aprender a usarla por mi cuenta.
- **Backlog:** Should · 3 puntos · sprint no asignado.

**AC-HU40-01 — Criterio original (literal):** Dado que entro por primera vez en ese navegador o con mi cuenta, entonces se me ofrece un recorrido de máximo 5 pasos: categorías, buscador, tamaño de letra, botón de ayuda y mi progreso.

- **Verificación / traducción frontend:** Tutorial opcional <=5 pasos con categoría Phishing, buscador, tamaño, ayuda y progreso adaptados al alcance aprobado.
- **Caso de prueba propuesto:** `T-AC-HU40-01` · estado inicial: `TODO`. 

**AC-HU40-02 — Criterio original (literal):** Dado que estoy en el recorrido, entonces puedo avanzar, retroceder u omitirlo en cualquier momento.

- **Verificación / traducción frontend:** Controles anterior/siguiente/omitir; teclado y Escape razonable.
- **Caso de prueba propuesto:** `T-AC-HU40-02` · estado inicial: `TODO`. 

**AC-HU40-03 — Criterio original (literal):** Dado que lo omití, entonces puedo volver a verlo desde el botón de ayuda.

- **Verificación / traducción frontend:** Relanzar desde Ayuda incluso si ya fue omitido; persistencia confirmada según login.
- **Caso de prueba propuesto:** `T-AC-HU40-03` · estado inicial: `TODO`. 

#### HU-45 — Acceso rápido por código QR

- **Historia original:** Como visitante en la sala quiero escanear un código QR en el puesto para abrir directamente la plataforma o una guía en mi celular, sin escribir la dirección.
- **Backlog:** Must · 2 puntos · sprint 3.

**AC-HU45-01 — Criterio original (literal):** Dado que escaneo el código QR impreso en el puesto, entonces la aplicación se abre en la guía o categoría correspondiente.

- **Verificación / traducción frontend:** URL pública directa abre Phishing o guía existente; QR apunta a dominio correcto.
- **Caso de prueba propuesto:** `T-AC-HU45-01` · estado inicial: `TODO`. 

**AC-HU45-02 — Criterio original (literal):** No se requiere inicio de sesión para acceder mediante el código QR.

- **Verificación / traducción frontend:** Acceso por QR sin login; visita como invitado.
- **Caso de prueba propuesto:** `T-AC-HU45-02` · estado inicial: `TODO`. 

**AC-HU45-03 — Criterio original (literal):** Dado que soy personal del CLENA, entonces puedo descargar e imprimir el QR de la plataforma, de cada categoría y de cada guía.

- **Verificación / traducción frontend:** Panel personal exporta QR de plataforma, Phishing y cada guía; impresión y alt/etiqueta en descarga.
- **Caso de prueba propuesto:** `T-AC-HU45-03` · estado inicial: `TODO`. 

### Épica 7 — Funcionalidades deseables

#### HU-41 — Lectura en voz alta de las guías

- **Historia original:** Como persona con dificultades visuales quiero que la aplicación lea en voz alta cada paso de la guía para aprender sin depender de leer la pantalla.
- **Backlog:** Could · 5 puntos · sprint no asignado.

**AC-HU41-01 — Criterio original (literal):** Dado que estoy en un paso, cuando presiono «Escuchar», entonces se lee el texto del paso en español.

- **Verificación / traducción frontend:** **Could:** botón Escuchar reproduce texto en español si Web Speech API disponible.
- **Caso de prueba propuesto:** `T-AC-HU41-01` · estado inicial: `TODO`. 

**AC-HU41-02 — Criterio original (literal):** Dado que está leyendo, entonces puedo pausar, repetir y ajustar la velocidad (normal o lenta).

- **Verificación / traducción frontend:** **Could:** pausar/repetir y velocidad lenta/normal, controles accesibles.
- **Caso de prueba propuesto:** `T-AC-HU41-02` · estado inicial: `TODO`. 

**AC-HU41-03 — Criterio original (literal):** Dado que avanzo de paso, entonces la lectura anterior se detiene.

- **Verificación / traducción frontend:** **Could:** detener síntesis al cambiar de paso o salir de guía.
- **Caso de prueba propuesto:** `T-AC-HU41-03` · estado inicial: `TODO`. 

#### HU-42 — Incentivo de cumplimiento

- **Historia original:** Como adulto mayor que completó una categoría quiero recibir un incentivo por puntos para sentirme motivado y demostrar lo que aprendí.
- **Backlog:** Could · 5 puntos · sprint no asignado.

**AC-HU42-01 — Criterio original (literal):** Dado que completé todas las guías obligatorias de una categoría, entonces obtendré una serie de puntos asociadas a mi perfil donde se podrá ver qué tanto he desarrollado en la plataforma

- **Verificación / traducción frontend:** **Could:** puntos vinculados a perfil tras completar categoría, sólo si BE define reglas y endpoint.
- **Caso de prueba propuesto:** `T-AC-HU42-01` · estado inicial: `TODO`. 

**AC-HU42-02 — Criterio original (literal):** Todas las guías tendrán asociadas una serie de puntos por ser completados en su totalidad, y como usuario podré ver de dónde vienen mis puntos.

- **Verificación / traducción frontend:** **Could:** desglose de puntos por guía; no calcular ni persistir puntuación sólo en cliente.
- **Caso de prueba propuesto:** `T-AC-HU42-02` · estado inicial: `TODO`. 

#### HU-43 — Búsqueda por voz

- **Historia original:** Como visitante con dificultades de movimiento en las manos quiero buscar guías hablando para no tener que escribir.
- **Backlog:** Could · 5 puntos · sprint no asignado.

**AC-HU43-01 — Criterio original (literal):** Dado que el navegador lo permite, entonces junto al buscador aparece un botón de micrófono con texto.

- **Verificación / traducción frontend:** **Could:** botón de micrófono sólo si API del navegador y permisos disponibles.
- **Caso de prueba propuesto:** `T-AC-HU43-01` · estado inicial: `TODO`. 

**AC-HU43-02 — Criterio original (literal):** Dado que hablo, entonces mi frase aparece escrita en el buscador y se ejecuta la búsqueda de HU-11.

- **Verificación / traducción frontend:** **Could:** transcripción llega a campo buscador y dispara HU-11.
- **Caso de prueba propuesto:** `T-AC-HU43-02` · estado inicial: `TODO`. 

**AC-HU43-03 — Criterio original (literal):** Dado que el navegador no lo permite o no hay micrófono, entonces el botón no aparece.

- **Verificación / traducción frontend:** **Could:** ocultar o deshabilitar con explicación ante falta de soporte; preservar búsqueda textual.
- **Caso de prueba propuesto:** `T-AC-HU43-03` · estado inicial: `TODO`. 

#### HU-44 — Interfaz en inglés

- **Historia original:** Como visitante extranjero quiero cambiar el idioma de la interfaz entre español e inglés para entender los menús.
- **Backlog:** Won’t · 3 puntos · sprint no asignado.

- **Fuera de v1:** prioridad Won’t del backlog.

**AC-HU44-01 — Criterio original (literal):** Dado que elijo «English», entonces todos los textos fijos de la interfaz (menús, botones, mensajes) se muestran en inglés.

- **Verificación / traducción frontend:** **Won’t:** mantener trazabilidad sin implementar cambio de idioma en primera versión.
- **Caso de prueba propuesto:** `T-AC-HU44-01` · estado inicial: `TODO`. 

**AC-HU44-02 — Criterio original (literal):** El contenido de las guías se mantiene en español, con un aviso en inglés que lo indica.

- **Verificación / traducción frontend:** **Won’t:** no traducir guías automáticamente; registrar comportamiento para versión futura.
- **Caso de prueba propuesto:** `T-AC-HU44-02` · estado inicial: `TODO`. 

---
# ANEXO B — Cobertura transversal y cierre de requisitos

## B.1 Reglas generales del backlog aplicables a todas las historias

- **Accesibilidad:** todas las pantallas cumplen HU-36 a HU-39; condiciones de teclado/lectura/contraste aplicables en todos los componentes, no sólo una página «accesible».
- **Listados:** el backlog exige paginación, filtro y ordenamiento para todo listado. Donde no haya contrato real o no sea útil (p. ej. cinco guías), registrar el alcance y proponer manejo cliente accesible; cualquier excepción requiere PO, no ignorar la regla.
- **Endpoints protegidos:** 401 sin token, 403 sin rol adecuado; autoriza el servidor, el frontend muestra UI adecuada.
- **Lenguaje:** mensajes claros, sin códigos técnicos.
- **Validación y formato de errores:** BE valida DTO y estandariza respuestas; frontend maneja errores documentados sin asumir shape.
- **Política de datos:** consentimiento y privacidad, sesion compartida, borrado solicitado a BE, QR no autenticado y simulaciones sin PII.
- **Imagenes:** alt obligatorio en imágenes informativas; iconografía decorativa oculta a lectores, interfaz visual no depende de imágenes para funcionar.

## B.2 Tabla de cierre de sprint por evidencia

| Etapa | Evidencia requerida | ¿Quién valida? |
|---|---|---|
| Constitución y alcance | ADR firmado y documento vigente | PO + equipo |
| Especificación | AC indexados, ejemplos y criterios no ambiguos | PO + Andrés/Carlos |
| Plan | Archivos, riesgos, API confirmada o bloqueo | Andrés + Esteban/Wilmer según API |
| Implementación | PR pequeño, tests unitarios/RTL y capturas | Revisor frontend |
| Integración | Contrato Swagger + E2E real o estado BLOCKED_API | FE + BE |
| Accesibilidad | Axe, Lighthouse, teclado, lector, 360px, zoom | Carlos + revisor |
| Entrega | CI ambos jobs verde, manual y versión | Equipo + PO |

## B.3 Comprobaciones automáticas deseables para la matriz

- Extraer referencias `AC-HU\d\d-\d\d` de cada `spec.md`, `tasks.md` y test; reportar ausencias de las **151 IDs originales** sólo cuando una HU esté marcada activa en el backlog actualizado.
- Verificar que una prueba de UI mock no se marque `PASS_INTEGRATED`.
- Detectar si un PR frontend cambia archivos `backend/**`, `backend/prisma/**`, `docker-compose.yml`, `.github/workflows/**` sin autorización registrada.
- Probar accesibilidad en rutas públicas y administrativas, incluido estado de error y diálogos.
- Exigir en PR una matriz «AC → test → ejecución → resultado → captura/enlace».

## B.4 Checklist de adopción de SDD en el monorepositorio

- [ ] PO aprueba categoría Phishing, cinco guías y sustitución de HU-17–20.
- [ ] PO resuelve HU-16 y HU-26/27; actualiza Must/Sprint si corresponde.
- [ ] Se crea rama de documentación basada en `dev` sin tocar backend.
- [ ] Se revisa el diff de `specify init --here --force --integration claude`.
- [ ] Se aprueba constitución y se mantiene `CLAUDE.md` conciso.
- [ ] Se publican rutas frontend, diseño, accesibilidad y contratos API confirmados.
- [ ] Se generan specs por vertical slice con AC ↔ tests.
- [ ] Se incorporan pruebas frontend y job de CI mediante PR revisado.
- [ ] Se demuestra una primera guía completa sin login usando datos simulados rotulados.
- [ ] Se reemplazan mocks únicamente con servicios BE realmente publicados.
- [ ] Ningún PR de frontend modifica backend o archivos compartidos sin aprobación.

## Referencias y materiales

**Fuentes internas entregadas:** `Backlog P1 — Plataforma de autoaprendizaje digital CLENA.docx`; `Modelo de datos — Kamá.docx`; `roles-y-responsabilidades.md`; `sprint-planning.md`; `daily-scrum.md`; `Acta de Incersion.md`. **Código inspeccionado:** [árbol de `dev`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/tree/dev) y archivos [`frontend/package.json`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/frontend/package.json), [`frontend/src/App.tsx`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/frontend/src/App.tsx), [`backend/src/app.module.ts`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/backend/src/app.module.ts), [`backend/src/main.ts`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/backend/src/main.ts), [`backend/prisma/schema.prisma`](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/backend/prisma/schema.prisma), [CI](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/.github/workflows/ci.yml), [Docker Compose](https://github.com/Carlosam7/plataforma-autoaprendizaje-clena-backend/blob/dev/docker-compose.yml).

**Documentación externa de herramientas:** [Spec Kit oficial](https://github.com/github/spec-kit); [adopción en proyectos existentes](https://github.github.io/spec-kit/how-to/existing-projects.html); [integración Claude Code](https://github.github.io/spec-kit/integrations/index.html); [sintaxis de invocación](https://github.github.io/spec-kit/integrations/cli.html); [Anthropic: CLAUDE.md, Skills y reglas](https://claude.com/resources/articles/steering-claude-code-skills-hooks-rules-subagents-and-more); [guía oficial de Skills](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices); [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

---

**Estado de este documento: PROPUESTA PARA REVISIÓN DEL EQUIPO.** No se han modificado el repositorio ni la rama `dev`, no se han creado todavía Skills dentro de GitHub, no se ha instalado Spec Kit y no se ha ejecutado ninguna prueba del sistema. Los archivos SDD y snippets incluidos son plantillas para su implementación posterior por el equipo.
