# Kamá — BACKEND: tareas ejecutables y contratos de integración

**Versión:** 2.0 — propuesta técnica para aprobación por frontend, backend y Product Owner · **Fecha:** 26/11/2026  
**Objetivo:** cerrar todas las historias Must con trabajo **realmente paralelo** y contratos explícitos desde el comienzo, sin reconstruir los módulos existentes.  
**Alcance del documento:** tareas backend y **copia completa del mismo catálogo de contratos** que utiliza el otro equipo. Este archivo se puede usar de forma independiente en GitHub Projects o como instrucción para Claude Code.  
**No es un acta de aprobación.** Los contratos marcados **PROPUESTO** requieren acuerdo de los dos equipos antes de implementarse en producción; ningún dato nuevo se presenta como si ya existiera.

## 0. Fuentes, prioridades y evidencia

1. **Fuente de requisitos:** `Backlog_Kama_V2.1_validado.md` (45 HU, 28 Must) y decisiones formales de PO, mantenidos como fuentes del equipo, no necesariamente dentro del repositorio.
2. **Modelo de persistencia:** `Modelo_de_Datos_Kama_v2.0.docx` (23 tablas, distinción invitado/registrado, datos mínimos).
3. **Estado observado:** informe F00 de Claude Code proporcionado por el equipo el 26/11/2026 (FE 65/65 tests, lint/build OK, CRUD educativo, prácticas y ayuda parcialmente integradas, HTTP comprobado contra BD).
4. **Código contrastado:** `Carlosam7/plataforma-autoaprendizaje-clena-backend`, rama `dev`, árbol Git SHA `f633e577b5cbb59a4d81b151ce92340b8d5cf4e2`, controladores, DTO y repositorios FE/BE consultados. **Puede diferir de la rama de trabajo local.** No sustituyen la revisión y ejecución de la rama actual.
5. **Plan operativo frontend:** `docs/Kama_Plan_Maestro_Frontend_SDD.md` y `frontend/CLAUDE.md`. La priorización de cierre de este documento propone ejecutar integraciones funcionales primero; adaptar los documentos operativos mediante PR documental, sin reescribir historias ni sprints.

**Convenciones:** `P0` = imprescindible para demo y cierre de historias Must; `P1` = Must restante/estabilización; `EXISTENTE` = ruta + DTO visibles en la rama `dev`; `F00` = comprobado por Claude en su entorno; `PROPUESTO` = contrato que todavía NO está implementado ni aprobado; `POR_VERIFICAR` = código/contrato puede existir fuera de lo revisado. **La presencia de un archivo no es evidencia de implementación funcional.**

**Decisiones de alcance que no se alteran en este documento:** las HU-36–39 siguen siendo Must aunque se reprogramen para después de integraciones; HU-16 es Won't; HU-25–27 son transversales; contenido educativo existente se conserva, sin borrar guías ni semillas. En la versión MVP formal se describen 4 guías y una categoría Phishing; F00 vio 15 guías en 5 categorías. Esa discrepancia se registra como **D-01 (Product Owner)**, sin ocultar ni eliminar datos unilateralmente. **D-02:** finalidad de fecha de nacimiento. **D-03:** progreso tras editar pasos de una guía publicada.

## 1. Acuerdo operativo para trabajar simultáneamente

**El contrato se congela antes del código, no el código antes del contrato.** Ambas personas responsables aprueban literalmente este catálogo (IDs C-01 a C-11), indicando si la implementación coincide. Un cambio de ruta, nombre de propiedad, enum o error exige actualización simultánea de ambas copias del catálogo, revisión cruzada y tests; no se inventan nombres unilateralmente.

- **Regla A — trabajo sin esperar:** FE crea tipos y puertos TS en `domain/application`, adaptador HTTP y pruebas con respuestas contractuales fijas en **tests**. BE implementa casos de uso/DTO/Swagger y e2e con esos mismos ejemplos. Se pueden crear pantallas/UI basadas en fixtures de test, pero **nunca activar fallback silencioso en producción**.
- **Regla B — integration gate:** una tarea se marca `CONTRATO_VERIFICADO` cuando request + response + errores + permisos + paginación/cookies están confirmados con el servidor; `PASS_FE` cuando la UI y tests FE pasan; `PASS_BE` cuando la API y e2e BE pasan; y `PASS_INTEGRATED` solo tras prueba FE→HTTP→BD real. `MOCK_ONLY` no es Done.
- **Regla C — versionado:** rutas existentes se preservan; toda ruta nueva lleva `/api/v1`, DTO camelCase JSON, fechas ISO 8601 UTC, UUID string, cantidades numéricas enteras y enum en mayúsculas (salvo bloque de guía `tipo` y `nivel`). Cambios incompatibles: versión de API o migración acordada; no romper a consumidores existentes.
- **Regla D — privacidad:** sin sesión se puede leer, practicar y solicitar ayuda, pero invitados **no** guardan `intento`, `respuesta_intento`, `progreso_guia` ni `paso_leido` en BD ni localStorage/sessionStorage. `consulta_guia` y `solicitud_ayuda` sí pueden existir anónimas. Datos de cuentas y admin solo con autorización y pruebas ficticias.
- **Regla E — Git:** GitHub Flow con issues FE/BE relacionados, rama `feat/<numero-issue>-...`/`fix/...`/`docs/...`, commits Conventional Commits y PR con aprobación + CI verde. **Agente Claude no hace commits, push, merge ni cambios Git de escritura**; estudiantes controlan esas acciones. Cambios fuera de `frontend/` o `backend/` requieren revisión compartida.
- **Regla F — evitar bloqueos técnicos:** se podrán fusionar en ramas propias implementaciones de FE contra test doubles, marcadas como no integradas, pero no declarar finalizada ni desplegar una funcionalidad que requiera API aún ausente. Si el BE detecta un impedimento, entrega `BLOCKED_CONTRACT` con razón y alternativa concreta ese mismo incremento; FE continúa tareas independientes.

### Entrega mínima de cada PR

Cada PR debe incluir: ID tarea, HU y criterios exactos vinculados, contrato C-XX y su estado, rutas/métodos/campos, ejemplos JSON, tabla de errores, autenticación/cookie/roles, pruebas unitarias y E2E/contract-tests, migración si corresponde, `PASS_FE/PASS_BE/PASS_INTEGRATED`, capturas o evidencia, decisiones pendientes y riesgos. No modificar `package.json`, lockfile, infraestructura ni semillas fuera del alcance aprobado.

### Matriz de emparejamiento (cada fila puede arrancar el mismo día)

| Frente | Frontend | Backend | Contrato y modo de avance paralelo | Entrega de integración |
|---|---|---|---|---|
| R1 — catálogo y estabilidad | FE-03, FE-12 | BE-08 | C-01, C-02; FE elimina fallback y BE valida catálogo | Catálogo real y error explícito |
| R1 — práctica | FE-01, FE-02 | BE-01 | C-03 existente + C-04 propuesto; FE fixture+UI; BE eval sin persistencia | Invitado y registrado, resultados reales |
| R1 — ayuda | FE-04 | BE-02 | C-05 y C-06; FE formulario+estado, BE ownership/concurrencia | Solicitar→ver→cancelar y dedupe |
| R2 — guías del personal | FE-05 | BE-06, BE-07 | C-07 verificado; editor en `/personal/guias` (rama `feat/be-06-fe-05-06-guias-cola`) | Crear→editar→publicar→ocultar |
| R2 — cola monitores | FE-06 | BE-02, BE-06 | C-06 verificado; cola en `/personal/cola` con sondeo de 15 s (rama `feat/be-06-fe-05-06-guias-cola`) | Dos monitores, una toma |
| R2 — cuentas | FE-09, FE-10 | BE-05 | C-08, C-09 existentes y verificados (rama `feat/be-05-fe-09-10-auth`) | Registro/OTP, personal, eliminación |
| R2 — progreso | FE-07 | BE-03 | C-10 existente (verificado en BE-03); FE UI contra la API real | Persistencia por usuario |
| R2 — estadísticas | FE-08 | BE-04 | C-11 propuesto; FE gráficos con fixture; BE agregaciones | Panel real por fechas |
| R3 — QR y deploy | FE-11, FE-14 | BE-09 | C-00 despliegue y C-01 QR verificados (rama `feat/be-09-fe-11-infra-qr`); FE-14 pendiente | URL pública desde teléfono |
| R3 — calidad Must | FE-13 | BE-09/CI | HU-36–39 (sin nuevo endpoint obligatorio) | Evidencia de accesibilidad y CI |

**Secuencia para evitar conflictos:** acordar C-04/C-10/C-11 y seguridad C-05 **al inicio**; FE-03/04/05/06/09/10 pueden avanzar sobre rutas existentes. FE-01 desarrolla soporte de UUID/opciones y resultado sin esperar C-04; BE-01 entrega el canal invitado en paralelo. FE-07/08 crean interfaz y tests con fixtures contractuales mientras BE-03/04 entrega API. Un único integrador valida el flujo completo por cada contrato.

## 2. Catálogo de contratos compartidos (texto idéntico en ambos documentos)

**Identificador de catálogo:** `KAMA-API-CLOSE-2026-11-27-v2.1` (v2.1: C-03 exige cuenta y C-04 pasa a EXISTENTE con BE-01, PR #93). Los contratos EXISTENTE fueron revisados en controladores/DTO en `dev` y deben **revalidarse en la rama donde se hagan los PR**; los PROPUESTO constituyen un diseño de integración para aceptar. Todos los paths son relativos al prefijo `/api/v1`.

### C-00 — Reglas comunes de transporte, errores, estado y seguridad [EXISTENTE + POLÍTICAS PROPUESTAS]

- **Origen local:** navegador FE `http://localhost:5173`, llamadas a `/api/v1` resueltas por proxy de Vite hacia Nest `:3000`; despliegue `:8080` requiere Nginx como SPA + proxy (verificar implementación). **Nunca codificar URL del backend en componentes React**.
- **JSON:** `Accept: application/json`; `Content-Type: application/json` en solicitudes con cuerpo. Para sesión/cookies, `credentials: 'include'`; para endpoints privados, `Authorization: Bearer <accessToken>`. **Refresh token únicamente en cookie httpOnly** (implementación existente). No poner el refresh en JSON ni en URL.
- **Códigos:** `200` lectura/actualización, `201` creación, `202` OTP solicitado, `204` efecto sin cuerpo, `400` validación, `401` no autenticado, `403` sin rol, `404` no encontrado/no publicado, `409` cambio concurrente/conflicto, `410` código expirado, `429` límites, `500` error interno, `503` temporal. Para DELETE 204, nunca llamar a `.json()`.
- **Error uniforme EXISTENTE (el backend lo documenta):**

```json
{"statusCode":409,"codigo":"CONFLICTO","mensaje":"Esta información ya existe o cambió hace un momento.","detalles":{},"ruta":"/api/v1/solicitudes-ayuda/UUID/tomar","fecha":"2026-11-26T19:00:00.000Z"}
```

  `detalles` es opcional, `codigo` es estable y `mensaje` debe mostrarse en español comprensible. FE distingue error de negocio, autorización, timeout/red, servidor y respuesta inesperada; no traga errores para servir mocks. No mostrar cookies, contraseñas, JWT ni stack traces. Para 401 de endpoint privado: intentar renovación **una sola vez** con C-08 y reintentar solo petición segura/idempotente; no reenviar POSTs no idempotentes sin estrategia anti-duplicación.
- **Paginación EXISTENTE:** `?pagina=1&limite=20` (limite 1–100), respuesta `{ "datos": [...], "total": 0, "pagina": 1, "limite": 20 }`. FE debe paginar o pedir un límite explícito; no asumir que primera página contiene todo.
- **Fechas:** timestamps ISO 8601 UTC. Para filtros por día se propone calendario **America/Bogota**, rango inclusivo `desde/hasta` en el frontend; BE transforma a intervalos UTC semiabiertos al agregar. Las fechas sin zona son solo fechas de calendario.
- **Cache:** endpoints sensibles `Cache-Control: no-store` propuesta; no guardar respuestas de sesión en almacenamiento compartido. Se recomienda deshabilitar múltiples invocaciones simultáneas de acciones de UI y presentar estado cargando sin ocultar errores.
- **IDs:** `slug` de guía minúsculo con guiones (regex vigente), `id` de pregunta/opción/intento/solicitud/paso UUID. NUNCA asumir identificadores de opción A/B/C ni usar el orden como llave estable de persistencia.
- **Categorías:** enum estable solo para roles `USUARIO_PUBLICO`/`PERSONAL`/`ADMINISTRADOR`; estados guía `BORRADOR`/`PUBLICADA`/`OCULTA`; ayuda `PENDIENTE`/`EN_ATENCION`/`RESUELTA`/`CANCELADA`; niveles `BASICO`/`INTERMEDIO`/`AVANZADO`.
- **Verificación de contrato:** comparar OpenAPI `/docs` o `/docs-json` **si está servido** y JSON reales. El texto de este documento no modifica automáticamente los DTO del servidor. Swagger se sirve fuera de producción; en producción solo con `SWAGGER_HABILITADO=true` (BE-09).
- **Despliegue (BE-09, verificado con `docker compose`):**
  - `GET /health` → `200 {status:"ok",service:"clena-backend",baseDatos:"ok",timestamp}`; si PostgreSQL no responde en 2 s, **`503`** con `status:"error",baseDatos:"no_disponible"`. Es el healthcheck del contenedor: sin base de datos el backend queda *unhealthy* y el frontend no arranca.
  - Nginx (`frontend/nginx.conf`) sirve la SPA en `:8080`, reenvía `/api/` al backend y devuelve `index.html` en cualquier ruta que no sea un archivo: `/guias/smishing`, `/guias?categoria=…` y `/codigos-qr` se pueden recargar o abrir desde un QR. Así el navegador ve un solo origen (cookie `SameSite=Strict` sin CORS). En local, Vite hace lo mismo con su proxy de `/api` a `:3000`.
  - El backend confía en `X-Forwarded-For` solo si la petición viene de una red local o privada (el proxy de Docker): el límite de peticiones por IP cuenta a cada persona y no a todo el proxy. Una IP pública no puede inventarse ese encabezado.
  - Cookie del refresh: `Secure` según `COOKIE_SEGURA` (vacía = solo con `NODE_ENV=production`). **Si producción se sirve por `http` (la sala sin certificado), `COOKIE_SEGURA=false`**, o el navegador no envía la cookie y la sesión no se renueva.
  - Logs sin secretos: `Authorization`, `Cookie` y `Set-Cookie` salen como `[Redacted]` (verificado en los logs del contenedor). En producción los OTP no pueden ir a `consola` (C-08).
  - Variables nuevas: `SWAGGER_HABILITADO`, `COOKIE_SEGURA` (backend, `.env.example` y `docker-compose.yml`) y `URL_PUBLICA` → `VITE_URL_PUBLICA` (argumento de construcción del frontend, ver C-01).
  - CI (`.github/workflows/ci.yml`): backend `format:check`, `lint`, `test:cov`, `test:e2e` con PostgreSQL 15 y `build`; frontend `format:check`, `lint`, **`test`** (antes estaba comentado) y `build`.

### C-01 — Catálogo y lectura de guías [EXISTENTE]

| Método y ruta | Permiso | Respuesta / notas |
|---|---|---|
| `GET /categorias?pagina=1&limite=50` | Público | Paginada; cada categoría con `slug`, `nombre`, `icono` (consultar DTO exacto). |
| `GET /guias?categoria=seguridad-digital&pagina=1&limite=20` | Público | `{datos:[{slug,categoria,titulo,objetivo,nivel,duracionEstimadaMin}],total,pagina,limite}`; solo PUBLICADA. |
| `GET /guias/:slug` | Público | `DetalleGuia`: resumen anterior + `totalPasos`, `tieneActividad`, `pasos:[{orden,titulo,bloques:[{tipo,texto?,nivel?,url?,textoAlternativo?}]}]`. |
| `POST /guias/:slug/consultas` | Sesión opcional | 204, sin cuerpo; registrar **una apertura** para HU-31. |

Ejemplo de detalle ilustrativo del **esquema DTO, no snapshot de DB**:

```json
{"slug":"smishing","categoria":"seguridad-digital","titulo":"Smishing","objetivo":"Reconocer mensajes falsos","nivel":"BASICO","duracionEstimadaMin":8,"totalPasos":2,"tieneActividad":true,"pasos":[{"orden":1,"titulo":"Observa el mensaje","bloques":[{"tipo":"texto","texto":"Revisa el remitente."}]}]}
```

**Reglas:** GET detalle **no registra automáticamente** apertura; FE realiza POST consultas al entrar en guía. Si falla este POST de telemetría, se informa en observabilidad pero no se bloquea lectura; no duplicarlo por rerender accidental. Evitar que el detalle use texto/ejemplos de mock mezclados con datos reales. `404` pública muestra guía no disponible, no mock. Las 15 guías/5 categorías reportadas por F00 **no autorizan** cambiar automáticamente los requisitos ni borrar material; D-01 requiere PO.

**Códigos QR (HU-45, FE-11):** la página `/codigos-qr` (no está en el menú; datos públicos, sin sesión) genera un QR por el inicio (`/`), cada categoría (`/guias?categoria=<slug>`) y cada guía publicada (`/guias/<slug>`), leídos del backend recorriendo todas las páginas y **sin datos de ejemplo** ante errores. Nunca incluye rutas del personal ni de la cuenta. La URL base es `VITE_URL_PUBLICA` (en Docker, `URL_PUBLICA` al construir el frontend); sin ella usa la dirección del navegador y, si es `localhost`/`127.0.0.1`, avisa «No los imprimas todavía». Cada QR se descarga como SVG (corrección M, margen 4) y «Imprimir todos» imprime solo las tarjetas.

### C-02 — Listado de categorías y contenido aprobado [EXISTENTE + D-01]

Contrato actual: GET `/categorias`, GET `/guias?categoria=<slug>`. El frontend **no debe convertir silenciosamente** `phishing` en `seguridad-digital` ni imponer un conjunto artificial de categorías sin decisión PO y pruebas. Las cuatro guías exigidas por backlog son Smishing, Vishing, Quishing y Falso soporte técnico; sus preguntas incluyen HU-25/26/27 dentro de las actividades existentes. **La cantidad de datos semilla fuera de ellas no equivale a un nuevo requisito funcional.** FE puede mostrar los datos publicados reales; cambios de visibilidad/editorial requieren decisión D-01. Si la categoría está vacía, mensaje textual de HU-09, no error técnico.

### C-03 — Actividad real y persistencia de usuario registrado [EXISTENTE]

`GET /guias/:slug/actividad` **público** → `200`:

```json
{"titulo":"Práctica de Smishing","porcentajeAprobacion":70,"totalPreguntas":2,"preguntas":[{"id":"11111111-1111-4111-8111-111111111111","enunciado":"¿Qué harías ante un enlace sospechoso?","opciones":[{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},{"id":"33333333-3333-4333-8333-333333333333","texto":"Abrirlo inmediatamente"}]},{"id":"77777777-7777-4777-8777-777777777777","enunciado":"¿Debes compartir un código por teléfono?","opciones":[{"id":"88888888-8888-4888-8888-888888888888","texto":"No, nunca"},{"id":"99999999-9999-4999-8999-999999999999","texto":"Sí"}]}]}
```

Ejemplo didáctico de forma JSON: `totalPreguntas` debe igualar longitud de `preguntas` en respuestas reales; el servidor NO envía `esCorrecta`, `opcionCorrecta` ni explicación antes de responder. Actividad de 1–10 preguntas, cada una 2–4 opciones y exactamente una correcta en BD. `404` si la guía no existe/no está publicada/no tiene actividad.

`POST /guias/:slug/actividad/intentos` con `Authorization: Bearer` de **USUARIO_PUBLICO**, obligatorio desde BE-01: `401` sin sesión o con token inválido, `403` con sesión del personal (el personal y los invitados practican con C-04). Cuerpo vacío → `201`:

```json
{"id":"44444444-4444-4444-8444-444444444444","totalPreguntas":2}
```

`POST /intentos/:id/respuestas` con el Bearer del mismo usuario (`401`/`403` como arriba; intento de otra cuenta o inexistente `404` `INTENTO_NO_ENCONTRADO`) → cuerpo:

```json
{"preguntaId":"11111111-1111-4111-8111-111111111111","opcionId":"22222222-2222-4222-8222-222222222222"}
```

→ `201`:

```json
{"esCorrecta":true,"opcionCorrecta":{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},"explicacion":"Los mensajes sospechosos deben verificarse.","respondidas":1,"totalPreguntas":2,"resultado":null}
```

Con última pregunta, `resultado` es `{ "respuestasCorrectas":2,"totalPreguntas":2,"porcentaje":100,"aprobado":true,"porcentajeAprobacion":70 }`. `409` si pregunta repetida (`PREGUNTA_YA_RESPONDIDA`) o intento finalizado (`INTENTO_FINALIZADO`); `400` `RESPUESTA_INVALIDA` si la opción no es de la pregunta. `intento.usuario_id` es `NOT NULL` (migración `20261126120000_intento_usuario_obligatorio`). FE solo avanza tras respuesta confirmada; bloquear doble clic; **no reintentar POST respuestas automáticamente** si se pierde la respuesta de red, porque ya pudo haberse registrado (consultar posibilidad de recuperación/idempotencia con BE si se necesita).

### C-04 — Evaluación de práctica INVITADO sin persistencia [EXISTENTE desde BE-01, PR #93]

**Resuelto en BE-01:** antes el controller aceptaba sesión opcional en `POST .../intentos` e `IniciarIntentoUseCase` guardaba el intento con `usuarioId=null`. Ahora solo el usuario público crea intentos (C-03) y la migración `20261126120000_intento_usuario_obligatorio` borró los intentos anónimos y dejó `intento.usuario_id NOT NULL`. Prueba e2e: tras practicar como invitado (o con sesión del personal) quedan 0 filas en `intento`, `respuesta_intento`, `progreso_guia` y `paso_leido`.

**Contrato implementado:** `POST /guias/:slug/actividad/evaluar-respuesta`, público, **sin guardar** intento/respuesta/progreso/paso. JSON:

```json
{"preguntaId":"11111111-1111-4111-8111-111111111111","opcionId":"22222222-2222-4222-8222-222222222222"}
```

→ `200`:

```json
{"esCorrecta":true,"opcionCorrecta":{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},"explicacion":"Los mensajes sospechosos deben verificarse."}
```

**Semántica:** valida que el slug está publicado y tiene actividad, que la pregunta pertenece a esa actividad y que la opción pertenece a la pregunta; devuelve el mismo feedback que C-03 sin exponer la correcta en GET; no escribe tablas educativas ni crea sesión. Errores: `400` `DATOS_INVALIDOS` (UUID/formato inválido), `404` `ACTIVIDAD_NO_ENCONTRADA` (guía inexistente, no publicada o sin actividad), `404` `PREGUNTA_NO_ENCONTRADA` (la pregunta no es de esa guía), `400` `RESPUESTA_INVALIDA` (la opción no es de la pregunta). Ignora `Authorization`: responde igual con o sin token, sea válido o no. Como contrato stateless no detecta repetición ni puede impedir que un cliente técnico consulte varias opciones; **no prometer antitrampas que no existe**. El frontend mantiene `respuestas`, `paso` y calificación local **solo en estado React en memoria**. Calcula resultado con `correctas/total*100` y umbral recibido en C-03; se pierde al recargar. Mostrar invitación no obligatoria a registrarse.

### C-05 — Ayuda de visitante y estado [EXISTENTE + seguridad POR VALIDAR]

`POST /solicitudes-ayuda` público o sesión opcional. JSON exacto del DTO existente:

```json
{"equipo":"12","tema":"SEGURIDAD_DIGITAL","guiaSlug":"smishing","pasoOrden":2}
```

- `equipo`: string no vacío, máximo 100; deduplicación por normalización de mayúsculas/espacios para solicitud activa; `tema` uno de `CORREO`, `BUSQUEDA_INTERNET`, `DOCUMENTOS`, `REDES_SOCIALES`, `SEGURIDAD_DIGITAL`, `USO_DEL_EQUIPO`, `IMPRESION`, `OTRO`; `guiaSlug` opcional, patrón `[a-z0-9]+(-[a-z0-9]+)*`, máximo 80; `pasoOrden` opcional integer >=1 **solo si existe `guiaSlug`** (confirmar validación dominio).
- `201` solicitud nueva; `200` solicitud activa existente: `{id,equipo,tema,estado,posicion,creadaEn,yaExistia}`. Ejemplo:

```json
{"id":"55555555-5555-4555-8555-555555555555","equipo":"12","tema":"SEGURIDAD_DIGITAL","estado":"PENDIENTE","posicion":2,"creadaEn":"2026-11-26T19:00:00.000Z","yaExistia":false}
```

- `GET /solicitudes-ayuda/:id` → `200` mismo estado sin `yaExistia`; `DELETE /solicitudes-ayuda/:id` → `204` solo si PENDIENTE; conserva fila `CANCELADA`, `409` si no puede cancelarse; `404` si no existe. **Seguridad todavía no resuelta:** el controller `dev` anota GET/DELETE públicos, pero F00 observó 401 al consultar sin cookie. No se debe afirmar un contrato de identidad/cookie que no está probado. `BE-02` debe verificar rama local y fijar una prueba `POST→GET→DELETE` desde el mismo navegador; establecer mecanismo de titularidad para impedir consultar/cancelar ajenos (por ejemplo cookie de sesión/capacidad opaca httpOnly), y entregar a FE si debe usar `credentials: include`. **No diseñar el frontend alrededor de una cookie imaginaria.**
- UI FE: formulario con ubicación/contexto, deshabilitar envío doble, mostrar `posicion`, estado y botón cancelar solo PENDIENTE, consultar cada 15s mientras espera, detener polling al salir. No mostrar datos sensibles del personal ni exponer IDs de otras solicitudes.

### C-06 — Cola y acciones del personal [EXISTENTE; verificado en BE-06, FE-06]

`GET /solicitudes-ayuda?estado=PENDIENTE&pagina=1&limite=20&ordenarPor=creadaEn&direccion=asc` con Bearer PERSONAL/ADMINISTRADOR → `200` paginado `{datos:[SolicitudEnCola],total,pagina,limite}`. Registro:

```json
{"id":"55555555-5555-4555-8555-555555555555","equipo":"12","tema":"SEGURIDAD_DIGITAL","estado":"PENDIENTE","guia":{"slug":"smishing","titulo":"Smishing"},"paso":2,"creadaEn":"2026-11-26T19:00:00.000Z","atendidaPor":null,"tomadaEn":null,"resueltaEn":null,"comentarioResolucion":null}
```

`POST /solicitudes-ayuda/:id/tomar` Bearer PERSONAL/ADMINISTRADOR, sin body → `200` `SolicitudEnCola`, estado `EN_ATENCION`, `atendidaPor` nombre. Transición debe ser atómica `UPDATE ... WHERE estado='PENDIENTE'`; si tomó otro monitor `409`, FE recarga lista.

`POST /solicitudes-ayuda/:id/resolver` Bearer PERSONAL/ADMINISTRADOR, body `{"comentario":"Se explicó cómo verificar el mensaje."}` con texto opcional/null y máximo 500 → `200`, estado `RESUELTA`; `403` si no es quien la tomó; `409` si nadie la tomó o ya cerrada. FE polling **cada 15s**, lista ascendente por fecha y tiempo de espera calculado por `Date.now - creadaEn`; al desmontar cancelar intervalo/solicitudes. Para ver propios en atención usar GET con filtro `estado=EN_ATENCION` (ya soportado); nunca perderlos al pasar de pendiente a en atención.

**Verificado en BE-06 y usado por FE-06** (e2e `atender-solicitudes.e2e-spec.ts`):
- `GET /solicitudes-ayuda` exige Bearer `PERSONAL`/`ADMINISTRADOR` (`401` sin sesión, `403` usuario público). Filtros `estado` y `tema` (enums de C-05), `ordenarPor=creadaEn`, `direccion` `asc`/`desc`, `pagina` ≥ 1 y `limite` 1–100; cualquier otro valor → `400 DATOS_INVALIDOS`. Cada registro trae solo `{id,equipo,tema,estado,guia,paso,creadaEn,atendidaPor,tomadaEn,resueltaEn,comentarioResolucion}`: nunca datos de la persona.
- Errores con `codigo`: tomar → `409` `SOLICITUD_YA_TOMADA`, `SOLICITUD_MODIFICADA` (otro monitor la tomó en el mismo instante) o `SOLICITUD_CERRADA` (la persona canceló); resolver → `409` `SOLICITUD_SIN_TOMAR` o `SOLICITUD_CERRADA`, `403` `SOLICITUD_DE_OTRO_MONITOR`; `404` `SOLICITUD_NO_ENCONTRADA`.

**Pantalla `/personal/cola` (FE-06):** pide `estado=PENDIENTE` y `estado=EN_ATENCION` (límite 50, de la más antigua a la más reciente) al abrir y **cada 15 s** (`SeguimientoCola`), y deja de pedir al salir. Muestra «Estás atendiendo» (las tomadas por el nombre de la sesión), «Esperando ayuda» numeradas con el tiempo de espera, y «Atendiendo otros monitores». «Atender» toma la solicitud; ante cualquier `409` avisa «Otro monitor ya está atendiendo…» y recarga. «Marcar como resuelta» pide el comentario opcional (máximo 500) y solo aparece en las propias; el backend igual responde `403` a otro monitor. Tomar y resolver son escrituras: ante un `401` se renueva la sesión pero **no se repiten** (C-08). Tras iniciar sesión, un monitor (`PERSONAL`) entra aquí; antes iba al catálogo público.

### C-07 — Gestión de guías por personal [EXISTENTE; verificado en BE-06, FE-05]

Todos requieren Bearer rol PERSONAL o ADMINISTRADOR: `GET /gestion/guias`, `POST /gestion/guias`, `GET /gestion/guias/:slug`, `PUT /gestion/guias/:slug`, `POST /gestion/guias/:slug/publicar`, `POST /gestion/guias/:slug/ocultar`. GET listado paginado; POST crea en BORRADOR y genera slug; PUT **reemplaza** campos de guía y, si viene `pasos`, reemplaza la lista de pasos exactamente y en orden (omitir `pasos` no los modifica). DTO de escritura:

```json
{"titulo":"Guía de prueba","objetivo":"Identificar señales de engaño.","descripcion":"Guía temporal para pruebas.","categoria":"seguridad-digital","nivel":"BASICO","duracionEstimadaMin":8,"palabrasClave":["smishing"],"pasos":[{"titulo":"Comprueba el mensaje","bloques":[{"tipo":"texto","texto":"Verifica el remitente."},{"tipo":"aviso","nivel":"alerta","texto":"No compartas códigos."}]}]}
```

**Campos y validaciones EXISTENTE:** título 1–150; objetivo 1–300; descripción opcional <=2000; categoría es `slug` existente <=40; nivel BASICO/INTERMEDIO/AVANZADO; duración integer 1–600 min; palabras clave <=15, cada una <=40; pasos opcionales <=50; cada paso `{id?:UUID,titulo?:string|null (<=120),bloques:[...]} `, <=10 bloques por paso; tipos de bloque texto `{tipo:'texto',texto}`, aviso `{tipo:'aviso',nivel:'consejo'|'alerta',texto}`, imagen `{tipo:'imagen',imagenId:UUID,textoAlternativo}`; contenido max 600 letras por bloque texto. Si se edita paso existente conservar `id` UUID estable; si se omite el id el servidor lo crea nuevo. **No subir archivos**: HU-14 es Should y requiere módulo aparte si se activa.

**Salida existente:** `GuiaGestionDetalle` con `slug,categoria,titulo,objetivo,nivel,duracionEstimadaMin,estado,totalPasos,publicadaEn,creadaPor,actualizadaPor,creadoEn,actualizadoEn,descripcion,palabrasClave,pasos:[{id,orden,titulo,bloques}]`. `POST` 201, `PUT`/publicar/ocultar 200; publicar sin pasos 409; una PUBLICADA no puede quedar sin pasos 409; ocultar conserva datos y progreso. No editar guías reales en pruebas; usar un borrador ficticio y limpiarlo con autorización, ya que controlador no declara DELETE de guía.

**Dependencia BE-07:** resembrar dos veces tras editar el borrador **no debe pisar las ediciones**; antes de usar el editor con datos reales verificar el seed.

**Verificado en BE-06 y usado por FE-05** (e2e `gestion-guias.e2e-spec.ts`): el personal sin rol de administrador también gestiona guías; el listado acepta `estado`, `categoria`, `ordenarPor` `titulo`/`actualizadoEn`, `direccion`, `pagina` y `limite` 1–100 (otro valor → `400 DATOS_INVALIDOS`). **Ida y vuelta del editor:** el `PUT` con lo mismo que devolvió el `GET /gestion/guias/:slug` (incluidos los bloques `imagen` con su `url`, que se ignora) no cambia nada. Errores con `codigo`: `409 GUIA_SIN_PASOS` (publicar sin pasos o dejar una publicada sin pasos), `409 GUIA_NO_PUBLICADA` (ocultar un borrador), `404 GUIA_NO_ENCONTRADA`, `400 DATOS_INVALIDOS` con `detalles.campos`.

**Pantallas (FE-05):** `/personal/guias` lista las guías en cualquier estado (filtros por estado y categoría, de la editada más recientemente). `/personal/guias/nueva` y `/personal/guias/:slug` son el editor: datos de la guía, pasos con título opcional y bloques de texto, aviso (consejo/alerta) o imagen ya existente (solo se ve y se edita su texto alternativo; **subir imágenes es HU-14, fuera de alcance**), botones para agregar, quitar y reordenar pasos y bloques (sin arrastrar, usable con teclado). Antes de enviar valida con los mismos límites de esta sección y muestra todos los errores junto a su campo y en un resumen anunciado; al guardar envía todos los pasos en orden con el `id` de los que ya existían. «Publicar» (si la guía no tiene pasos avisa sin llamar al servidor) y «Ocultar del catálogo» usan lo último guardado. Ambas pantallas exigen sesión del personal y comparten el menú «Cola de ayuda · Guías · Personal (solo administración) · Códigos QR · Cerrar sesión».

### C-08 — Cuenta pública, OTP y sesión [EXISTENTE; verificado en BE-05, FE-09]

- `GET /aviso-privacidad/vigente` público: `{version,contenido,vigenteDesde}`.
- `POST /auth/registro` público → `202`; body:

```json
{"nombre":"Persona de prueba","numeroIdentificacion":"00000001","fechaNacimiento":"1955-08-21","correo":"prueba@example.test","aceptaAvisoPrivacidad":true,"canalVerificacion":"CORREO"}
```

  `telefono` alternativo, al menos teléfono o correo; DOB requerida en DTO actual aunque D-02 pide justificación. Salida `{registroId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`; nombre <=100, identificación <=30, fecha `YYYY-MM-DD`, email <=254, teléfono <=20, consentimiento true. `409` identificador/email/teléfono duplicado (`IDENTIFICACION_YA_REGISTRADA`, `CORREO_EN_USO`, `TELEFONO_EN_USO`); `429` tasa límite.
- `POST /auth/registro/verificar` público → `201`; body `{ "registroId":"UUID", "codigo":"123456" }`, seis dígitos. `POST /auth/registro/reenviar-codigo` → `202`, `{registroId}`; antes del minuto `429 REENVIO_MUY_PRONTO`.
- `POST /auth/login` público → `202`, `{numeroIdentificacion,contacto}`; salida `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. `POST /auth/login/verificar` público → `200`, `{solicitudId,codigo}`. Login incorrecto `401 CREDENCIALES_INVALIDAS` genérico sin revelar cuál dato.
- Verificación exitosa (login o registro) → `{usuario:{nombre,rol},accessToken,accessTokenExpiraEn,refreshTokenExpiraEn}` **más cookie `refresh_token` httpOnly**; el cuerpo no contiene refresh token. `POST /auth/refresh` con cookie y `credentials:'include'` → `200` `{accessToken,accessTokenExpiraEn,refreshTokenExpiraEn}` y nueva cookie; refresh token rota. **Reusar un refresh ya usado cierra todas las sesiones** de esa cuenta. `POST /auth/logout` con cookie → `204` y la elimina.
- `POST /auth/cuenta/eliminacion` Bearer USUARIO_PUBLICO → `202`, `{canal?:'CORREO'|'TELEFONO'}` (sin canal: el contacto de la cuenta); `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. `POST /auth/cuenta/eliminacion/confirmar` Bearer → `204`, `{solicitudId,codigo}`; borra la cookie. Borra datos y progreso, conserva métricas anonimizadas. Sólo con **cuenta de prueba** y autorización.

**Códigos OTP (todos los flujos de C-08 y C-09), verificado en e2e `codigos-vencidos.e2e-spec.ts`:** 6 dígitos. Incorrecto → `400 CODIGO_INCORRECTO` con los intentos restantes en el mensaje; sin intentos → `429 INTENTOS_AGOTADOS`; **vencido → `410 CODIGO_EXPIRADO`** («El código ya venció. Pide uno nuevo.»), sin crear la cuenta, abrir sesión, cambiar la contraseña ni borrar nada. En producción el backend no arranca si `NOTIFICACIONES_CORREO` o `NOTIFICACIONES_SMS` es `consola` (los códigos nunca se escriben en los logs).

**Cookie `refresh_token`:** `HttpOnly`, `SameSite=Strict`, `Path=/api/v1/auth`, `Secure` solo con `NODE_ENV=production`, vence en `refreshTokenExpiraEn` (12 h por defecto). Por `SameSite=Strict` el FE debe servirse en el mismo sitio que la API (proxy de Vite o Nginx). El access token dura 15 min (`JWT_ACCESS_EXPIRES_IN_SEGUNDOS=900`).

**Política del FE para la sesión (implementada en FE-09/FE-10, `frontend/src/infrastructure/http/api.ts`):**
- Antes de una petición con token, si `accessTokenExpiraEn` vence en menos de 30 s, se renueva con `POST /auth/refresh`.
- Ante un `401` en una ruta con token se renueva **una sola vez**: las lecturas (`GET`) se reintentan; las escrituras **no** se repiten y muestran «Tu sesión se renovó. Vuelve a intentarlo.» (`SESION_RENOVADA`).
- Si el refresh responde `401`, se olvida la sesión y se pide iniciar sesión de nuevo (`SESION_INVALIDA`).
- Sin red o con el backend caído se muestra «No se pudo conectar con el servidor…»; nunca se simula una respuesta.
- Los errores se leen del formato uniforme de C-00: se muestra `mensaje`, se decide por `codigo` y el campo del formulario sale de `detalles.campo` o de la primera clave de `detalles.campos`.

**Pantallas (FE-09):** `/registro`, `/registro/verificar`, `/iniciar-sesion` y **`/mi-cuenta`** (nueva): cerrar sesión y eliminar la cuenta. Eliminar exige marcar «Entiendo que mi cuenta y mis datos se borrarán para siempre», pedir el código y escribirlo; tras el `204` la sesión queda cerrada en el navegador. Con sesión pública, el encabezado muestra «Mi cuenta» en lugar de «Iniciar sesión».

**Riesgo aceptado y documentado — access token en `localStorage`:** `HttpAuthRepository` (clave `kama_auth_session`) y `HttpPersonalRepository` (`kama_personal_session`) guardan el usuario, el access token y sus vencimientos en `localStorage`. En un computador compartido de la sala, otra persona que abra el navegador antes de que se cierre la sesión podría usarla mientras el refresh siga vigente. Mitigaciones actuales: el refresh token **nunca** está en `localStorage` (cookie httpOnly), el access token dura 15 min, «Cerrar sesión» revoca el refresh y borra la cookie, y `/mi-cuenta` recuerda cerrar sesión al terminar. **Decisión BE-05:** no se cambia la estrategia (p. ej. a memoria o `sessionStorage`) sin un issue aparte con prueba de compatibilidad en todos los módulos.

### C-09 — Personal y acceso privilegiado [EXISTENTE; verificado en BE-05, FE-10]

- `POST /auth/personal/login` público → `202`, `{correo,password}`; OTP enviado a correo, salida `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. **`solicitudId` es el id de la cuenta del personal** y es lo que se envía al verificar (no el `destino` enmascarado). `POST /auth/personal/login/verificar` → `200`, `{solicitudId,codigo}`; `{usuario:{nombre,rol,debeCambiarPassword},accessToken,accessTokenExpiraEn,refreshTokenExpiraEn}` + cookie httpOnly. Correo o contraseña incorrectos, o cuenta desactivada: `401 CREDENCIALES_INCORRECTAS` (mismo mensaje). `auth/refresh` y `auth/logout` compartidos con usuario público (verificado en e2e para el personal).
- `POST /personal/yo/password/codigo` Bearer PERSONAL/ADMINISTRADOR → `202`, sin body, salida `{destino,expiraEn,mensaje}`. `POST /personal/yo/password` → `204`, DTO **`{codigo:"123456",passwordNueva:"NuevaClave2026"}`** (no `solicitudId` ni `nuevoPassword`); contraseña 8–72 caracteres con letra y número. Vencido → `410 CODIGO_EXPIRADO`.
- `GET /personal?pagina=1&limite=20`, `GET /personal/:uuid`, `POST /personal`, `PATCH /personal/:uuid`, `POST /personal/:uuid/desactivar`, `POST /personal/:uuid/reactivar`: **solo ADMINISTRADOR** (`403 SIN_PERMISO` al personal). POST JSON `{nombre,correo,passwordTemporal,rol:'PERSONAL'|'ADMINISTRADOR'}`, edición parcial `{nombre?,correo?,rol?}`. Respuesta `{id,nombre,correo,rol,activo,debeCambiarPassword,ultimoAccesoEn,creadoEn}`, listado paginado. `409 CORREO_EN_USO`. La contraseña temporal 8–72 con letra y número según DTO. Un administrador no puede desactivarse ni quitarse el rol (`403 AUTO_MODIFICACION_NO_PERMITIDA`). **Desactivar revoca de inmediato sus sesiones y tokens**; el rol se lee de la BD en cada petición.
- **Corregido en FE-03/FE-10:** `HttpPersonalRepository` ya **no** usa `InMemoryPersonalRepository` como respaldo (solo en modo demo explícito, `VITE_USAR_DATOS_DEMO=true`): sin red, con *timeout* de 10 s o con `502/503/504` lanza `ServicioNoDisponiblePersonalError` y cualquier error del backend llega a la pantalla con su `mensaje` . La verificación del login envía `{solicitudId,codigo}` y el cambio inicial `{codigo,passwordNueva}`; antes enviaba `{destino,codigo}` y `{codigo,nuevoPassword}`, que el backend rechazaba con `400`. Aplica la misma política de sesión de C-08: renueva antes de vencer, ante `401` solo reintenta los `GET`, y con la sesión vencida `GestionPersonalPage` vuelve a `/personal/acceso`.

### C-10 — Mi progreso persistente [EXISTENTE desde HU-23 (PR #91); verificado y documentado en BE-03]

**Decisión BE-03:** se conserva el contrato que ya existe en `dev` (Regla C). El paso se identifica por su **número de orden** (el `orden` de `pasos[]` en `GET /guias/:slug`, C-01), no por UUID. La propuesta anterior (`/mi-progreso`, `PUT .../pasos/:pasoId`, `porcentajeLectura`, `ultimoPasoId`) **no existe** y no se implementará.

| Método y ruta | Permiso | Respuesta |
|---|---|---|
| `GET /progreso?categoria=&ordenarPor=titulo&direccion=asc&pagina=1&limite=20` | Bearer `USUARIO_PUBLICO` | `200` paginado `{datos:[ProgresoGuia],total,pagina,limite}` |
| `POST /guias/:slug/pasos/:orden/lectura` | Bearer `USUARIO_PUBLICO` | `200` `ProgresoGuia` de esa guía, ya actualizado. Cuerpo vacío. |

Ambas: `401` sin sesión o token inválido, `403` personal/administrador. El usuario sale siempre del token, nunca del body ni de la ruta.

`ProgresoGuia` (ejemplo real de las pruebas):

```json
{"slug":"smishing","categoria":"seguridad-digital","titulo":"Smishing","nivel":"BASICO","totalPasos":3,"pasosLeidos":1,"porcentaje":25,"estado":"EN_CURSO","completada":false,"tieneActividad":true,"actividadAprobada":false,"ultimoPaso":2,"completadaEn":null}
```

| Campo | Significado |
|---|---|
| `categoria` | slug de la categoría |
| `totalPasos`, `pasosLeidos` | pasos actuales de la guía y cuántos de ellos leyó el usuario |
| `porcentaje` | entero 0–100, **redondeado hacia abajo**. La actividad (si tiene preguntas) pesa como un paso más: `floor(100 * (pasosLeidos + actividadAprobada) / (totalPasos + tieneActividad))`. Solo llega a 100 si `completada`. Ej.: 1 de 3 pasos + actividad sin aprobar = 25. |
| `estado` | `SIN_EMPEZAR` (mostrar «Empezar»), `EN_CURSO`, `COMPLETADA` (mostrar la marca) |
| `completada` | leyó **todos** los pasos actuales y, si la guía tiene actividad, la aprobó en algún intento suyo. Se calcula en cada respuesta. |
| `tieneActividad`, `actividadAprobada` | `actividadAprobada` solo cuenta intentos del propio usuario (C-03) |
| `ultimoPaso` | **número** del último paso que abrió, para «Continuar donde quedé» (HU-24); `null` si no ha empezado o ese paso ya no existe |
| `completadaEn` | ISO 8601 de la **primera vez** que la completó; `null` si nunca |

**`GET /progreso`:**
- Trae **todas las guías publicadas**, también las no empezadas (en 0 % y `SIN_EMPEZAR`). Las ocultas y los borradores no salen.
- `categoria` (opcional, slug, máximo 40): filtra; una categoría sin guías da lista vacía. `ordenarPor` solo admite `titulo` (por defecto); `direccion` `asc` (por defecto) o `desc`. Paginación de C-00 (`limite` 1–100).
- `400 DATOS_INVALIDOS` si `ordenarPor`, `direccion`, `pagina` o `limite` no son válidos.

**`POST /guias/:slug/pasos/:orden/lectura`:**
- `orden` entero ≥ 1. Idempotente: repetirlo no cuenta doble (guarda la fecha de la primera lectura) y actualiza `ultimoPaso`.
- Si con esa lectura la guía queda completada, guarda `completadaEn`. Aprobar la actividad (C-03) también puede completarla.
- Errores: `404 PASO_NO_ENCONTRADO` si la guía no existe, no está publicada (borrador u oculta) o no tiene ese número de paso; `400 DATOS_INVALIDOS` si `orden` no es un entero ≥ 1 o el slug no tiene formato válido. En ningún error se guarda nada.

**Cambios de la guía hechos por el personal (C-07), verificados en e2e:**
- **Reordenar pasos:** la lectura se guarda por el UUID del paso, así que lo leído se conserva y `ultimoPaso` devuelve el número **nuevo**. Como la ruta usa el número, si el personal reordena mientras alguien lee, «paso 3» pasa a ser otro paso. Por eso el FE debe usar el `orden` del último `GET /guias/:slug` que cargó y, ante un `404`, recargar el detalle.
- **Quitar un paso leído:** su lectura se borra y deja de contar; si era el `ultimoPaso`, este pasa a `null`.
- **Ocultar la guía:** sale de `GET /progreso` y la lectura responde `404`, pero los datos se conservan: al volver a publicarla, el progreso sigue igual.
- **D-03 (pendiente PO), comportamiento actual:** si a una guía completada le agregan un paso, vuelve a `EN_CURSO` y `completada:false`, pero `completadaEn` conserva la fecha original. El PO debe decidir si esto es lo correcto.

**Invitados y cuenta:** sin sesión no se llama a ninguna de estas rutas ni se guarda progreso en `localStorage`/`sessionStorage`: el FE muestra el progreso en 0 (Regla D). Eliminar la cuenta (C-08) borra `progreso_guia` y `paso_leido` en cascada. El progreso es del usuario, no de la sesión: sigue igual al cerrar e iniciar sesión.

**Uso en el FE:** marcar el paso cuando el usuario lo visualiza (no al abrir el listado), una sola vez por paso y por visita, y solo con sesión de `USUARIO_PUBLICO`. Usar la respuesta del `POST` para actualizar la barra sin volver a pedir `GET /progreso`.

### C-11 — Estadísticas agregadas [EXISTENTE desde BE-04]

`GET /gestion/estadisticas/resumen?desde=2026-11-20&hasta=2026-11-26` → `200`.

| Aspecto | Comportamiento implementado |
|---|---|
| Permiso | `Authorization: Bearer` de `PERSONAL` o `ADMINISTRADOR`. `401` sin sesión o token inválido; `403` usuario público. |
| `desde`, `hasta` | Opcionales, `AAAA-MM-DD`, días de calendario en `America/Bogota`, **ambos incluidos**. Sin `hasta`: hoy en Bogotá. Sin `desde`: 6 días antes de `hasta` (7 días contando `hasta`). |
| Rango | `desde <= hasta`, máximo **366 días** contando los dos extremos (constante `RANGO_MAXIMO_DIAS`). |
| Intervalo en BD | UTC semiabierto `[desde 00:00 Bogotá, día siguiente a hasta 00:00 Bogotá)`. Colombia es siempre UTC−5. Ej.: 20/11–26/11 = `[2026-11-20T05:00Z, 2026-11-27T05:00Z)`. |
| Cabeceras | `Cache-Control: no-store`. |

```json
{"periodo":{"desde":"2026-11-20","hasta":"2026-11-26","zonaHoraria":"America/Bogota"},"totales":{"consultasGuias":35,"solicitudesAyuda":6},"topGuias":[{"slug":"smishing","titulo":"Smishing","consultas":20}],"consultasPorCategoria":[{"slug":"seguridad-digital","nombre":"Seguridad digital","consultas":35}],"solicitudesPorTema":[{"tema":"SEGURIDAD_DIGITAL","cantidad":6}],"hayDatos":true}
```

- **Fuente:** `consulta_guia` (una fila por cada `POST /guias/:slug/consultas`, con o sin cuenta) y `solicitud_ayuda` (por `creada_en`). Cuenta guías de **cualquier estado** (publicadas, ocultas y borradores): ocultar una guía no borra sus consultas históricas.
- **`totales`:** `consultasGuias` = todas las consultas del periodo; `solicitudesAyuda` = todas las solicitudes del periodo, sin importar su estado.
- **`topGuias`:** máximo **10**, por `consultas` DESC y, en empate, `slug` ASC. Puede haber más guías en `totales.consultasGuias` que en el top.
- **`consultasPorCategoria`:** por `consultas` DESC y, en empate, `slug` ASC. **Solo categorías con al menos una consulta** (las de 0 no aparecen; el FE debe mostrarlas en 0 si las quiere en el gráfico, tomándolas de `GET /categorias`).
- **`solicitudesPorTema`:** por `cantidad` DESC y, en empate, `tema` ASC (orden alfabético). **Solo temas con al menos una solicitud.** `tema` es uno de los enum de C-05.
- **Sin datos:** cifras siempre números enteros, nunca `null`. `hayDatos=false` si no hubo consultas **ni** solicitudes; entonces totales en 0 y listas vacías.
- **Sin datos personales:** la respuesta nunca incluye usuarios, cédulas ni equipos.
- **Errores:**

| Estado | `codigo` | Cuándo | `detalles` |
|---|---|---|---|
| `400` | `DATOS_INVALIDOS` | `desde`/`hasta` no tienen la forma `AAAA-MM-DD` (p. ej. `ayer`) | `{campos:{desde:[...]}}` |
| `400` | `RANGO_FECHAS_INVALIDO` | fecha inexistente (`2026-02-30`), `desde > hasta` o más de 366 días | `{campo:'desde'\|'hasta'}` |
| `401` | — | sin sesión | |
| `403` | — | usuario público | |

- **SQL:** agregaciones `GROUP BY` en PostgreSQL con `$queryRaw` parametrizada, sin traer eventos a Node. Índices: `consulta_guia(consultada_en)` (nuevo, migración `20261127120000_consulta_guia_fecha_idx`) y `solicitud_ayuda(creada_en, tema)`; verificado con `EXPLAIN`.
- **FE:** no calcula sumas desde filas ni inventa métricas; muestra `cargando`, `sin datos` (`hayDatos=false`), `error` (con el `mensaje` del backend en 400) y la tabla accesible como alternativa al gráfico. Valida el rango en el formulario, pero el backend es quien decide.

### Prueba de compatibilidad cruzada por contrato

Para cada C-XX, el equipo backend registra: ejemplo request real, respuesta exitosa real, error de validación, 401/403 cuando corresponde, 409 si hay concurrencia, test e2e y referencia Swagger. El equipo frontend prueba los **mismos JSON** con fixtures contractuales, valida el mapeo en `Http*Repository`, muestra errores reales y demuestra en navegador la ruta integrada. En acciones que escriben BD se usa ambiente de prueba aislado + cuentas/equipos ficticios y aprobación. La evidencia común se adjunta al issue emparejado.

## 3. Tareas del BACKEND — fichas de implementación

**Política BE:** modificar solo `backend/`, migraciones/semillas relacionadas y pruebas; cambios Docker/Nginx/CI con aprobación conjunta. Reusar Clean Architecture y evitar imports de NestJS o Prisma en dominio/aplicación. El catálogo C-00…C-11 está copiado íntegro aquí y es la especificación para coordinación; propuestas deben aprobarse. No alterar contenido educativo ni credenciales reales. **Git de escritura siempre a cargo de estudiantes.**

### BE-01 — Prácticas de invitados y persistencia correcta (HU-03/21/23) · P0 · pareja FE-01/02 · C-03/C-04

**Estado:** `PASS_BE` en PR #93 (`fix/be-01-practica-invitados-sin-persistencia`): C-04 implementado tal cual el catálogo, intentos solo para `USUARIO_PUBLICO` (`401`/`403`), migración `intento.usuario_id NOT NULL` que borra intentos anónimos previos, e2e con 0 filas para invitado. Falta `PASS_INTEGRATED` con FE-01/02.

- Inspeccionar `IniciarIntentoUseCase`, `ResponderPreguntaUseCase`, repositorios Prisma y migraciones reales; comprobar con SELECT en entorno de prueba si `POST intentos` anónimo persiste (fue autorizado y ejecutado en F00). Verificar nulidad `intento.usuario_id` real; modelo v2.0 obliga NOT NULL.
- Mantener C-03 para `USUARIO_PUBLICO` con UUID, exclusión entre cuentas y 409; **no romper consumidores existentes** sin versión/aviso. Definir si un cliente anónimo invocando `POST /.../intentos` debe recibir `401` o `403` y testearlo; se propone `401` como sesión requerida para crear intento persistente.
- Implementar **C-04 propuesto** solo cuando FE apruebe ruta/body/salida: validación pública stateless por pregunta, sin escrituras educativas; comparar opcionId y preguntaId y pertenencia a guía/actividad, mantener regla 70% y no revelar respuesta en GET. NO insertar filas en `intento`, `respuesta_intento`, `paso_leido`, `progreso_guia` para visitantes.
- Si hay datos anónimos previos, definir migración de depuración **solo autorizada** y aplicar `usuario_id NOT NULL` en ambiente controlado; pruebas de rollback y compatibilidad.
- Tests unitarios y e2e: 1–10 preguntas, 2–4 opciones, GET sin correcta, visitante evaluar y 0 filas, usuario crear/contestar/calificar y persistencia, reintento finalizado 409, UUID ajeno 404, correctas >=70%, 69% no aprobado.
- **Entrega FE:** OpenAPI C-03+C-04, JSON real, error 400/401/404/409 y prueba SQL cero filas para guest. `PASS_BE` antes de `PASS_INTEGRATED`.

### BE-02 — Propiedad, deduplicación y ciclo de ayuda (HU-29/30) · P0 · pareja FE-04/06 · C-05/C-06

- Verificar ruta exacta y versión desplegada: controller `dev` GET/DELETE públicos por id, F00 reporta 401 en GET sin cookie; por tanto investigar middleware/guards y pruebas de la rama local. No asumir que pasar un UUID autoriza cancelar solicitud ajena.
- Probar `POST` 201, 200 duplicado con **misma sesión y mismo equipo**, normalización de equipo, consulta y cancelación con la misma identidad, cancelación solo PENDIENTE, 409 al cambiar estado.
- **Fijar mecanismo acordado de titularidad C-05**: sesión/capability del visitante opaca y de vida limitada, preferible cookie httpOnly SameSite apropiada y verificación server-side; gestionar navegador compartido, origen cross-site/cookie en prod y limpieza. Si cambia body/cookies, actualizar sección C-05 en ambos archivos antes de code.
- Cola: GET asc paginada, POST tomar atómico `UPDATE WHERE estado=PENDIENTE`, solo asignado resuelve; `409` carrera, `403` ajeno. Probar dos monitores concurrentes y polling sin fuga.
- **Entrega FE:** ejemplos de `Set-Cookie` / request y estados reales preservando cookie; documentación Swagger + tests de pertenencia, 201/200/204/401/403/404/409.

### BE-03 — Servicio progreso persistente (HU-23) · P0 · pareja FE-07 · C-10

**Estado:** `PASS_BE` en la rama `test/be-03-progreso`. **Decisión:** se conserva el contrato existente por número de orden (Regla C); no se agrega `id` a `pasos[]` ni rutas `/mi-progreso`. Casos verificados en e2e: 2 usuarios, leer dos veces, reordenar y quitar pasos, guía oculta y republicada, sesión nueva, invitado `401` sin filas, D-03 (comportamiento actual documentado en C-10); la cascada al eliminar la cuenta ya la cubría `eliminar-cuenta.e2e-spec.ts`. «Guía sin pasos» no aplica: una guía publicada no puede quedar sin pasos (C-07, `409`). Falta `PASS_INTEGRATED` con FE-07 y la decisión D-03 del PO.

- Buscar cualquier ruta/caso de uso existente antes de crear uno nuevo. Si no existe, módulo de progreso en capas `domain/application/infrastructure/presentation` y registrar en Nest. Tablas modelo `progreso_guia`, `paso_leido`, relaciones con `intento`/`actividad` en Prisma; migración versionada si faltan.
- Extender DetalleGuiaDto.pasos[] con `id: UUID` estable de paso sin quitar `orden` ni cambiar bloques; nunca devolver ID de usuario en cliente público. Marcar leído `PUT /mi-progreso/guias/:slug/pasos/:pasoId` idempotente y GET listado/detalle según C-10; identificar usuario mediante JWT, nunca desde body/path.
- Resolver lecturas, porcentaje numérico, aprobó actividad, flag `completada` de acuerdo al criterio: último paso alcanzado y actividad aprobada si existe. Corregir si se edita/oculta una guía sin borrar progreso; **D-03 requiere PO** para supresión de pasos ya registrados.
- Pruebas SQL de 2 usuarios, PK (usuario,paso), leer dos veces, reordenar pasos, guía oculta, sin pasos, logout/login, invitado 401 sin filas, eliminación de cuenta cascada; no cambiar un sistema correcto si ya existe.
- **Entrega FE:** fixtures reales de C-10, DTO, casos e2e y doc breve de semántica; `PASS_BE`.

### BE-04 — Estadísticas PostgreSQL del panel (HU-31) · P0 · pareja FE-08 · C-11

**Estado:** `PASS_BE` en la rama `feat/be-04-estadisticas`: C-11 implementado y documentado arriba, con índice nuevo `consulta_guia(consultada_en)` y e2e de bordes de medianoche, guías ocultas, consultas sin cuenta, top 10, vacío, 400/401/403 y sumas contra `SELECT`. Falta `PASS_INTEGRATED` con FE-08.

- Buscar antes si `consulta_guia` y API agregada ya existen. Asegurar `POST /guias/:slug/consultas` crea una fila por apertura efectiva de la guía; no exponer identificación de invitado.
- Implementar endpoint único C-11 con rol de personal aprobado, filtro rango `desde/hasta` 7 días por defecto en `America/Bogota`, UTC [desde, hasta+1 día), top10 guías, agrupación categorías y ayuda por tema, `hayDatos`. Datos cero -> estructuras vacías; consultas validan rango y coste.
- Agregar en SQL (`groupBy`/query raw parametrizada) con índices del modelo; agrupar por categoría mediante joins. No descargar cada evento en Node para contar.
- Pruebas deterministas: fechas borde medianoche, solicitud sin guía, consultas anónimas, cero eventos, guía oculta, agrupación, 401/403, índices/plan básico; verificar sumatorias contra SELECT controlado.
- **Entrega FE:** JSON real conforme C-11 + ejemplos de vacíos y error por rango; pruebas e2e autorizadas.

### BE-05 — Autenticación/cuentas/privacidad (HU-01/02/04/05/06) · P0 · pareja FE-09/10 · C-08/C-09

**Estado:** `PASS_BE` en la rama `feat/be-05-fe-09-10-auth` (junto con FE-09 y FE-10). No se reimplementó nada: la cobertura existente ya probaba OTP, intentos, refresh rotado y reusado, logout, consentimiento, duplicados, eliminación con anonimización, personal, desactivación que revoca tokens, `{codigo,passwordNueva}`, refresh del personal y guards. **Agregado:** `test/e2e/codigos-vencidos.e2e-spec.ts` (`410 CODIGO_EXPIRADO` en registro, login público, login del personal, cambio de contraseña inicial y eliminación, sin efectos) y `src/infrastructure/config/__tests__/variables-entorno.spec.ts` (en producción no arranca con OTP por `consola`). Pendiente: D-02 (fecha de nacimiento).

- El backend ya expone rutas OTP de registro/login, refresh/logout, cuenta/eliminación y personal. Validarlas con fixtures ficticios autorizados; NO reimplementarlas por defecto. Verificar cobertura de JWT rotación refresh, auth cookie httpOnly, throttling, datos mínimos, roles, 401/403, OTP expirado/incorrecto, caducidad, invalidación de sesión y doble uso de refresh.
- Cuenta pública: consentimiento/vigencia, duplicados por identificación/contacto, OTP 6 dígitos, sesión, supresión transaccional de usuario y progresos y anonimización de `consulta_guia`, `solicitud_ayuda`, calificación; evitar logs de códigos en producción. D-02 fecha nacimiento aún requiere justificación.
- Personal: admin crea/desactiva/reactiva; contraseña temporal y cambio inicial OTP; solo ADMIN maneja otros empleados; PERSONAL solo puede atender cola y gestionar guías; desactivar revoca tokens.
- Confirmar que `POST /personal/yo/password` use `{codigo,passwordNueva}` (verificado en `dev`), no `{solicitudId,nuevaPassword}`; entregar a FE prueba y ejemplo real. Probar que `auth/refresh` también funcione para personal.
- **Entrega FE:** postman/HTTP ejemplos anónimos sanitizados, status 202/200/204, error 400/401/403/409/410/429, cookie flags, id ficticios.

### BE-06 — Estabilidad de gestión guías y cola (HU-13/15/30) · P0 · pareja FE-05/06 · C-06/C-07

**Estado:** `PASS_BE` en la rama `feat/be-06-fe-05-06-guias-cola` (junto con FE-05 y FE-06). Sin cambios de código: las rutas ya cumplían. La cobertura existente probaba permisos, BORRADOR, ≥1 paso para publicar, ocultar sin borrar, `PUT pasos` con UUID y omitidos, toma concurrente y solo el asignado resuelve. **Agregado:** e2e del `GET` de la cola (401/403, forma del registro sin datos personales, `EN_ATENCION`, filtro por tema, orden `desc`, paginación y 400 con valores fuera de rango) y de gestión (`PERSONAL` también gestiona, ida y vuelta `GET`→`PUT` sin cambios, 400 en el listado).

- **No crear nuevos controllers si ya existen.** `gestion/guias` GET/POST/PUT/publicar/ocultar y `solicitudes-ayuda` list/tomar/resolver constan en dev.
- Revisar autorización PERSONAL/ADMINISTRADOR; validación DTO y serialización: crear BORRADOR, publicación exige >=1 paso, ocultar no elimina, `PUT pasos` conserva UUID de los que existían, orden nuevo estable, `PUT` omitidos pasos no elimina; 409 por guía publicada sin pasos.
- Seguridad de toma concurrente por dos monitores, solo el asignado resuelve; error 409 consistente. Confirmar paginación 1..100, filtros `estado,tema,ordenarPor=creadaEn,direccion` y fechas de cola.
- Entrega FE por cada endpoint existente: ruta, permiso, request/salida/error; pruebas de regresión de todos los flujos. Si faltan ajustes, PR puntual que no cambia el contrato sin acuerdo.

### BE-07 — Semillas no destructivas (HU-13/15; integridad) · P0 · pareja FE-05 · C-07

- Auditar seed actual: debe crear datos iniciales ausentes sin machacar guías y pasos editados por el personal. Si se autoriza actualizar semillas, usar marcas de autor/propiedad y control de modificaciones, evitando reemplazo por slug en cada inicio.
- Prueba automática `seed→modificar título/paso por gestión→seed→comparar`: edición persiste; `seed` idempotente; datos obligatorios nuevos se incorporan sin duplicarse; no tocar guías reales para la prueba; no resetear DB de otro miembro.
- Si el problema anterior ya está resuelto, dejar evidencias y cerrar como verificado, no aplicar refactor. **Entregar seguridad de datos antes de las pruebas del editor.**

### BE-08 — Contenido/alcance, aprobación editorial (HU-09/17–20/25–27) · P0 coordinación · pareja FE-12 · C-02

- Documentar categorías y guías publicadas reales (F00: 5/15), confirmar 4 modalidades obligatorias y una actividad por guía, >=5 casos de phishing y contenidos de contraseñas/verificación.
- Presentar D-01 al PO: mantener contenido extra publicado vs limitar visibilidad según backlog; **no eliminar ni reescribir contenido**; cambios editoriales y seeds solo con aprobación. Documentar versión de semilla/estado para evitar sorpresas.
- FE recibe decisión editorial y query/filtro usado; BE garantiza que GET público devuelve solo PUBLICADA. Esta decisión no debe impedir trabajo de FE-01..11 en paralelo.

### BE-09 — Infraestructura e integración general (transversal; HU-45) · P1 · pareja FE-11/14 · C-00/C-01

**Estado:** `PASS_BE` en la rama `feat/be-09-fe-11-infra-qr` (junto con FE-11). Hecho: `/health` comprueba la BD (`503` si no responde); Swagger apagado en producción salvo `SWAGGER_HABILITADO=true`; `Secure` de la cookie configurable con `COOKIE_SEGURA`; `trust proxy` para redes privadas (límite por IP detrás de Nginx); `pnpm test` del frontend en el CI. Verificado en Docker: health 200/503 y recuperación, rutas profundas y `/codigos-qr` por Nginx, `POST /consultas` 204, cookie `HttpOnly; SameSite=Strict; Path=/api/v1/auth`, refresh y reuso por el proxy, eliminación de la cuenta de prueba, logs sin tokens. Ya estaba bien: Nginx (proxy + SPA fallback), redacción de logs, PostgreSQL 15 en CI. Pendiente: URL pública real con HTTPS (decisión de despliegue) y FE-14.

- Verificar en entorno aislado Docker PostgreSQL 15, migraciones/seeds idempotentes, Nest health + DB readiness (health actual no verifica BD), CORS/cookies HTTPOnly/secure en despliegue, Vite proxy local y frontend Nginx `/api/v1` + SPA fallback.
- Verificar `GET /guias/:slug` y recarga navegador `/guias/smishing` desde URL pública real, `POST consultas`, QR de FE-11, Swagger en entorno adecuado, logs sin secretos, configuración production sin claves de desarrollo.
- CI FE `pnpm test/lint/format:check/build` + backend test/unit/e2e (según scripts existentes); las HU-36–39 exigen validación frontend y se evidencian en FE-13. Documentar pasos reproducibles, sin borrar volumen ni aplicar migraciones destructivas sin aprobación.
- **Entrega FE:** URL pública, cookies correctas, rutas deep link y API con certificación de funcionamiento desde otro equipo.

## 4. Primera ejecución sugerida para agente BACKEND

> Antes de editar audita **solo** BE-01/BE-02 y revisa existencia real de BE-03/BE-04. Contrasta C-03/C-04/C-05/C-06/C-10/C-11 con los controladores/Prisma actuales. Entrega contratos concretos, mapa de migraciones y pruebas previstas para aprobación. No modifiques frontend, no reescribas seeds/contenido educativo y no hagas Git de escritura. Cuando aprueben una sola unidad, implementa/testea y detente para revisión humana.
