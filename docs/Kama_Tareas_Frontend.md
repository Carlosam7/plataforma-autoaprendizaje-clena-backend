# Kamá — FRONTEND: tareas ejecutables y contratos de integración

**Versión:** 2.0 — propuesta técnica para aprobación por frontend, backend y Product Owner · **Fecha:** 26/11/2026  
**Objetivo:** cerrar todas las historias Must con trabajo **realmente paralelo** y contratos explícitos desde el comienzo, sin reconstruir los módulos existentes.  
**Alcance del documento:** tareas frontend y **copia completa del mismo catálogo de contratos** que utiliza el otro equipo. Este archivo se puede usar de forma independiente en GitHub Projects o como instrucción para Claude Code.  
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
| R2 — guías del personal | FE-05 | BE-06, BE-07 | C-07 ya existe; FE editor, BE confirma seeds y permisos | Crear→editar→publicar→ocultar |
| R2 — cola monitores | FE-06 | BE-02, BE-06 | C-06 existe; FE polling, BE transiciones | Dos monitores, una toma |
| R2 — cuentas | FE-09, FE-10 | BE-05 | C-08, C-09 existentes | Registro/OTP, personal, eliminación |
| R2 — progreso | FE-07 | BE-03 | C-10 propuesto; FE UI y mocks en tests; BE API y BD | Persistencia por usuario |
| R2 — estadísticas | FE-08 | BE-04 | C-11 existente (BE-04); FE gráficos contra la API real | Panel real por fechas |
| R3 — QR y deploy | FE-11, FE-14 | BE-09 | C-01 y ruta pública; FE QR, infra prueba reload | URL pública desde teléfono |
| R3 — calidad Must | FE-13 | BE-09/CI | HU-36–39 (sin nuevo endpoint obligatorio) | Evidencia de accesibilidad y CI |

**Secuencia para evitar conflictos:** acordar C-04/C-10/C-11 y seguridad C-05 **al inicio**; FE-03/04/05/06/09/10 pueden avanzar sobre rutas existentes. FE-01 desarrolla soporte de UUID/opciones y resultado sin esperar C-04; BE-01 entrega el canal invitado en paralelo. FE-07/08 crean interfaz y tests con fixtures contractuales mientras BE-03/04 entrega API. Un único integrador valida el flujo completo por cada contrato.

## 2. Catálogo de contratos compartidos (texto idéntico en ambos documentos)

**Identificador de catálogo:** `KAMA-API-CLOSE-2026-11-26-v2`. Los contratos EXISTENTE fueron revisados en controladores/DTO en `dev` y deben **revalidarse en la rama donde se hagan los PR**; los PROPUESTO constituyen un diseño de integración para aceptar. Todos los paths son relativos al prefijo `/api/v1`.

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
- **Verificación de contrato:** comparar OpenAPI `/docs` o `/docs-json` **si está servido** y JSON reales. El texto de este documento no modifica automáticamente los DTO del servidor.

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

### C-02 — Listado de categorías y contenido aprobado [EXISTENTE + D-01]

Contrato actual: GET `/categorias`, GET `/guias?categoria=<slug>`. El frontend **no debe convertir silenciosamente** `phishing` en `seguridad-digital` ni imponer un conjunto artificial de categorías sin decisión PO y pruebas. Las cuatro guías exigidas por backlog son Smishing, Vishing, Quishing y Falso soporte técnico; sus preguntas incluyen HU-25/26/27 dentro de las actividades existentes. **La cantidad de datos semilla fuera de ellas no equivale a un nuevo requisito funcional.** FE puede mostrar los datos publicados reales; cambios de visibilidad/editorial requieren decisión D-01. Si la categoría está vacía, mensaje textual de HU-09, no error técnico.

### C-03 — Actividad real y persistencia de usuario registrado [EXISTENTE]

`GET /guias/:slug/actividad` **público** → `200`:

```json
{"titulo":"Práctica de Smishing","porcentajeAprobacion":70,"totalPreguntas":2,"preguntas":[{"id":"11111111-1111-4111-8111-111111111111","enunciado":"¿Qué harías ante un enlace sospechoso?","opciones":[{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},{"id":"33333333-3333-4333-8333-333333333333","texto":"Abrirlo inmediatamente"}]},{"id":"77777777-7777-4777-8777-777777777777","enunciado":"¿Debes compartir un código por teléfono?","opciones":[{"id":"88888888-8888-4888-8888-888888888888","texto":"No, nunca"},{"id":"99999999-9999-4999-8999-999999999999","texto":"Sí"}]}]}
```

Ejemplo didáctico de forma JSON: `totalPreguntas` debe igualar longitud de `preguntas` en respuestas reales; el servidor NO envía `esCorrecta`, `opcionCorrecta` ni explicación antes de responder. Actividad de 1–10 preguntas, cada una 2–4 opciones y exactamente una correcta en BD. `404` si la guía no existe/no está publicada/no tiene actividad.

`POST /guias/:slug/actividad/intentos` con `Authorization: Bearer` de **USUARIO_PUBLICO** (en la implementación dev acepta sesión opcional, pero ver C-04) cuerpo vacío → `201`:

```json
{"id":"44444444-4444-4444-8444-444444444444","totalPreguntas":2}
```

`POST /intentos/:id/respuestas` con el mismo usuario → cuerpo:

```json
{"preguntaId":"11111111-1111-4111-8111-111111111111","opcionId":"22222222-2222-4222-8222-222222222222"}
```

→ `201`:

```json
{"esCorrecta":true,"opcionCorrecta":{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},"explicacion":"Los mensajes sospechosos deben verificarse.","respondidas":1,"totalPreguntas":2,"resultado":null}
```

Con última pregunta, `resultado` es `{ "respuestasCorrectas":2,"totalPreguntas":2,"porcentaje":100,"aprobado":true,"porcentajeAprobacion":70 }`. `409` si pregunta repetida o intento finalizado. FE solo avanza tras respuesta confirmada; bloquear doble clic; **no reintentar POST respuestas automáticamente** si se pierde la respuesta de red, porque ya pudo haberse registrado (consultar posibilidad de recuperación/idempotencia con BE si se necesita).

### C-04 — Evaluación de práctica INVITADO sin persistencia [PROPUESTO: acuerdo crítico FE/BE]

**Discrepancia comprobable en código `dev`:** el controller permite sesión opcional en `POST .../intentos`, y `IniciarIntentoUseCase` llama a `intentos.crear()` aun cuando `usuarioId=null`. No se verificó directamente desde aquí si se guardó en PostgreSQL o un repositorio temporal; F00 obtuvo un UUID anónimo. El modelo v2.0 prohíbe filas para invitados. El backend debe comprobar con SQL el repositorio usado y su efecto antes de corregir.

**Propuesta de contrato único (NO EXISTE AÚN):** `POST /guias/:slug/actividad/evaluar-respuesta`, público, **sin guardar** intento/respuesta/progreso/paso. JSON:

```json
{"preguntaId":"11111111-1111-4111-8111-111111111111","opcionId":"22222222-2222-4222-8222-222222222222"}
```

→ `200`:

```json
{"esCorrecta":true,"opcionCorrecta":{"id":"22222222-2222-4222-8222-222222222222","texto":"No abrirlo"},"explicacion":"Los mensajes sospechosos deben verificarse."}
```

**Semántica propuesta:** validar que slug está publicado, pregunta pertenece a la actividad de esa guía, opción pertenece a pregunta, devolver el mismo feedback que C-03 sin exponer correcto en GET; no escribir tablas educativas ni crear sesión. `400` UUID/formato inválido, `404` guía/actividad/pregunta inexistente, `400` opción no pertenece. Como contrato stateless no detecta repetición ni puede impedir que un cliente técnico consulte varias opciones; **no prometer antitrampas que no existe**. El frontend mantiene `respuestas`, `paso` y calificación local **solo en estado React en memoria**. Calcula resultado con `correctas/total*100` y umbral recibido en C-03; se pierde al recargar. Mostrar invitación no obligatoria a registrarse. FE y BE **deben aprobar la ruta y forma exactas** antes del código. Alternativa viable solo mediante decisión compartida: sesión anónima efímera no persistente en servidor; no se asumirá por defecto.

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

### C-06 — Cola y acciones del personal [EXISTENTE]

`GET /solicitudes-ayuda?estado=PENDIENTE&pagina=1&limite=20&ordenarPor=creadaEn&direccion=asc` con Bearer PERSONAL/ADMINISTRADOR → `200` paginado `{datos:[SolicitudEnCola],total,pagina,limite}`. Registro:

```json
{"id":"55555555-5555-4555-8555-555555555555","equipo":"12","tema":"SEGURIDAD_DIGITAL","estado":"PENDIENTE","guia":{"slug":"smishing","titulo":"Smishing"},"paso":2,"creadaEn":"2026-11-26T19:00:00.000Z","atendidaPor":null,"tomadaEn":null,"resueltaEn":null,"comentarioResolucion":null}
```

`POST /solicitudes-ayuda/:id/tomar` Bearer PERSONAL/ADMINISTRADOR, sin body → `200` `SolicitudEnCola`, estado `EN_ATENCION`, `atendidaPor` nombre. Transición debe ser atómica `UPDATE ... WHERE estado='PENDIENTE'`; si tomó otro monitor `409`, FE recarga lista.

`POST /solicitudes-ayuda/:id/resolver` Bearer PERSONAL/ADMINISTRADOR, body `{"comentario":"Se explicó cómo verificar el mensaje."}` con texto opcional/null y máximo 500 → `200`, estado `RESUELTA`; `403` si no es quien la tomó; `409` si nadie la tomó o ya cerrada. FE polling **cada 15s**, lista ascendente por fecha y tiempo de espera calculado por `Date.now - creadaEn`; al desmontar cancelar intervalo/solicitudes. Para ver propios en atención usar GET con filtro `estado=EN_ATENCION` (ya soportado); nunca perderlos al pasar de pendiente a en atención.

### C-07 — Gestión de guías por personal [EXISTENTE]

Todos requieren Bearer rol PERSONAL o ADMINISTRADOR: `GET /gestion/guias`, `POST /gestion/guias`, `GET /gestion/guias/:slug`, `PUT /gestion/guias/:slug`, `POST /gestion/guias/:slug/publicar`, `POST /gestion/guias/:slug/ocultar`. GET listado paginado; POST crea en BORRADOR y genera slug; PUT **reemplaza** campos de guía y, si viene `pasos`, reemplaza la lista de pasos exactamente y en orden (omitir `pasos` no los modifica). DTO de escritura:

```json
{"titulo":"Guía de prueba","objetivo":"Identificar señales de engaño.","descripcion":"Guía temporal para pruebas.","categoria":"seguridad-digital","nivel":"BASICO","duracionEstimadaMin":8,"palabrasClave":["smishing"],"pasos":[{"titulo":"Comprueba el mensaje","bloques":[{"tipo":"texto","texto":"Verifica el remitente."},{"tipo":"aviso","nivel":"alerta","texto":"No compartas códigos."}]}]}
```

**Campos y validaciones EXISTENTE:** título 1–150; objetivo 1–300; descripción opcional <=2000; categoría es `slug` existente <=40; nivel BASICO/INTERMEDIO/AVANZADO; duración integer 1–600 min; palabras clave <=15, cada una <=40; pasos opcionales <=50; cada paso `{id?:UUID,titulo?:string|null (<=120),bloques:[...]} `, <=10 bloques por paso; tipos de bloque texto `{tipo:'texto',texto}`, aviso `{tipo:'aviso',nivel:'consejo'|'alerta',texto}`, imagen `{tipo:'imagen',imagenId:UUID,textoAlternativo}`; contenido max 600 letras por bloque texto. Si se edita paso existente conservar `id` UUID estable; si se omite el id el servidor lo crea nuevo. **No subir archivos**: HU-14 es Should y requiere módulo aparte si se activa.

**Salida existente:** `GuiaGestionDetalle` con `slug,categoria,titulo,objetivo,nivel,duracionEstimadaMin,estado,totalPasos,publicadaEn,creadaPor,actualizadaPor,creadoEn,actualizadoEn,descripcion,palabrasClave,pasos:[{id,orden,titulo,bloques}]`. `POST` 201, `PUT`/publicar/ocultar 200; publicar sin pasos 409; una PUBLICADA no puede quedar sin pasos 409; ocultar conserva datos y progreso. No editar guías reales en pruebas; usar un borrador ficticio y limpiarlo con autorización, ya que controlador no declara DELETE de guía.

**Dependencia BE-07:** resembrar dos veces tras editar el borrador **no debe pisar las ediciones**; antes de usar el editor con datos reales verificar el seed.

### C-08 — Cuenta pública, OTP y sesión [EXISTENTE]

- `GET /aviso-privacidad/vigente` público: `{version,contenido,vigenteDesde}`.
- `POST /auth/registro` público → 202; body:

```json
{"nombre":"Persona de prueba","numeroIdentificacion":"00000001","fechaNacimiento":"1955-08-21","correo":"prueba@example.test","aceptaAvisoPrivacidad":true,"canalVerificacion":"CORREO"}
```

  `telefono` alternativo, al menos teléfono o correo; DOB requerida en DTO actual aunque D-02 pide justificación. Salida `{registroId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`; nombre <=100, identificación <=30, fecha `YYYY-MM-DD`, email <=254, teléfono <=20, consentimiento true. `409` identificador/email/teléfono duplicado; `429` tasa límite.
- `POST /auth/registro/verificar` público → 201; body `{ "registroId":"UUID", "codigo":"123456" }`, seis dígitos. `POST /auth/registro/reenviar-codigo` → 202, `{registroId}`.
- `POST /auth/login` público → 202, `{numeroIdentificacion,contacto}`; salida `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. `POST /auth/login/verificar` público → 200, `{solicitudId,codigo}`. Login incorrecto 401 genérico sin revelar cuál dato.
- Verificación exitosa (login o registro) → `{usuario:{nombre,rol},accessToken,accessTokenExpiraEn,refreshTokenExpiraEn}` **más cookie `refresh_token` httpOnly**; el cuerpo no contiene refresh token. `POST /auth/refresh` con cookie y `credentials:'include'` → 200 `{accessToken,accessTokenExpiraEn,refreshTokenExpiraEn}` y nueva cookie; refresh token rota. `POST /auth/logout` con cookie → 204 y la elimina.
- `POST /auth/cuenta/eliminacion` Bearer USUARIO_PUBLICO → 202, `{canal?:'CORREO'|'TELEFONO'}`; `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. `POST /auth/cuenta/eliminacion/confirmar` Bearer → 204, `{solicitudId,codigo}`. Borrar datos y progreso, conservar métricas anonimizadas; limpiar estado FE y cookie. Sólo con **cuenta de prueba** y autorización.
- **Riesgo FE verificado en código:** `HttpAuthRepository` guarda access token en localStorage. Se requiere revisión de seguridad en equipos compartidos; no asumir que almacenar refresh ahí es aceptable. El refresh queda exclusivamente en cookie. Si se cambia estrategia de almacenamiento, hacerlo en un issue separado compatible con todos los módulos.

### C-09 — Personal y acceso privilegiado [EXISTENTE]

- `POST /auth/personal/login` público → 202, `{correo,password}`; OTP enviado a correo, salida con `{solicitudId,canal,destino,mensaje,expiraEn,puedeReenviarEn}`. `POST /auth/personal/login/verificar` → 200, `{solicitudId,codigo}`; `{usuario:{nombre,rol,debeCambiarPassword},accessToken,...}` + cookie httpOnly. `auth/refresh` y `auth/logout` compartidos con usuario público.
- `POST /personal/yo/password/codigo` Bearer PERSONAL/ADMINISTRADOR → 202, sin body, salida `{destino,expiraEn,mensaje}`. `POST /personal/yo/password` → 204, DTO **verificado en `CambiarPasswordInicialDto` de `dev`** `{codigo:"123456",passwordNueva:"NuevaClave2026"}`. **No** envía `solicitudId` ni `nuevaPassword`; FE debe respetar `passwordNueva`, código de seis dígitos y contraseña de hasta 72 caracteres. Revalidar rama de PR.
- `GET /personal?pagina=1&limite=20`, `GET /personal/:uuid`, `POST /personal`, `PATCH /personal/:uuid`, `POST /personal/:uuid/desactivar`, `POST /personal/:uuid/reactivar`: **solo ADMINISTRADOR**. POST JSON `{nombre,correo,passwordTemporal,rol:'PERSONAL'|'ADMINISTRADOR'}`, edición parcial `{nombre?,correo?,rol?}`. Respuesta `{id,nombre,correo,rol,activo,debeCambiarPassword,ultimoAccesoEn,creadoEn}`, listado paginado. `409` correo en uso; 403 personal normal. La contraseña temporal 8–72 con letra y número según DTO.
- **Riesgo FE verificado en código:** `HttpPersonalRepository` hace fallback a `InMemoryPersonalRepository` ante excepciones no `PersonalError`, incluso en acciones de autenticación/administración. **Nunca permitir credenciales ficticias exitosas ante un 500/offline**. Retirar fallback en entorno integrado.

### C-10 — Mi progreso persistente [PROPUESTO, implementarlo solo tras confirmar ausencia]

**Desacople clave:** GET `/guias/:slug` existente devuelve pasos con `orden` pero **sin `id` UUID**; la tabla `paso_leido` requiere ID persistente. Se propone extender **sin romper** el DTO público `pasos[]` con `id:UUID` estable. FE usa ese ID, no el ordinal, para marcar paso.

- `PUT /mi-progreso/guias/:slug/pasos/:pasoId` Bearer `USUARIO_PUBLICO`; cuerpo **vacío**; operación idempotente. Valida que el paso pertenece a la guía. Respuesta `200` con `ProgresoGuiaDTO` actualizado. Repetir no duplica `paso_leido` (PK usuario/paso).
- `GET /mi-progreso` Bearer `USUARIO_PUBLICO` → `200` `{datos:[ProgresoGuiaDTO]}`; opcionalmente solo guías publicadas; para guías ocultas con progreso conservar referencia no exponer contenido (definir presentación). `GET /mi-progreso/guias/:slug` → `200` un DTO y, si no hay avance, ceros.

```json
{"guia":{"slug":"smishing","titulo":"Smishing"},"pasosLeidos":2,"totalPasos":5,"porcentajeLectura":40,"actividadAprobada":false,"completada":false,"ultimoPasoId":"66666666-6666-4666-8666-666666666666","actualizadoEn":"2026-11-26T19:10:00.000Z"}
```

- **Reglas propuestas:** porcentaje `Math.round(100*min(pasosLeidos,totalPasos)/totalPasos)` con `totalPasos=0 => 0`; `completada` requiere que el usuario haya llegado al último paso y haya aprobado alguna actividad de la guía cuando exista; si no hay actividad, basta lectura hasta el final. BE calcula desde `paso_leido`, `progreso_guia` e `intento`, nunca acepta `usuarioId`, `porcentaje` o `completada` del cliente. El FE marca cada paso **al confirmarse que se visualizó**, no al abrir solamente el listado; enviar como máximo un PUT por paso y sesión/UI. `401` no sesión; `403` rol personal; `404` guía/paso ajeno; reordenar conserva IDs y lectura.
- **D-03 pendiente PO:** editar pasos después de publicación; no redefinir retroactivamente progreso sin acuerdo. Mostrar progreso cero para invitado sin invocar esta API y sin almacenar progreso en disco.

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

## 3. Tareas del FRONTEND — fichas de implementación

**Política FE:** modificar solo `frontend/`. Conservar `domain/application/infrastructure/presentation/main` y componentes educativos ya escritos. Backend solo lectura. No repetir F00, no reescribir contenido/semillas, no instalar librerías sin justificación. Cada tarea termina con revisión y commit humano. **Los ejemplos JSON obligatorios están íntegros en C-00…C-11 de este mismo archivo.**

### FE-01 — Prácticas reales (HU-03/21/25) · P0 · pareja BE-01 · contratos C-03/C-04

**Diagnóstico:** mock trae A/B/C y correctas en cliente; backend usa UUID y devuelve pregunta sin respuesta. 

- Crear/ampliar tipos `Actividad`, `Pregunta{ id,enunciado,opciones[] }`, `Opcion{id,texto}`, `Feedback`, `Resultado`, `PracticaSession`. Aceptar 2–4 opciones; nunca campo `esCorrecta` en DTO de GET.
- `application`: casos `obtenerActividad(slug)`, `iniciarIntentoAutenticado(slug)`, `responderAutenticado(intentoId,preguntaId,opcionId)`, `evaluarInvitado(slug,preguntaId,opcionId)` según C-03 y C-04; `iniciarInvitado` solo crea estado React temporal, **no POST intentos**.
- `infrastructure`: `HttpPracticaRepository` dedicado, llamadas correctas, validación y map de errores (400,401,403,404,409,500,red); credenciales con cookie y Bearer si autenticado. `HttpGuiasRepository` no es la fuente de preguntas; retirar `preguntas` derivadas de mock del detalle real.
- `presentation`: `GuiaPracticaPage` usa slug de ruta, muestra una pregunta cada vez con contador, bloquea repetición y avanza solo al recibir feedback; retroalimentación textual más icono, `opcionCorrecta` solo después de enviar. Si 409/timeout ambiguo en usuario autenticado, no reenviar por defecto; ofrecer reiniciar intento/volver a guía.
- **Modo paralelo:** FE implementa soporte UUID, renders, puertos, fixtures y tests ya con C-04; mantiene etiquetado `MOCK_ONLY` solo en tests hasta que BE-01 publique endpoint propuesto. No conectar invitado al `POST /intentos` actual con persistencia dudosa.
- **Pruebas:** contrato GET nunca contiene correctas; respuestas UUID y 2/3/4 opciones; 201/200 y 409, error red explícito; guest refresh pierde progreso, sesión registrada lo conserva; contenido de guías intocable.
- **DoD:** práctica real de cuenta registrada `PASS_INTEGRATED`; invitado solo tras C-04 `PASS_INTEGRATED` y BE demuestra cero filas educativas.

### FE-02 — Resultados verdaderos (HU-21) · P0 · pareja BE-01 · C-03/C-04

- Quitar por completo el resultado predeterminado `4/5`, incluido acceso directo a URL de resultados sin estado. Renderizar solo `resultado` devuelto en última respuesta autenticada o cálculo en memoria de respuestas invitado validadas por BE.
- Contenido: `respuestasCorrectas`, `totalPreguntas`, `porcentaje`, `porcentajeAprobacion`, `aprobado`, acciones `Repetir` (nuevo intento) y `Volver a guía`; nunca marcar aprobado por estilo o ruta.
- Definir presentación de resultado sin recarga: ruta con state válido/estado de aplicación; si URL directa sin resultado, mensaje `No hay un resultado disponible` + acción volver a la práctica (sin inventar). Para usuario registrado no crear endpoint de recuperar intento salvo decisión explícita; resultado puede perderse en reload de pantalla, aunque calificación siga en BD para progreso.
- Tests 0/N, 70 %, 100 %, 69 %, 409 al doble envío, deep-link sin state. **DoD:** ningún resultado ficticio y concordancia con C-03/C-04.

### FE-03 — Eliminar fallback de mocks silenciosos (HU-09/10/21/04/06) · P0 · BE-08 / C-00…C-03/C-09

- Retirar fallback incondicional de `HttpGuiasRepository` en `listarCategorias`, `listarGuiasPublicadas`, `obtenerDetalleGuia`; quitar también fallback de `HttpPersonalRepository` en operaciones autenticadas/administrativas.
- Permitir `InMemory*Repository` únicamente con selección **explícita y visible** de entorno de tests/storybook/demos aisladas; producción/conexión real siempre debe mostrar `error`, `reintentar`, nunca datos simulados ante 500/502/desconexión.
- `GET /guias/:slug` 404 -> not found real; catálogo `[]` -> mensaje vacío real; errores -> pantalla de error, no «Pronto habrá guías» si el BE está caído. Separar error de telemetría POST consultas del error al leer.
- Tests contractuales de GET 200/404/500, JSON inválido, timeout, reconexión, mocks ausentes en build integrado; revisar doble registro de apertura en StrictMode.
- **DoD:** caída del backend no se disfraza como aplicación funcionando.

### FE-04 — Solicitud de ayuda de punta a punta (HU-28/29) · P0 · pareja BE-02 · C-05

- Reusar botón global Ayuda; mostrar opciones FAQ/glosario solo cuando existan (si no, solo `Llamar a un monitor` como exige HU-28). `AyudaPage` pasa de texto estático a formulario real.
- Campos `equipo` requerido <=100, `tema` enum completo, `guiaSlug` y `pasoOrden` autoal entrar desde una guía; enviar exactamente C-05 `POST /solicitudes-ayuda` con `credentials:include` cuando BE confirme titularidad. No enviar `pasoOrden` sin guía.
- Estado reactivo tras 201 **o 200 yaExistia**: mensaje `Un monitor vendrá pronto`, posición, estado, cancelación `DELETE/:id` solo PENDIENTE; GET estado con intervalo razonable (15 s) mientras se espera; parar al desmontar; permitir reintento seguro por deduplicación de equipo una vez verificada en misma sesión.
- Si C-05 titularidad/cookie cambia, actualizar solo adaptador, no todos los componentes. Error 409 por estado actualizado: recargar estado. 401 si se pierde titularidad: pedir nueva solicitud/no revelar información ajena.
- Tests de datos mínimos, `200 yaExistia`, 201 nueva, 204 cancela, 409 ya tomada, 401/404, contexto del paso, no duplicado por doble clic, validación de formulario.
- **DoD:** visita sin sesión, ayuda y cancelación real, prueba mismo navegador; seguimiento sin mostrar datos ajenos.

### FE-05 — CMS guías del personal (HU-13/15) · P0 · parejas BE-06/07 · C-07

- Antes de construir, buscar si ya existe editor en `frontend/src/`; reutilizar componentes, layout personal, tokens y casos de uso. Solo crear lo faltante.
- Implementar `/personal/guias` y formulario de edición protegido (rutas concretas sujetas a router existente): listado con paginación/estado BORRADOR/PUBLICADA/OCULTA; editar título, objetivo, descripción, categoría real del GET, nivel, duración, palabras clave; crear borrador.
- Editor de pasos con lista ordenable (botones subir/bajar suficientes), bloques `texto` y `aviso` y **visualización** de `imagen` ya existente; no prometer upload si HU-14 Should. Usar `id` de pasos devueltos por GET gestión, conservarlos tras ordenar y editar.
- POST/PUT/publicar/ocultar según C-07. Modal de confirmación al eliminar un paso de contenido, sin tocar guías reales sin aprobación; validar título<=150, objetivo<=300, pasos<=50, bloque<=600 y publicar con >=1 paso.
- Asegurar que refresh del catálogo público refleja publicación/ocultamiento; 401/403 protecciones reales; roles PERSONAL y ADMINISTRADOR; manejo de 409 y guardado fallido.
- **DoD:** crear borrador ficticio → editar pasos → publicar → ocultar; BE demuestra que `seed` posterior no sobreescribe ediciones (BE-07).

### FE-06 — Cola monitor y atención (HU-30) · P0 · pareja BE-02/06 · C-06

- Pantalla protegida para PERSONAL/ADMINISTRADOR; `GET /solicitudes-ayuda?estado=PENDIENTE&...asc` cada 15s; paginación y filtros; lista visual de `equipo,tema,guia,paso,creadaEn,espera` con legibilidad y estado vacío.
- Botón tomar -> POST `/:id/tomar`, deshabilitar durante operación, 409 -> aviso y reconsultar; EN_ATENCION mostrar solicitudes propias o vista estado, para que no desaparezcan del trabajo del monitor.
- Resolver -> POST `/:id/resolver` con comentario opcional <=500; si 403 por monitor diferente mostrar sin permiso; al éxito actualizar lista; cancelar polling en desmontaje.
- Tests dos monitores compitiendo, 409 de segundo, 403 del ajeno, lista ordenada, polling con fake timers 15s, latencia/red/401, atenciones propias conservadas.
- **DoD:** dos sesiones de personal reales muestran propiedad de la solicitud; ninguna doble asignación.

### FE-07 — Mi progreso real (HU-23) · P0 · pareja BE-03 · C-10 PROPUESTO

- Crear tipos `ProgresoGuiaDTO` exactamente C-10 y repositorio HTTP independiente; FE **puede hacer toda la UI y contract tests desde ahora con fixtures**. No exponer barra estática como si fuese dato real.
- `GuiaDetallePage`: al leer cada paso, si hay USUARIO_PUBLICO autenticado, llamar PUT con `pasoId` UUID estable; BE agrega `id` a paso en GET público. Al salir/volver mantener idempotencia; evitar escribir progreso de invitado.
- `ProgresoPage`: GET `/mi-progreso`, render barra y porcentaje numérico y `Completada` o `Empezar`; estado sin progreso y error red diferenciados; usuarios no logueados ven invitación opcional a registrarse.
- No guardar avance del invitado en localStorage/sessionStorage; solo memoria durante navegación; prueba refresh limpia. Cerrar sesión y reingresar muestra avance registrado.
- **DoD:** con BE-03 en test DB marca un paso, autentica, vuelve, ve mismo porcentaje; otro usuario no ve sus datos. Seguir D-03 si cambia pasos publicados.

### FE-08 — Panel estadístico real (HU-31) · P0 · pareja BE-04 · C-11

**Estado BE:** `GET /gestion/estadisticas/resumen` disponible en la rama `feat/be-04-estadisticas` (BE-04). Contrato completo, orden de las listas y errores en C-11.

- UI protegida PERSONAL/ADMINISTRADOR: fechas calendario `desde/hasta` (últimos 7 días por defecto), top 10 guías, consultas por categoría y temas de ayuda, total de solicitudes; estados cargando, vacío (`hayDatos=false`), error y tabla accesible como alternativa a gráfico.
- Consumir GET `/gestion/estadisticas/resumen` según C-11, **no** filtrar manualmente todos los eventos ni inventar métricas. Convertir datos de DTO sin cambiar zona/semántica.
- FE hace mock **solo en tests** para desarrollar layout; BE puede entregar API mientras tanto. Tests periodos válidos/inválidos, red, empty, 401/403, orden de top 10.
- **DoD:** cifras cuadran contra registros de integración; sin fallbacks a cero inventados ante error.

### FE-09 — Registro, login, refresh, logout y eliminación (HU-01/02/05) · P0 · pareja BE-05 · C-08

- Verificar flujo completo E2E con cuentas ficticias autorizadas: aviso vigente → registro y consentimiento → OTP → sesión pública → refresh (cookie httpOnly) → logout → login OTP → solicitud eliminación → confirmación → no reingreso.
- Corregir campos exactamente `numeroIdentificacion,fechaNacimiento,correo/telefono,aceptaAvisoPrivacidad`, reenvío, `solicitudId`/`registroId` con nombres correctos; mantener 400/409/410/429 mensajes sencillos.
- Eliminar cuenta: añadir UI si falta, explicar consecuencias, pedir OTP, no borrar con solo clic, limpiar sesión/estado después de 204; no ejecutar sobre cuentas reales.
- Verificar que `credentials:'include'` llega a refresh/logout, guard de rutas y rol 403. Revisión adicional de almacenamiento de token en `localStorage` en computadores compartidos; no cambiar estrategia sin prueba de compatibilidad.
- **DoD:** pruebas 401/403/409/410/429, red, expiración y caso feliz; evidencias FE→BE con usuario ficticio.

### FE-10 — Acceso y gestión del personal (HU-04/06) · P0 · pareja BE-05 · C-09

- Comprobar que `AccesoPersonalPage`, `PrimerAccesoPage`, `GestionPersonalPage` no muestran fallback mock ante error. Mantener login correo+password → OTP → JWT/cookie, cambio obligatorio de contraseña y permisos de ADMIN.
- Repositorio de personal consume rutas exactas C-09, 202/200/204, paginación y `debeCambiarPassword`. Usar el DTO exacto `{codigo,passwordNueva}` confirmado en `dev` y revalidarlo con la rama de PR; completar UI faltante.
- Panel admin lista, crea con contraseña temporal, edita, desactiva, reactiva, muestra errores de correo en uso; usuario PERSONAL recibe 403.
- Tests 401 credenciales, OTP vencido, admin vs monitor, cambio inicial, alta/desactivación/historial, no fallback secreto.
- **DoD:** flujo E2E admin→personal ficticio→primer cambio→desactivar→no login, sin afectar cuentas reales.

### FE-11 — QR a enlaces públicos estables (HU-45) · P1 · pareja BE-09 · C-01

- Generar QR de inicio, categoría y guía con URL pública configurada del entorno; no usar `localhost` para QR impreso ni mostrar rutas privadas; producir archivo imprimible y descarga.
- Antes de instalar librería QR, revisar dependencias disponibles y obtener aprobación; alternativa compatible si ya existe dependencia. Uso sin sesión; probar escaneo con teléfono y refresh en ruta profunda.
- **DoD:** QR de cada guía/categoría apunta a pantalla correcta desde otro equipo y sin login.

### FE-12 — Contenido existente y catálogo, aceptación (HU-09/10/17–20/25–27) · P0 · pareja BE-08 · C-01/02

- Inventariar cuatro modalidades, actividad de cada guía, >=5 escenarios simulados en conjunto, contenido de claves/códigos y verificación de comunicaciones integrado; reportar solo cobertura real, sin reescribir material educativo.
- Revisar filtrado/slug `phishing` frente a `seguridad-digital`, catálogo 15/5 reportado; **D-01 PO decide** mostrar todo lo publicado o restringir visibilidad inicial. No borrar extras sin acta.
- **DoD:** matriz de criterios Must por guía con capturas y decisión PO en diferencias; sin regresiones de contenidos.

### FE-13 — Accesibilidad Must al cierre funcional (HU-36–39) · P1 · prueba compartida

- Mantener cambios después de las integraciones que impactan pantallas; corregir al menos bloqueos de uso: navegación móvil inexistente, alto contraste ilegible, foco invisible en opciones y botones; después revisar tamaño 44x44, teclado y lector de pantalla.
- Validar evidencia WCAG 2.2 AA, axe sin problemas serios/críticos y Lighthouse accesibilidad >=90 **si así lo exigen AC vigentes**; no declarar 100% Must sin esas pruebas. FE nunca modifica contenido para resolver estilo.
- **DoD:** capturas/pruebas en 360px, 200% zoom, teclado, contraste, mensajes de error, focus y CI, criterios HU-36–39 trazados.

### FE-14 — Integración total y cierre (todas las Must) · P0 · pareja BE-09 · C-00…C-11

- E2E real con PostgreSQL y backend activo: visitante catálogo→detalle→actividad→resultado→ayuda/cancelación; usuario público OTP→práctica→paso leído/progreso→logout/login→eliminación; personal editor/cola; administrador cuentas/estadísticas; QR público, rutas profundas.
- Error matrix: 400,401,403,404,409,410,429,500/red; cookies y CORS, rechazo a roles, no fallback de mock, pruebas de reintento no duplicado, seeds conservan ediciones, historial no sensible.
- Ejecutar `pnpm test`, `pnpm lint`, `pnpm format:check`, `pnpm build`; pruebas contractuales FE y BE y CI, evidencia por HU Must `PASS_INTEGRATED`/`BLOCKED_CONTRACT`/`FAIL`/`NOT_TESTED`.
- **DoD:** ningún flujo Must crítico se entrega `MOCK_ONLY`; todas las observaciones de QA listadas y corregidas o explícitamente aceptadas por PO si son de alcance.

## 4. Primera ejecución sugerida para Claude Code (FRONTEND)

> Toma FE-03 y FE-04 como trabajo funcional independiente en una rama aprobada por un estudiante; antes de editar presenta los contratos C-00/C-05, archivos afectados, pruebas y riesgo. No repitas F00. Ejecuta una sola unidad aprobada, verifica tests y detente para revisión/commit humano. En paralelo prepara diseño FE-01 con C-03 y C-04 (este último aún PROPUESTO). No implementes BE ni Git de escritura.
