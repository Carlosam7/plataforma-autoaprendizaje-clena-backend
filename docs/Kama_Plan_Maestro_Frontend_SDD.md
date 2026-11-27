# Kamá — Plan maestro del frontend y ejecución ODD para Claude Code

> **Ruta oficial propuesta:** `docs/Kama_Plan_Maestro_Frontend_SDD.md` (se conserva el nombre del archivo para no romper enlaces).  
> **Versión propuesta:** 2.1 — 26 de noviembre de 2026 (consolidación mínima del repositorio).  
> **Estado:** **PENDIENTE DE APROBACIÓN DEL EQUIPO**. La incorporación de este documento al repositorio no equivale a aprobación del Product Owner.  
> **Repositorio:** `Carlosam7/plataforma-autoaprendizaje-clena-backend`, monorepositorio con `backend/` y `frontend/`.  
> **Ámbito de Claude Code:** **implementación y evaluación exclusivamente del frontend existente**. Backend y configuración compartida protegidos.  
> **Método operativo:** desarrollo incremental **ODD**, con compuertas de aprobación humana y **commits exclusivamente manuales**.  
> **Primera prioridad técnica:** **evaluar y mejorar la accesibilidad**, sin alterar por iniciativa propia el contenido educativo que ya cumple la finalidad de la aplicación.

---

## 0. Cómo interpretar y mantener este documento

Este archivo es **la fuente de verdad operativa del trabajo frontend**: establece **cómo** diagnosticar, seleccionar, planificar, autorizar, implementar, verificar, revisar y registrar cada incremento. No sustituye el backlog, las decisiones del Product Owner, el modelo de datos ni los contratos implementados; establece su uso coordinado.

**Paquete documental mínimo:** solo este plan y `frontend/CLAUDE.md` son necesarios en el repositorio. Los demás materiales académicos y fuentes originales pueden quedar externos. **El plan es autosuficiente para ejecutar F00**; para cambios que dependan del texto exacto de una HU, Claude solicitará el criterio aprobado antes de planificar esa unidad.

### 0.1 Jerarquía de autoridad

1. **Acuerdos del Product Owner y del equipo expresamente aprobados y fechados:** determinan alcance, criterios funcionales y autorizaciones. Si un acuerdo nuevo contradice el backlog, registrarlo y someter el cambio a validación formal; no actualizar requisitos en secreto.
2. **Backlog Kamá v2.1 validado** (conservado por el equipo fuera del repositorio): autoridad para HU canónicas, prioridad MoSCoW, criterios de aceptación completos y planificación histórica. **No es obligatorio copiarlo al repositorio**. Para una HU concreta, si sus criterios íntegros no están disponibles en esta sesión, solicitarlos al responsable o el archivo externo; no inventarlos ni ejecutar esa HU sin verificar sus criterios.
3. **Modelo de datos Kamá v2.0** (conservado por el equipo fuera del repositorio): referencia de reglas de datos cuando sea necesaria. **No es obligatorio copiarlo al repositorio**; el PDF antiguo `Modelo de datos - Kamá.pdf` es v1.0 y no lo sustituye. Para integrar, los controladores, DTO y respuestas efectivamente verificados en el backend tienen precedencia como evidencia técnica del contrato, sin cambiar los requisitos de producto.
4. **Código actual del repositorio y contratos API reales:** fuente para decir qué existe y funciona en cada revisión. Inspeccionar controladores/DTO, Swagger si está disponible, pruebas y configuración real. Un archivo en el árbol **no prueba** que un flujo funcione.
5. **Diseño Figma aprobado, cuando exista:** fuente del aspecto visual, componentes y microcopias de la interfaz, subordinada a accesibilidad y requisitos validados. Un borrador Figma no justifica modificar contenido.
6. **Este plan maestro:** método ODD, límites de cambios, puertas de calidad, etapas y evidencia. Si contradice una fuente superior, **registrar discrepancia y detener únicamente el cambio afectado**.
7. **Documentación anterior SDD, validación ODD full-stack y modelo v1.0:** material histórico y de consulta **externo o ya existente**, no una segunda ruta ejecutable. El backlog externo conserva las historias y criterios completos; **no se duplican aquí los 151 criterios históricos** para mantener el repositorio ligero.

### 0.2 Procedencia y certeza

Usar las etiquetas: **APROBADO** (acuerdo constatable), **OBSERVADO_EN_ÁRBOL** (existe ruta, sin prueba de ejecución), **VERIFICADO_EN_CÓDIGO** (se inspeccionó e identificó evidencia concreta), **VERIFICADO_EN_EJECUCIÓN** (se probaron resultados), **PROPUESTA** (requiere aprobación), **BLOQUEADO** (falta decisión, API o acceso), **HISTÓRICO** (no es instrucción vigente).

El árbol compartido por el equipo describe **101 directorios y 346 archivos**; es una fotografía textual facilitada por el equipo, **no** un análisis de versiones ni una ejecución de pruebas. El plan SDD v1.0 (9/11/2026) está anclado a un commit de 7/11/2026 y contiene observaciones antiguas. **No reutilizar su diagnóstico como estado actual.**

### 0.3 Control de cambios y aprobación

- Actualizar este plan **solo después de revisión y autorización humana**. Registrar qué cambió, por qué, quién aprobó y fecha real.
- No editar requisitos históricos, estimaciones, prioridades, puntos, HU ni fechas de sprint sin decisión formal del PO.
- **Responsable de mantenimiento propuesto:** equipo frontend; **aprobación:** PO para alcance/producto y revisor frontend para aspectos técnicos. Confirmar nombres y roles reales antes de registrar firmas.
- El nombre `..._SDD.md` se mantiene por compatibilidad con las referencias existentes; **el contenido operativo es ODD**. Renombrarlo es una decisión documental independiente, no condición para empezar.

| Versión | Fecha | Cambio | Aprobación |
|---|---|---|---|
| 1.0 | 09/11/2026 | Plan SDD original, arquitectura y 151 AC originales | Histórico; consultar el documento previo |
| 2.0 | 26/11/2026 | Borrador de consolidación ODD con anexos históricos | Borrador, no aprobación implícita |
| 2.1 | 26/11/2026 | Plan operativo único y autocontenido, sin duplicar fuentes externas; compatible con `frontend/CLAUDE.md` | **Pendiente de aprobación del equipo** |

---

## 1. Propósito del producto y límites

**Kamá** es una plataforma educativa del CLENA, pensada principalmente para adultos mayores y personas con poca experiencia digital. Su propósito actual es ofrecer guías y actividades prácticas para reconocer y prevenir intentos de **phishing** y modalidades asociadas, de forma clara, autónoma, respetuosa y accesible.

**Roles de uso** (según el backlog, sujetos a verificación en código): visitante sin cuenta, usuario público registrado, personal del CLENA y administrador. El equipo no debe imponer registro para leer guías o realizar prácticas que el backlog permita como visitante. El personal administra funciones autorizadas de la plataforma; el servidor es responsable final de los permisos.

### 1.1 Política de conservación del contenido: decisión operativa prioritaria

**ACUERDO COMUNICADO POR EL EQUIPO:** el **contenido educativo ya implementado** es adecuado para el propósito actual de Kamá. ODD **no es un proyecto de reescritura de contenido**. Se debe preservar el material disponible mientras se audita su accesibilidad y la implementación técnica.

- **NO editar, borrar, renombrar, resumir, sustituir ni regenerar por iniciativa del agente** guías, pasos, explicaciones, textos educativos, simulaciones, preguntas, alternativas, retroalimentaciones o imágenes informativas existentes.
- **NO forzar automáticamente cuatro o cinco registros de guía** para conciliar documentos. El backlog v2.1 valida una categoría `Phishing` y cuatro guías de alcance mínimo (**Smishing, Vishing, Quishing, Falso soporte técnico**) con HU-25/26/27 transversales. El plan SDD histórico propuso cinco escenarios distintos. **El árbol compartido no permite comprobar cuántas guías existen realmente ni su contenido.** Si hay divergencia, **documentarla para revisión del PO sin alterar contenido ni semillas**.
- La cantidad de escenarios o preguntas simuladas no equivale a cantidad de guías: el backlog exige al menos cinco situaciones de phishing distribuidas en actividades, sin obligar a crear una quinta guía.
- El agente **sí puede revisar cómo se presenta** el contenido: semántica, foco, navegación, contraste, zoom, texto alternativo, feedback y lectura con tecnologías de apoyo; corregirá la **presentación** tras aprobación, sin cambiar el significado ni las respuestas correctas.
- Una mejora de lectura que requiera reescritura pedagógica, simplificación de una explicación, cambio de imagen o ajuste de preguntas **se registra como propuesta separada y requiere aprobación explícita del PO**.
- Los datos educativos se deben consumir de la API o los adaptadores existentes; no reemplazar fuentes reales por mocks sin autorización.
- No crear categorías adicionales ni implementar HU-16 (administración dinámica de categorías) por iniciativa propia.

### 1.2 Reglas funcionales vigentes que el frontend debe respetar

- Primera categoría aprobada: **Phishing**. Las guías y actividades mostradas al usuario reflejan la información real disponible y publicada; no inventar catálogo.
- Por guía inicial, una actividad: **1–10 preguntas**, **2–4 opciones** por pregunta, **exactamente una correcta**; aprobación **≥70 %**, conforme a reglas y respuesta de servidor verificadas. No revelar `es_correcta` antes de responder.
- Las HU-25, HU-26 y HU-27 complementan la enseñanza del phishing; no son nuevas categorías ni cursos independientes en el MVP validado.
- Los **visitantes sin cuenta** pueden recorrer guías y prácticas. Su estado educativo, respuestas y resultado son **temporales en memoria de sesión de la aplicación** y se pierden al recargar. No persistir intentos/progreso personal de invitados; las **preferencias de accesibilidad** son distintas del progreso y pueden conservarse en el navegador según HU-36/37.
- El usuario autenticado puede acceder a progreso persistente **solo cuando la API real lo soporte y el contrato esté confirmado**. No fingir persistencia con un mock.
- No introducir datos reales de visitantes en pruebas, capturas, ejemplos, guías o documentación. Simulaciones de fraude: entidades ficticias y enlaces inertes.
- Los permisos de rol y las respuestas 401/403 se validan realmente en servidor; ocultar botones en FE no reemplaza autorización BE.

### 1.3 No objetivos del trabajo de Claude Code

- No implementar ni modificar backend NestJS, entidades, Prisma, migraciones, semillas, controladores, DTO, servicios de mensajería ni pruebas backend.
- No rehacer el proyecto desde cero, no ejecutar scaffolding nuevo Vite, ni convertir la estructura por capas a otra arquitectura.
- No adoptar automáticamente Spec Kit, cambiar metodología, instalar Skills o crear una segunda fuente de verdad.
- No imponer nuevas paletas, contenidos, rutas o interacciones por estética sin autorización.
- No desplegar, editar infraestructura compartida o manejar credenciales reales.
- No hacer commits, gestionar ramas, publicar PR ni ejecutar operaciones Git de escritura.

---

## 2. Estado técnico inicial: fotografía del árbol (sin afirmar funcionamiento)

### 2.1 Monorepositorio

```text
raíz/
├── backend/                 # NestJS y PostgreSQL/Prisma; SOLO LECTURA
│   ├── CLAUDE.md            # Instrucciones del equipo backend; NO MODIFICAR
│   ├── prisma/              # Esquema, migraciones y semillas; NO MODIFICAR
│   ├── src/{domain,application,infrastructure,presentation,modules}/
│   └── test/e2e/
├── frontend/                # ÚNICA ÁREA DE IMPLEMENTACIÓN DEL AGENTE
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── src/
│   │   ├── domain/
│   │   ├── application/
│   │   ├── infrastructure/
│   │   ├── main/
│   │   └── presentation/
│   ├── vite.config.ts
│   ├── nginx.conf            # Configuración de infraestructura: aprobación especial
│   └── Dockerfile            # Configuración de infraestructura: aprobación especial
├── docs/
│   ├── Kama_Plan_Maestro_Frontend_SDD.md  # ESTE PLAN
│   ├── LEER_PRIMERO_Validacion_ODD_Kama.md # Documento anterior por revisar
│   └── Modelo de datos - Kamá.pdf         # v1.0 histórica
└── docker-compose.yml        # Compartido, NO MODIFICAR
```

**Tecnología identificable por el árbol/contexto:** React + TypeScript + Vite; `pnpm-lock.yaml` indica uso de pnpm. **Versiones exactas de Node, React, Vite, pnpm, scripts y dependencias de pruebas: POR VERIFICAR en `frontend/package.json` y el entorno.** El plan antiguo indicaba versiones y estado de tests de noviembre 7 que no deben darse hoy por ciertas.

**`frontend/CLAUDE.md` no aparece en el árbol más reciente**, aunque se compartió un contenido de `CLAUDE.md` en el diálogo anterior. Antes de añadirlo o reemplazarlo, Claude deberá localizar el archivo real y reportar ubicación/precedencia. No modificar `backend/CLAUDE.md`.

### 2.2 Arquitectura que se conserva

| Capa | Directorio existente | Responsabilidad a preservar |
|---|---|---|
| Dominio | `frontend/src/domain/` | Entidades, tipos y reglas de dominio sin React/DOM/HTTP. |
| Aplicación | `frontend/src/application/` | Casos de uso y puertos de negocio; prueba de comportamientos. |
| Infraestructura | `frontend/src/infrastructure/` | Repositorios HTTP o en memoria, preferencias y adaptadores. |
| Presentación | `frontend/src/presentation/` | Páginas, componentes, layout, accesibilidad, estilos y router. |
| Composición | `frontend/src/main/` | Bootstrap React, contenedor y dependencias. |

Conservar las dependencias entre capas y convenciones existentes. **No introducir `src/features/`, `src/app/` ni servicios paralelos para cumplir el árbol propuesto por SDD v1.0**. Refactorizaciones grandes requieren propuesta y aprobación independientes.

### 2.3 Componentes y módulos que ya aparecen en el árbol

| Área | Artefactos visibles | Qué verificar durante F00 |
|---|---|---|
| Accesibilidad | `presentation/accessibility/AccessibilityBar.tsx`, `AccessibilityProvider.tsx`; `application/accessibility/`; `infrastructure/accessibility/`; `presentation/styles/` | Control A-/A+, contraste, persistencia de preferencias, foco, zoom, CSS y tests existentes. |
| Navegación | `presentation/router/router.tsx`, `layout/RootLayout.tsx`, `SiteHeader.tsx`, `App.tsx` | Rutas verdaderas, roles, estados 403/404, skip link, navegación por teclado. |
| Catálogo | `HomePage.tsx`, `GuiasPage.tsx`, `HttpGuiasRepository.ts`, `InMemoryGuiasRepository.ts` | Listado, filtrado de publicadas, estado vacío, error, consumo real vs mock. |
| Lectura | `GuiaDetallePage.tsx`, `ObtenerDetalleGuia.ts` | Pasos, objetivo, botones, alt, orden de foco, lectura en zoom. |
| Prácticas | `GuiaPracticaPage.tsx`, `GuiaResultadosPage.tsx`, `CalcularResultadoPractica.ts` | Pregunta por pantalla, feedback accesible, no exponer respuestas, flujo invitado, distinción FE/BE. |
| Registro y sesión | `CrearCuentaPage.tsx`, `IniciarSesionPage.tsx`, `VerificarAccesoPage.tsx`, `HttpAuthRepository.ts` | Validación accesible, verificación OTP, mensajes, sesión y errores. |
| Personal | `personal/AccesoPersonalPage.tsx`, `PrimerAccesoPage.tsx`, `admin/GestionPersonalPage.tsx`, `HttpPersonalRepository.ts` | Accesibilidad y límites de permisos por rol. |
| Ayuda | `AyudaPage.tsx` | Ayuda visible y navegable, formulario, confirmaciones y estados. |
| Progreso | `ProgresoPage.tsx` | Invitado vs registrado y coherencia de persistencia. |
| Pruebas | `*.test.ts` en domain/application/infrastructure | Ejecución y cobertura reales; no afirmar que las pruebas pasan sin ejecutarlas. |

**El árbol no demuestra** si alguna vista realmente se renderiza, si hay contenido válido o si las llamadas HTTP son exitosas. F00 debe producir evidencia por módulo.

### 2.4 Backend: lectura técnica sin modificarlo

Los módulos y controladores observables en el árbol incluyen:

- `backend/src/presentation/auth/*` — registro, sesión, cuenta y aviso de privacidad;
- `backend/src/presentation/categoria/*` — consulta;
- `backend/src/presentation/guia/*` — guías y gestión;
- `backend/src/presentation/practica/*` — actividades y respuestas;
- `backend/src/presentation/ayuda/*` — solicitudes;
- `backend/src/presentation/personal/*` — personal y sesiones;
- `backend/src/presentation/health/*` — estado de salud.

**NO inferir** métodos HTTP, URL exacta, formato de respuesta, autenticación, CORS o disponibilidad en ejecución por los nombres de esos archivos. Para integrar: contrastar decoradores/controladores, DTO, errores, `backend/src/main.ts` y Swagger `/docs` **si está disponible**. Documentar ruta exacta y referencia al commit consultado. Los cambios backend se solicitan a su equipo, nunca se implementan desde esta ruta.

### 2.5 Baseline obligatoria F00

Antes de cualquier cambio:

- Inspeccionar `git status`, rama actual y cambios sin confirmar con comandos **de solo lectura**. No hacer fetch, pull, checkout, switch ni `restore`.
- Comprobar ubicación y versión de documentos; anotar faltantes.
- Leer frontend `package.json`, router, container, endpoints HTTP, tests, styles y componentes de accesibilidad.
- Verificar scripts disponibles. Ejecutar solo comandos no destructivos **aprobados**; cuando una prueba genere archivos temporales, comprobar que no altere trabajo ajeno y describir los artefactos creados. No instalar dependencias sin autorización.
- Revisar el comportamiento de UI en navegador **si el entorno permite inspeccionarlo**; distinguir lo visto de lo inferido.
- Entregar matriz `HU/AC → archivos → estado → pruebas/evidencia → riesgo`.

---

## 3. Accesibilidad: prioridad primera y transversal

La accesibilidad de Kamá **no es una capa ornamental ni una tarea final de QA**. Debe comprobarse en todas las pantallas existentes y especialmente en las guías y actividades, considerando capacidades visuales, motrices y de comprensión de adultos mayores. Se toman como base las **HU-36 a HU-39 del backlog v2.1** y WCAG 2.2 nivel AA; las métricas concretas del backlog pueden ser más exigentes y prevalecen cuando estén aprobadas.

### 3.1 Requisitos exigibles de las HU-36 a HU-39

| Referencia | Requisito | Evidencia esperada |
|---|---|---|
| HU-36 | Texto base **≥18 px** y controles visibles **A- / A+**, con normal, grande y muy grande | Auditoría de CSS/DOM y prueba de preferencias en pantallas distintas. |
| HU-36 | Al aumentar letra no se recorta ni produce scroll horizontal; zoom navegador **200 %** | Prueba en guía, actividad, formulario y panel; captura y reporte. |
| HU-36 | Preferencia visitante recordada en navegador; autenticado en perfil según API | Prueba del adaptador local y contrato de perfil si existe; si no, `BLOCKED_API`. |
| HU-37 | Contraste normal de texto **≥4.5:1** | Ratios medidos en combinaciones reales de texto/superficie. |
| HU-37 | Alto contraste **≥7:1**, con preferencia conservada | Ratios de texto y estados, revisión visual y persistencia. |
| HU-37 | Botones y enlaces identificables **sin depender solo del color** | Prueba de subrayados, bordes, icono+texto y estados. |
| HU-38 | Operaciones con **Tab, Shift+Tab, Enter y Espacio** en orden lógico | Recorrido manual y pruebas automatizadas cuando correspondan. |
| HU-38 | Indicador de foco claramente visible | Captura y verificación de `:focus-visible`, sin controles ocultos. |
| HU-38 | Formularios con `label`, errores asociados y anunciados | Prueba teclado, `aria-describedby`, `aria-invalid`, resumen/foco de errores. |
| HU-38 | Imágenes informativas con **texto alternativo** e iconos decorativos ocultos | Revisión del DOM y lectores de pantalla. |
| HU-38 | Lighthouse CI **≥90** y axe **sin hallazgos graves/críticos**, automatizados en CI según el criterio del backlog | Evidencia de ejecución. Si la configuración de CI compartida falta, registrarla como dependencia, sin editarla sin autorización. |
| HU-39 | Todas las pantallas desde **360 px**, sin desplazamiento horizontal | Prueba móvil de rutas clave y estados error/ayuda. |
| HU-39 | Objetivos táctiles **≥44×44 px** | Medición de controles reales, no solo de su apariencia. |
| HU-39 | Guías utilizables desde móvil mientras se practica en computador | Prueba de lectura y enlace directo en dispositivo/viewport. |

### 3.2 Patrones obligatorios para las correcciones

- **HTML semántico nativo** primero: `button`, `a`, `label`, `input`, `fieldset/legend`, `nav`, `main`, encabezados lógicos, `lang="es"`. No reemplazar botones con `div` clicables.
- Enlace «Saltar al contenido», foco visible con contraste suficiente y recorrido lógico sin trampas de teclado. Después de navegar a una página o cambiar de paso, gestionar el foco coherentemente.
- Formularios con ayuda previa, instrucciones simples, errores vinculados al campo y estado de envío; no comunicar mensajes técnicos como `401`, `DTO`, `JWT` ni stack traces.
- Íconos acompañados de texto cuando comuniquen acciones; imágenes decorativas `alt=""`, imágenes informativas con alternativa que aporte el mismo significado sin copiar texto innecesario.
- Retroalimentación de actividades: texto + símbolo/semántica, nunca solo verde/rojo; anuncio apropiado a lectores de pantalla **después de responder**.
- Mantener `prefers-reduced-motion`, zoom, tamaños de texto mayores y CSS adaptable sin pérdida de contenido o funcionalidad.
- Botón «Ayuda» visible y consistente según HU-28; comprobarlo en inicio, guía, práctica, resultado y formularios.
- Mensajes cortos y comprensibles para adultos mayores, sin infantilización. Una sugerencia de simplificación del **contenido pedagógico** no autoriza a reescribirlo: se eleva al PO.

### 3.3 Alcance y orden recomendado de auditoría

1. **Sistema transversal:** `AccessibilityBar`, `AccessibilityProvider`, `tokens.css`, `global.css`, `RootLayout`, `SiteHeader`, router.
2. **Recorrido educativo público:** inicio → catálogo → detalle de guía → práctica → resultados, en modo invitado.
3. **Autenticación y formularios:** registro, verificación, acceso personal, errores y recuperación.
4. **Progreso, ayuda y administración:** tablas, formularios, permisos, confirmaciones y estados asíncronos.
5. **Móvil/zoom/contraste/lector en todos los flujos**, con pruebas de regresión después de cada corrección.

### 3.4 Matriz de defectos de accesibilidad

Por cada hallazgo registrar:

| Campo | Valor obligatorio |
|---|---|
| ID | `A11Y-001`, `A11Y-002`... |
| Ubicación | Ruta, componente, archivo y estado de UI. |
| Condición | Pasos mínimos para reproducir; dispositivo/ancho; navegador si se conoce. |
| Norma | HU-36/37/38/39 y criterio WCAG específico cuando sea aplicable. |
| Impacto | Qué tarea del usuario se impide o dificulta; severidad justificada. |
| Evidencia | Captura, descripción DOM, ratio medido, resultado axe/teclado/lector. |
| Solución propuesta | Cambio **mínimo**, sin modificar contenido educativo. |
| Prueba de regresión | Método automático y/o manual. |
| Estado | `DETECTADO / APROBADO / EN_IMPLEMENTACIÓN / VERIFICADO / BLOQUEADO`. |
| Responsable | Estudiante revisor y relación al commit/PR **humano**. |

### 3.5 Evaluación con el público objetivo

Cuando sea viable y autorizado, realizar una **prueba cualitativa exploratoria con una persona mayor representativa**, observando si localiza una guía, avanza un paso, completa una respuesta y encuentra ayuda. Anotar dificultades y comentarios sin recolectar datos personales innecesarios. **Una persona no es evidencia de validez estadística ni de conformidad WCAG**; complementar con pruebas técnicas.

### 3.6 Diseño Figma

- El Figma que apruebe el equipo será referencia para **apariencia y consistencia** de la interfaz. Mientras no esté aprobado: auditar los estilos reales, no imponer una paleta nueva.
- Si el Figma contradice los mínimos de contraste, texto o controles, proponer la variante accesible y pedir aprobación.
- Preferir componentes/tokens ya existentes. No introducir mascotas, fuentes externas o assets sin aprobación/licencia y sin revisar sus efectos sobre legibilidad.

---

## 4. Contratos e integración con el backend

### 4.1 Fuente real de cada operación

Por cada consumo HTTP documentar: **método, ruta exacta, parámetros, DTO de entrada/salida, errores, rol, cookie/token, evidencias y commit del backend**. Si el código fuente y Swagger difieren, marcar `BLOQUEADO_CONTRATO`; no inventar rutas para que una vista parezca conectada.

**Áreas de integración a contrastar:**

| Frente FE existente | Adaptador FE | Controladores BE a consultar (solo lectura) |
|---|---|---|
| Categorías y guías | `HttpGuiasRepository.ts` | `categoria.controller.ts`, `guia.controller.ts`, `gestion-guia.controller.ts` |
| Registro, OTP, sesión | `HttpAuthRepository.ts` | `registro.controller.ts`, `sesion.controller.ts`, `cuenta.controller.ts` |
| Personal | `HttpPersonalRepository.ts` | `personal.controller.ts`, `sesion-personal.controller.ts`, `password-inicial.controller.ts` |
| Actividades | `GuiaPracticaPage.tsx` y lógica asociada | `practica.controller.ts` y DTO de práctica |
| Ayuda | `AyudaPage.tsx` | `solicitud-ayuda.controller.ts` |

**Nota:** la tabla representa archivos identificados por nombre, no afirma rutas ni integraciones ya verificadas. El backend puede haber cambiado desde el árbol compartido.

### 4.2 Contratos y adaptadores: política

- Reutilizar puertos, casos de uso y `Http*Repository` existentes. No insertar `fetch()` ad hoc en páginas si hay infraestructura de acceso a datos ya construida.
- Mantener tipos de dominio separados de DTO de transporte cuando la arquitectura lo requiera.
- Los mocks en memoria existentes se conservan como herramienta de pruebas o demostración explícita, no como sustitutos silenciosos de APIs reales. Estados: `VERIFICADO_REAL`, `MOCK_EXPLÍCITO`, `BLOQUEADO_API`.
- Una pantalla con mock puede estar **verificada en presentación** pero no **integrada**. Nunca calificarla como completamente operativa si el caso requiere servidor.
- Manejar `loading`, `empty`, `success`, `error`, `offline` si aplica, `unauthorized/forbidden`, validación y reintentos sin resultados ficticios.
- No exponer respuestas correctas antes de enviar una respuesta cuando así lo exige el contrato; la API o un mecanismo educativo **aprobado para invitado** debe resolver qué información devuelve y cuándo. No copiar `es_correcta` en los datos iniciales públicos sin aprobación.
- No almacenar contraseñas, códigos OTP, refresh tokens o claves en logs, capturas ni `localStorage` por iniciativa propia. Comprobar cómo se maneja la sesión realmente.
- Si falta un endpoint necesario, levantar incidencia al equipo backend y continuar solo con tareas frontend independientes aprobadas; no implementar el endpoint.

### 4.3 Plantilla breve de contrato

```md
### API-XX — Operación
- Estado: OBSERVADO / VERIFICADO / MOCK_EXPLÍCITO / BLOQUEADO_API
- Backend: archivo, commit o Swagger consultado:
- HTTP: método + ruta exacta:
- Autenticación/rol:
- Request: parámetros y cuerpo tipados:
- Response: éxito y forma de error:
- Consumidor: puerto/repositorio/caso de uso/página:
- Prueba y evidencia:
- Decisiones pendientes:
```

---

## 5. Modelo de trabajo ODD: control académico y humano

**ODD** se usa aquí como un **proceso de trabajo incremental orientado a unidades pequeñas, revisión del estado real, especificación mínima verificable, pruebas y aprobación humana**. Si en el entorno hay una herramienta/plugin adicional que automatiza ODD, **debe respetar estas reglas locales**; ninguna convención de la herramienta puede autorizar commits, acciones backend o saltarse aprobaciones.

### 5.1 Separación estricta de responsabilidades

| Participante | Autorizaciones y responsabilidades |
|---|---|
| Equipo / PO | Aprobar alcance, prioridades, contenido, diseños y decisiones de producto. |
| Revisor frontend | Aprobar unidad y archivos afectados, revisar cambios y pruebas, comprobar que no haya cambios de contenido no autorizados. |
| Claude Code | Diagnosticar, proponer, **esperar permiso**, implementar solo una unidad aprobada dentro de FE, probar, documentar y detenerse. |
| Estudiante autor del cambio | Comprender y revisar el código, ejecutar pruebas y **realizar manualmente** rama/staging/commit/push/PR bajo las reglas de la asignatura. |
| Equipo backend | Resolver contratos, permisos y cambios de servidor, fuera del alcance de Claude frontend. |

### 5.2 Ciclo obligatorio por unidad

1. **RECONOCER (solo lectura):** identificar HU/AC pertinentes, componentes existentes, pruebas, contratos y defectos reproducibles.
2. **ESPECIFICAR:** escribir o proponer una ficha breve de la unidad (qué se corrige, por qué, exclusiones, usuarios afectados, criterios, pruebas, rutas y archivos previstos).
3. **PLANIFICAR:** dividir en tareas pequeñas; justificar cambios de dependencias, diseño y riesgo; **no editar todavía**.
4. **APROBACIÓN HUMANA 1:** estudiante/revisor indica de forma explícita **«Apruebo implementar UXX/T001–T00N»** o equivalente. El silencio no es aprobación.
5. **IMPLEMENTAR:** tocar únicamente los archivos aprobados; preservar contenido educativo y comportamiento existente; no modificar backend ni ejecutar Git de escritura.
6. **VERIFICAR:** correr pruebas autorizadas, lint/build cuando existan, controles de accesibilidad; documentar evidencias y fallos.
7. **ENTREGAR Y DETENERSE:** incluir matriz por criterio `PASS_FE / PASS_INTEGRATED / MOCKED / FAIL / BLOCKED_API / BLOCKED_DECISION / NOT_TESTED`, archivos, diff, riesgos, capturas y sugerencia de mensaje de commit. **No avanzar a otra unidad.**
8. **REVISIÓN HUMANA 2 Y COMMIT:** estudiante verifica el resultado y ejecuta manualmente su staging, commit y otras operaciones Git. Claude **no** ejecuta esos comandos ni declara que el commit existe hasta que el equipo lo confirme.
9. **SIGUIENTE UNIDAD:** solo después de aprobación explícita tras la revisión/commit humano.

Se puede usar un documento breve tipo `spec.md` / `plan.md` / `tasks.md` cuando ayude a controlar una unidad, preferentemente en **una sola estructura acordada**. No es necesario generar tres archivos para un defecto pequeño. No instalar Spec Kit por el mero hecho de que el archivo anterior lo describía.

### 5.3 Política Git — exclusiva de estudiantes

**Permitido para Claude (solo lectura y sin opciones de escritura):** `git status`, `git diff`, `git log`, `git show`, `git branch --show-current`, `git ls-files`.

**Prohibido para Claude:** `git add`, `commit`, `push`, `pull`, `fetch`, `switch`, `checkout`, `merge`, `rebase`, `reset`, `restore`, `stash`, `clean`, `cherry-pick`, `tag` (creación o eliminación), `branch` (creación, eliminación, renombre) y **cualquier operación equivalente mediante APIs, subagentes o scripts**. No modificar directamente `.git/`, hooks o configuración del repositorio. No abrir ni cerrar PR en nombre del estudiante.

- El alumnado decide qué líneas incluir en staging (`git add -p` manual si ayuda), el mensaje Conventional Commits, la rama, el PR y la integración.
- Los commits deben representar **un cambio coherente y comprobable**, no una avalancha de funcionalidades.
- Cada integrante debe poder explicar los cambios que firma y respetar la política de uso de IA de la materia.
- `CLAUDE.md` es una regla textual, **no una barrera técnica infalible**: configurar permisos/herramientas para denegar comandos Git de escritura y revisar cada ejecución.
- Si `git status` muestra trabajo ajeno, no hacer limpiezas automáticas; el estudiante decide cómo proceder.

### 5.4 Restricciones de escritura por directorio

| Ruta | Regla |
|---|---|
| `frontend/src/**`, tests en `frontend/**`, estilos y activos autorizados | Escritura **solo** durante unidad expresamente aprobada. |
| `frontend/package.json`, `frontend/pnpm-lock.yaml` | Solo después de justificar y aprobar instalación/cambio de dependencias. |
| `frontend/Dockerfile`, `frontend/nginx.conf` | Requiere autorización específica del dueño de infraestructura; no forma parte de unidades ordinarias. |
| `docs/Kama_Plan_Maestro_Frontend_SDD.md`, `frontend/CLAUDE.md` y documentación FE | Modificación **solo con aprobación del equipo**; no reescribir reglas unilateralmente. |
| `backend/**` incluido `backend/CLAUDE.md`, `prisma`, semillas y tests | **LECTURA EXCLUSIVA**, no escribir, ni ejecutar migraciones o scripts que muten datos. |
| `docker-compose.yml`, `.github/**`, scripts raíz y configuración compartida | **NO ESCRIBIR** sin acuerdo específico del responsable; y nunca modificar BE como parte de una tarea FE. |
| `.git/**` | **NO ESCRIBIR**, siempre gestionado por estudiantes. |

---

## 6. Ruta de implementación y revisión por etapas

**Las etapas F00–F10 son una hoja de ruta técnica propuesta y adaptable; NO redefinen los sprints históricos.** Una etapa no obliga a programar: si F00 comprueba que algo ya está completo, se conserva y se registra la evidencia. El orden posterior se ajusta al diagnóstico y a la aprobación humana. **Accesibilidad se revisa desde F00 y en toda unidad; el primer incremento de código debe priorizar un defecto accesible comprobado.**

| Etapa | Objetivo | Inspección inicial / archivos relevantes | Entregable y puerta de salida |
|---|---|---|---|
| **F00** | Diagnóstico de solo lectura | Todo `frontend/src/**`, rutas, estilos, repositorios, pruebas, documentación y DTO BE en lectura | Baseline verificada, matriz HU/AC, hallazgos a11y, contratos, propuesta de primera unidad. **Sin modificaciones.** |
| **F01** | Accesibilidad transversal | `AccessibilityBar`, `AccessibilityProvider`, `tokens.css`, `global.css`, layout, router | Correcciones pequeñas aprobadas + pruebas de tamaño, alto contraste, foco y navegación. |
| **F02** | Experiencia pública accesible | `HomePage`, `GuiasPage`, `GuiaDetallePage` | Navegación y lectura revisadas; preservar contenido, probar 360px/zoom/teclado. |
| **F03** | Actividades y resultados accesibles | `GuiaPracticaPage`, `GuiaResultadosPage` | Opciones y feedback accesibles, sin cambiar preguntas ni respuestas. |
| **F04** | Autenticación accesible y segura | `CrearCuentaPage`, `IniciarSesionPage`, `VerificarAccesoPage`, repositorio HTTP | Validación, foco, errores y estados; API real comprobada o bloqueo indicado. |
| **F05** | Personal y administración | `GestionPersonalPage`, acceso personal y vistas existentes | Formularios, listados, 403/roles y navegación auditados. |
| **F06** | Ayuda | `AyudaPage`, enlaces de ayuda, componentes y contratos | Ayuda fácil de encontrar, solicitar, comprender y cancelar si servicio disponible. |
| **F07** | Progreso | `ProgresoPage`, estado local, contratos reales | Invitado sin persistencia educativa; autenticado según API verificada. |
| **F08** | Integración y defectos FE restantes | Adaptadores `Http*` existentes y rutas actuales | Contratos y manejo de errores verificados; **ningún cambio backend**. |
| **F09** | QR, móvil, presentación y usabilidad | Rutas públicas, componentes y estados; diseño aprobado si existe | Acceso público por QR según HU-45, revisión 360px/200%, prueba cualitativa. |
| **F10** | Regresión y cierre | Pruebas, accesibilidad, build, criterios activos y documentación | Evidencia integral, pendientes honestos, revisión humana y PR/commits hechos por estudiantes. |

**Regla de avance:** si al concluir F00 el equipo identifica un defecto crítico en actividades que perjudica a usuarios mayores, puede atenderse antes de F02 o subdividirse F01. **No usar la tabla como licencia para reescribir todas las páginas**.

### 6.1 Estructura mínima de cada ficha de unidad

```md
# U-A11Y-001 — Nombre descriptivo
Estado: PROPUESTA / APROBADA / EN_IMPLEMENTACIÓN / VERIFICADA / BLOQUEADA
HU/AC: HU-36... (citar criterios exactos vigentes)
Pantalla/componente:
Problema observado y pasos de reproducción:
Alcance autorizado:
Fuera de alcance: contenido pedagógico, backend, refactorización amplia
Archivos que se espera tocar:
Dependencia de API/diseño:
Pruebas previstas (automáticas y manuales):
Revisor/aprobador humano:
Resultado real de pruebas:
Archivos realmente modificados:
Commit/PR: pendiente hasta realización manual por el estudiante
```

### 6.2 Regla para escoger la primera unidad

Seleccionar **un defecto de accesibilidad reproducible**, idealmente compartido (tamaño de texto, contraste, foco, teclado o feedback), con impacto evidente y pocos archivos afectados. Priorizar seguridad o funcionamiento solo cuando haya bloqueo grave, con explicación al equipo y autorización. No elegir una pantalla por preferencia del agente.

---

## 7. Trazabilidad y planificación histórica

### 7.1 Conservación de los tres sprints aprobados

**La planificación histórica no se cambia** aunque las etapas ODD se ejecuten en otras fechas. El backlog v2.1 documenta **28 historias Must, 105 puntos**, distribuidas así:

| Sprint histórico | Fechas 2026 | Historias Must según backlog v2.1 | Puntos |
|---|---|---|---:|
| **1** | 03–05 nov | HU-01 (5), HU-02 (3), HU-03 (2), HU-04 (5), HU-05 (3), HU-06 (3), HU-09 (3), HU-10 (5) | **29** |
| **2** | 06–09 nov | HU-13 (8), HU-15 (3), HU-17 (3), HU-18 (3), HU-19 (3), HU-20 (3), HU-21 (3), HU-23 (5), HU-25 (5) | **36** |
| **3** | 10–12 nov | HU-26 (3), HU-27 (3), HU-28 (3), HU-29 (5), HU-30 (5), HU-31 (5), HU-36 (3), HU-37 (3), HU-38 (5), HU-39 (3), HU-45 (2) | **40** |
| **Total** | — | **28 Must** | **105** |

Cada unidad ODD se registra con **su fecha de trabajo real**. Nunca atribuir trabajos realizados posteriormente a los días históricos de sprint. No mover HU, cambiar puntos o prioridades para acomodar commits.

### 7.2 Matriz trazable de ejecución

Para cada HU activa o defecto asociado se registrará, en el diagnóstico y/o ficha de unidad:

| Campo | Contenido |
|---|---|
| Identificador | `HU-xx` + criterio específico `AC` de v2.1 o `A11Y-xxx` para hallazgo transversal. |
| Estado inicial | `VERIFICADO_EN_EJECUCIÓN`, `PARCIAL`, `NO_VERIFICADO`, `PENDIENTE`, `BLOQUEADO_API`, `BLOQUEADO_DECISIÓN`. |
| Evidencia inicial | Ruta, archivo, test, captura, resultado real; indicar entorno/commit. |
| Unidad ODD | Identificador, tarea(s) aprobadas, fecha y revisor. |
| Cambio | Archivos tocados y objetivo. |
| Resultado | `PASS_FE`, `PASS_INTEGRATED`, `MOCKED`, `FAIL`, `BLOCKED_API`, `NOT_TESTED`. |
| Registro académico | Autor del commit **humano**, SHA si existe, PR si existe, capturas y evidencia. |

No confundir **AC del backlog original** (documentación histórica externa) con criterios del **backlog v2.1**, que sustituyó el contenido de HU-17–20 y actualizó alcance. Para contenido ya implementado se registra **conservado / no modificado**, no se fuerza una reescritura para satisfacer un documento histórico.

### 7.3 Alcance por prioridad

- **Must:** foco de verificación respecto a requisitos vigentes, sin reconstruir lo completo.
- **Should:** solo si el PO autoriza su inclusión y no pone en riesgo los Must.
- **Could/Won't:** fuera de ejecución por iniciativa del agente.
- **HU-16:** exclusión del MVP confirmada en el backlog v2.1; no habilitar CRUD de categorías.
- **HU-25/26/27:** contenidos transversales dentro de las guías aprobadas según backlog; no autoriza cambiar material actualmente implementado sin aval del PO.

---

## 8. Definición de Preparado (DoR) y Terminado (DoD) para frontend

### 8.1 DoR: una unidad se puede autorizar cuando

- [ ] Se sabe qué comportamiento o defecto **real** se abordará y cómo reproducirlo.
- [ ] Se conoce su HU/criterio o requisito accesible correspondiente, con fuente vigente.
- [ ] Se especifica lo que se **conserva** y lo que **no** se puede editar, especialmente contenido.
- [ ] La solución propuesta es pequeña, con archivos previstos, efectos secundarios y pruebas previstas.
- [ ] Se identificaron dependencias de API, permisos, diseño o contenido y su estado.
- [ ] El revisor humano autorizó expresamente el alcance.
- [ ] La rama actual y trabajo de compañeros están revisados por un estudiante.

### 8.2 DoD: una unidad de implementación está lista para revisión humana cuando

- [ ] El resultado satisface los criterios **aplicables** y no altera el contenido educativo sin aprobación.
- [ ] No existe modificación en `backend/**` ni en archivos compartidos protegidos.
- [ ] El código conserva la arquitectura por capas y no introduce duplicaciones injustificadas.
- [ ] Tests automáticos aplicables ejecutados con resultados documentados; si no existen, se declara y se proponen.
- [ ] Lint/build/format-check ejecutados cuando existan los scripts y dependencias instaladas, sin auto-fix ajeno.
- [ ] Se probó lo relevante de teclado, foco, lector de pantalla, contraste, zoom, 360px y targets táctiles, con **evidencia**, no con afirmaciones genéricas.
- [ ] Estados de carga/error/vacío y mensajes son comprensibles y accesibles cuando fueron afectados.
- [ ] Integraciones con servidor se distinguen de mocks; ningún endpoint inventado.
- [ ] Las limitaciones, riesgos y bloqueos quedan explicados.
- [ ] Claude entrega el reporte final y **se detiene sin ejecutar Git de escritura**.

**Cierre académico posterior, exclusivamente humano:** revisión del diff, verificación propia del estudiante, staging y commit, push y PR según el flujo de la materia. **La verificación de Claude no equivale a un commit ni a aprobación del revisor.**

### 8.3 Verificaciones a elegir según scripts reales

Inspeccionar primero `frontend/package.json`. Ejemplos de comandos **solo si están definidos y aprobados**:

```bash
cd frontend
pnpm format:check       # si existe
pnpm lint               # si existe; no --fix sin autorización
pnpm build              # si existe
pnpm test               # si existe; usar modo no-watch adecuado al script
```

No ejecutar `pnpm install`, cambios de `package.json` ni actualizaciones de lockfile sin autorización previa. El uso de Playwright, Lighthouse CI o axe en CI depende de herramientas y configuración realmente presentes; si falta la automatización exigida por HU-38, informarlo como brecha y solicitar aprobación para el archivo compartido que corresponda.

### 8.4 QA de accesibilidad por pantalla y estado

| Flujo | Mínimos a probar |
|---|---|
| Inicio/catálogo | Encabezados, categorías, botón principal, ayudas y estado vacío/error. |
| Guía | Lectura de contenido existente, foco al cambiar de paso, imágenes, 200 %, A+/contraste. |
| Actividad | Selección con teclado, radiogroup/fieldset, feedback anunciado, resultados, no pistas prematuras. |
| Registro y sesión | Labels, consentimiento, OTP, errores, enfoque, permisos. |
| Ayuda | Botón constante, solicitud, confirmación/cancelación y mensajes dinámicos. |
| Personal/admin | Tablas, filtros, diálogo de confirmación, 403 y tamaños táctiles. |
| Progreso | Barras con texto/porcentajes legibles; bloqueo invitado amable. |
| Móvil | Desde 360 px, sin scroll horizontal y con objetivos ≥44×44. |

---

## 9. Documentación complementaria y compatibilidad con Claude Code

### 9.1 Un solo plan operativo

- **Este archivo y `frontend/CLAUDE.md` son los únicos dos documentos operativos obligatorios dentro del repositorio frontend.** No crear un segundo plan, una jerarquía de `specs/`, carpetas `docs/fuentes/` o más archivos de control por iniciativa de Claude.
- **El backlog validado, modelo v2.0 y evidencias académicas pueden permanecer fuera del repositorio.** El equipo puede facilitar sus criterios completos por tarea, cuando se necesiten; Claude debe reconocer cuando no los tiene.
- Los documentos antiguos SDD/ODD, si siguen en `docs/`, son **históricos**, no instrucciones adicionales. El modelo v1.0 no prevalece sobre v2.0.
- El plan SDD propuso instalar Spec Kit y reorganizar carpetas; ninguna de esas propuestas es una autorización actual. Las especificaciones breves de tareas pueden entregarse directamente en la conversación sin crear archivos nuevos.
- Solo se incorporará documentación extra si el equipo aprueba su necesidad y ubicación.

### 9.2 Integración con `CLAUDE.md`

Este paquete incluye un **`frontend/CLAUDE.md` listo para copiar**, vinculado a este plan. Si ya existe otro archivo en esa ruta, **compararlo y revisar su sustitución antes del commit humano**. Nunca editar `backend/CLAUDE.md`. Al abrir Claude desde `frontend/`, el plan está en `../docs/Kama_Plan_Maestro_Frontend_SDD.md`; desde la raíz está en `docs/Kama_Plan_Maestro_Frontend_SDD.md`.

El archivo complementario `frontend/CLAUDE.md` concreta los límites operativos, autorizaciones, revisión de accesibilidad y prohibiciones Git de este plan. Si difieren, **detener la acción afectada y solicitar aclaración humana**, sin declarar que un archivo invalida automáticamente el otro.

Si herramientas/agentes automáticos ejecutan comandos Git por defecto, **deshabilitar esas acciones en permisos**. El plan y `CLAUDE.md` por sí solos no garantizan una prohibición técnica.

### 9.3 Gestión de discrepancias y decisiones abiertas

| ID | Situación | Tratamiento |
|---|---|---|
| DOC-01 | El SDD v1.0 propuso cinco escenarios; backlog v2.1 valida cuatro guías, y el equipo indicó que el contenido implementado cumple el propósito. | **No modificar contenido.** F00 inventaría material y fuentes; PO resuelve cualquier divergencia documental sin perder material útil. |
| DOC-02 | El SDD v1.0 describe una demo Vite y backend sin módulos funcionales; árbol posterior contiene páginas, casos de uso, tests y controladores. | Actualizar estado **solo con auditoría de código y pruebas**. No asumir que todo está integrado. |
| DOC-03 | Backlog v2.1 y modelo v2.0 pueden permanecer externos; el `CLAUDE.md` anterior citaba rutas inexistentes. | Esta versión elimina las rutas obligatorias. Solicitar al equipo los criterios o reglas externas **solo cuando la unidad lo requiera**; no inventarlos. |
| DOC-04 | `frontend/CLAUDE.md` apareció en un árbol anterior pero no en el último. | Antes de copiar el nuevo, verificar la ruta real y comparar si ya existe; el equipo decide cómo incorporarlo. |
| DEC-01 | Finalidad de recolectar fecha de nacimiento (HU-01) no acreditada en el material entregado. | Bloquear **nuevos cambios** de captación de datos hasta resolución PO/privacidad; no reescribir el flujo sin permiso. |
| DEC-02 | Modificar pasos de una guía publicada puede afectar progreso. | No ejecutar cambios destructivos; consultar PO/BE sobre regla. |
| DEC-03 | Figma actual y paleta aprobada no constan en el árbol. | No asumir diseño nuevo; auditar estilos reales y aplicar contrastes requeridos. |
| DEC-04 | Contratos API y estados de integración no se han validado contra código en ejecución. | Auditoría F00; no afirmar integración por presencia de controller o HTTP repository. |
| DEC-05 | Algunos requisitos del backlog exigen CI/axe/Lighthouse y la configuración compartida puede requerir cambios. | Reportar brecha y solicitar coordinación con dueño de infraestructura antes de tocar `.github/`. |

**Se pueden iniciar diagnósticos y correcciones independientes de contenido mientras otras decisiones siguen abiertas**, siempre que la unidad concreta tenga alcance y criterios claros y esté aprobada.

---

## 10. Plantillas operativas listas para utilizar

### 10.1 Primer prompt: F00 sin editar

> Realiza **solo F00**, diagnóstico de **solo lectura** del frontend Kamá. Antes de cualquier acción lee `docs/Kama_Plan_Maestro_Frontend_SDD.md`. El backlog v2.1 y modelo v2.0 pueden ser externos: **no exigir copiarlos**; solicita solo los criterios o reglas pertinentes si son imprescindibles y no están disponibles. Inspecciona `frontend/src` y configuración actual, `frontend/package.json`, router, componentes de accesibilidad, estilos y tests. Examina contratos del backend **solo en lectura** y Swagger si existe; contrasta contra repositorios HTTP. Identifica problemas reproducibles de accesibilidad en HU-36–39 sin cambiar el contenido educativo. Presenta inventario de funcionalidades existentes por evidencia, matriz de defectos, estado de pruebas e integración y **una primera unidad pequeña a proponer**. **No modifiques archivos; no instales dependencias; no ejecutes Git de escritura; no hagas commits.** Detente y espera aprobación.

### 10.2 Prompt para autorizar un incremento

> Apruebo únicamente la unidad **[ID]** de accesibilidad descrita en **[versión del plan de unidad]**, en los archivos **[rutas exactas]**. Conserva íntegros el contenido educativo y el backend. Implementa el cambio mínimo, ejecuta las pruebas acordadas y presenta el informe por criterios. **No realices comandos Git de escritura ni continúes otra unidad**. Espera revisión humana.

### 10.3 Plantilla de reporte final de Claude

```md
# Informe de unidad ODD — [ID]
- Objetivo y criterio HU/AC:
- Autorización recibida (qué se aprobó):
- Archivos modificados y motivo:
- Contenido educativo: SIN CAMBIOS / CAMBIOS APROBADOS [referencia]
- Backend: SIN CAMBIOS
- Verificación automática: comando, resultado exacto, fallos:
- Verificación manual (teclado, lector, móvil, zoom, contraste): evidencia real:
- Estado por AC: PASS_FE / PASS_INTEGRATED / FAIL / MOCKED / BLOCKED / NOT_TESTED
- Riesgos y limitaciones:
- Propuesta de mensaje Conventional Commits **para estudiante**:
- Estado: ESPERANDO REVISIÓN Y COMMIT HUMANO
```

### 10.4 Checklist de revisión y commit por el estudiante

1. Comprobar `git status` y diff; verificar que solo cambia frontend autorizado (y la documentación expresamente aprobada).
2. Revisar que no se alteró ningún contenido educativo, pregunta, opción, explicación, resultado o semilla sin consentimiento.
3. Ejecutar las pruebas y comprobar visualmente el defecto corregido.
4. Registrar evidencia/captura y comentario de revisión; corregir manualmente o devolver a Claude si hay fallos.
5. Realizar **personalmente** el staging/commit; por ejemplo, escoger archivos concretos o `git add -p`; redactar mensaje Conventional Commits representativo.
6. Gestionar push y PR personalmente según la política del equipo; registrar SHA y revisor. No afirmar éxito hasta comprobarlo.
7. Autorizar la siguiente unidad, no antes.

---

## 11. Criterios de aceptación de esta versión del plan maestro

El equipo puede aprobar este documento como fuente operativa cuando:

- [ ] Ratifica que el frontend **existente** es la única base de implementación, sin scaffolding nuevo.
- [ ] Ratifica la preservación del contenido educativo real y el procedimiento para conflictos documentales.
- [ ] Confirma quién custodia el **backlog v2.1** y el **modelo v2.0** fuera del repositorio y cómo compartir criterios cuando hagan falta; no obliga a incorporarlos.
- [ ] Confirma el límite de escritura a FE y documentación autorizada, con BE solo lectura.
- [ ] Acepta F00 y primera prioridad de accesibilidad HU-36–39.
- [ ] Acepta compuertas de aprobación y **Git exclusivamente humano** con protecciones técnicas cuando sea posible.
- [ ] Decide cómo quedará reflejado en `frontend/CLAUDE.md`, evitando reglas contradictorias.
- [ ] Define responsable/revisor de cada unidad y documenta la aprobación.

**Registro de aprobación (completar por el equipo, no por Claude):**

| Rol o responsabilidad | Nombre | Decisión | Fecha |
|---|---|---|---|
| Product Owner / alcance | __________________ | Pendiente | ______ |
| Responsable frontend | __________________ | Pendiente | ______ |
| Revisor QA/accesibilidad | __________________ | Pendiente | ______ |
| Responsable coordinación | __________________ | Pendiente | ______ |

> **Nota de gobierno:** hasta que estas aprobaciones consten, el documento es una **propuesta completa lista para revisión**, no una decisión ya ratificada. El diagnóstico F00 puede realizarse bajo una autorización específica del equipo sin declarar aprobado todo el plan.

---
