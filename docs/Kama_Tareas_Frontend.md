# Kamá — Plan de tareas pendientes del frontend

**Versión de trabajo:** 1.0 · **Fecha:** 26 de noviembre de 2026  
**Responsable:** equipo frontend · **Carpeta de implementación:** `frontend/`  
**Objetivo inmediato:** terminar los flujos funcionales obligatorios de Kamá, integrarlos con la API real y entregar una demostración de extremo a extremo.  
**Estado:** propuesta de priorización; debe ser revisada por el equipo y el Product Owner cuando afecte el alcance.

## 1. Fuentes y alcance

Este listado se elaboró a partir del **Backlog Kamá v2.1 validado** (28 historias Must), el **Modelo de datos Kamá v2.0**, el plan `docs/Kama_Plan_Maestro_Frontend_SDD.md`, la documentación académica compartida y el **diagnóstico F00 de Claude Code** comunicado por el equipo el 26/11/2026.

- Las **HU y sus criterios** pertenecen al backlog v2.1; este documento **no los reemplaza**.
- Los resultados F00 provienen del informe de Claude Code que compartió el equipo, **no de una nueva auditoría del repositorio por el autor de este plan**.
- El contenido educativo implementado se **conserva**. No borrar, reescribir o reemplazar guías, ejemplos, preguntas ni semillas para conciliar una diferencia de alcance sin aprobación del PO.
- Se priorizan **integraciones funcionales**; las HU-36 a HU-39 de accesibilidad siguen siendo **Must** y deben cerrarse antes de afirmar cumplimiento total, aunque se ejecuten después de los bloqueos funcionales.
- No implementar historias Should, Could o Won't por iniciativa propia. **HU-16 (administrar categorías) es Won't**.
- El frontend mantiene su arquitectura `domain / application / infrastructure / presentation / main` y usa repositorios/adaptadores, no llamadas HTTP improvisadas en las páginas.
- Se permite inspeccionar `backend/` **solo para consultar contratos y pruebas**, sin cambiarlo desde una tarea frontend.
- **GitHub Flow**: estudiantes crean ramas, commits y PR manualmente; el agente no ejecuta operaciones Git de escritura. PR con al menos una aprobación y CI en verde antes del merge.

**Prioridad de ejecución (no modifica MoSCoW):** `P0` = desbloquea la demo integrada; `P1` = sigue siendo necesario para completar todas las Must o estabilizar; `BLOQUEADA` = depende de API o decisión externa.  
**Estados:** `CONFIRMADO` (defecto reportado en código/ejecución por F00), `REVISAR` (existe código o falta prueba E2E), `DEPENDENCIA BE`, `DECISIÓN PO`.

### Línea base disponible

- Frontend React + TypeScript + Vite, con repositorios HTTP y componentes existentes. `pnpm test` **65/65**, `pnpm lint`, `pnpm format:check` y `pnpm build` **aprobados en F00**.
- La API está bajo `/api/v1`. Claude comprobó con backend y base de datos activos endpoints de categorías, guías, actividad y ayuda.
- **Confirmado:** actividades siguen usando preguntas simuladas; resultados tienen valor ficticio predeterminado; `AyudaPage` es estática; repositorios de guías realizan fallback silencioso al mock ante HTTP 500; progreso es una página estática.
- **No confirmado en E2E:** registro público, login del personal, editor de guías, cola, estadísticas, supresión de cuenta y QR.

## 2. Tablero resumido de trabajo

| ID | Prioridad | Historia(s) | Estado | Resultado buscado | Dependencias |
|---|---|---|---|---|---|
| **FE-01** | P0 | HU-03, 21, 25 | CONFIRMADO / DEPENDENCIA BE | Práctica con preguntas y respuestas reales | BE-01 |
| **FE-02** | P0 | HU-03, 21 | CONFIRMADO | Resultados auténticos; nunca 4/5 inventado | FE-01 |
| **FE-03** | P0 | HU-09, 10, 21 | CONFIRMADO | Errores HTTP explícitos, sin éxito simulado | API operativa |
| **FE-04** | P0 | HU-28, 29 | CONFIRMADO | Solicitud y seguimiento/cancelación de ayuda | BE-02 |
| **FE-05** | P0 | HU-13, 15 | REVISAR | Edición y publicación de guías por personal | BE-06; BE-07 |
| **FE-06** | P0 | HU-30 | REVISAR | Cola operativa para monitores | BE-02; BE-06 |
| **FE-07** | P0 · BLOQUEADA | HU-23 | REVISAR / DEPENDENCIA BE | Progreso persistente de usuario registrado | BE-03 |
| **FE-08** | P0 · BLOQUEADA | HU-31 | REVISAR / DEPENDENCIA BE | Panel real de estadísticas | BE-04 |
| **FE-09** | P0 | HU-01, 02, 05 | REVISAR | Registro, sesión y eliminación de cuenta probados | BE-05 |
| **FE-10** | P0 | HU-04, 06 | REVISAR | Acceso y administración del personal probados | BE-05 |
| **FE-11** | P1 Must | HU-45 | REVISAR | QR público descargable/imprimible | URL pública; BE-09 |
| **FE-12** | P0 para aceptación | HU-09, 10, 17–20, 25–27 | DECISIÓN PO | Contenido aprobado disponible y visible | BE-08 / PO-01 |
| **FE-13** | P1 Must | HU-36–39 | DEFECTOS CONFIRMADOS | Accesibilidad obligatoria validada | Pruebas UI y CI |
| **FE-14** | P0 cierre | Todas Must | REVISAR | Recorridos E2E, seguridad visible y entrega | FE-01–13 y BE |

## 3. Fichas ejecutables de frontend

### FE-01 — Integrar prácticas con el backend real

**Prioridad:** P0 · **HU:** 03, 21, 25 · **Estado:** confirmado pendiente.  
**Dónde empezar:** `GuiaPracticaPage`, dominio/casos de uso de guías y `HttpGuiasRepository`.

**Trabajo:**
1. Revisar DTO/respuestas reales de `GET /api/v1/guias/:slug/actividad`, `POST /api/v1/guias/:slug/actividad/intentos` y `POST /api/v1/intentos/:id/respuestas`.
2. Adaptar contratos de dominio a identificadores UUID y a **2–4 opciones** por pregunta; eliminar la restricción del mock `A | B | C`.
3. Presentar **una pregunta a la vez**, progreso de la actividad y retroalimentación que llega **después** de responder; nunca recibir ni exponer `es_correcta` anticipadamente.
4. Separar explícitamente dos recorridos: **registrado** (intentos persistentes por API) e **invitado** (estado y resultados solo en memoria). No utilizar un endpoint que persista intentos anónimos como solución definitiva.
5. No editar preguntas, ejemplos o explicaciones existentes.

**Aceptación:** actividad real por slug → preguntas reales → envío de respuesta → retroalimentación real → fin de actividad; 1–10 preguntas, 2–4 opciones y umbral de aprobación conforme al servidor; invitado no deja progreso educativo persistente. Pruebas de casos de uso, respuestas 4xx/5xx y ejecución con BD.  
**Bloqueo:** BE-01 debe confirmar el contrato no persistente de invitado; mientras tanto puede implementarse y probarse el flujo autenticado sin presentar invitados como terminados.

### FE-02 — Resultados reales y navegación de cierre

**Prioridad:** P0 · **HU:** 03, 21 · **Estado:** confirmado pendiente.

**Trabajo:** eliminar el valor simulado `4 de 5` de `GuiaResultadosPage`; usar solo aciertos, total, porcentaje, aprobación y explicación recibidos/calculados a partir del flujo real, con umbral del servidor. Admitir repetir o regresar a la guía. Si se abre la ruta sin estado válido, mostrar un mensaje para volver a empezar, **sin inventar resultados**. El resultado temporal de un invitado desaparece al recargar.

**Aceptación:** se reproduce el mismo resultado que devuelve el backend (o que deriva legítimamente de respuestas reales para invitado); nunca se ve una puntuación fija sin actividad previa.  
**Dependencia:** FE-01.

### FE-03 — Eliminar fallbacks silenciosos a datos de prueba

**Prioridad:** P0 · **HU:** 09, 10, 21 · **Estado:** confirmado en ejecución.

**Trabajo:** en adaptadores HTTP, no convertir automáticamente errores 500/502 en datos de `InMemoryGuiasRepository` como si fueran reales. Mostrar estados `cargando`, `sin datos` y `error/reintentar` en inicio, catálogo, detalle y práctica. Los mocks solo pueden usarse si existe un modo demo **explícito** y claramente identificado.

**Aceptación:** al apagar API o provocar HTTP 500, la interfaz muestra un error comprensible y no contenido de prueba silencioso; con API operativa, se muestran datos publicados del backend.

### FE-04 — Solicitud presencial de ayuda (visitantes incluidos)

**Prioridad:** P0 · **HU:** 28, 29 · **Estado:** `AyudaPage` estática.

**Trabajo:** crear el flujo `Ayuda` → `Llamar a un monitor` con identificador de equipo y tema del catálogo permitido por el backend; asociar guía/paso actuales cuando existan; usar `POST /api/v1/solicitudes-ayuda`; mostrar confirmación y **posición solo si la API la proporciona**; implementar consulta y cancelación de la solicitud respetando cookies/identificación y reglas de estado. Mostrar únicamente FAQ/glosario si están implementados; de lo contrario mantener la opción real de llamar al monitor.

**Aceptación:** un visitante sin iniciar sesión crea una solicitud sin duplicar otra activa del mismo equipo según la regla validada; puede consultar/cancelar la suya cuando corresponda; mensajes de éxito/error en español; con sesión de navegador estable.  
**Dependencia:** BE-02 (identificación, deduplicación, consulta/cancelación y posición).

### FE-05 — Administración de guías y pasos

**Prioridad:** P0 · **HU:** 13, 15 · **Estado:** probable pantalla por completar; confirmar con código antes de crear.

**Trabajo:** reutilizar controladores y adaptadores existentes para listar, crear borrador, editar título/objetivo/categoría/nivel/duración/palabras clave, administrar pasos, publicar, ocultar y reordenar pasos. Validar obligatorios, distinguir errores de negocio y limitar acceso por rol en frontend (la seguridad definitiva es BE). No crear un módulo paralelo si ya existe otro.

**Aceptación:** personal crea borrador no público, lo publica con al menos un paso, lo oculta conservando progreso y reordena pasos; administrador/monitor autorizado puede editar; usuario público no accede. **Pruebas con contenido ficticio aislado, nunca sobre guías reales sin autorización.**  
**Dependencias:** BE-06 (DTO) y BE-07 (semillas no destructivas).

### FE-06 — Cola del personal para solicitudes

**Prioridad:** P0 · **HU:** 30 · **Estado:** probable pendiente.

**Trabajo:** pantalla autenticada con solicitudes pendientes ordenadas por antigüedad; equipo, tema, guía/paso y tiempo de espera; acciones `Tomar`, `Resolver` y comentario; estado `En atención`; manejo de 409 o equivalente ante toma simultánea; actualización mediante **polling cada 15 segundos como máximo**, sin WebSockets.

**Aceptación:** dos monitores no pueden adjudicarse la misma solicitud; lista se refresca sin recargar; transiciones válidas; errores y vacíos controlados. La cancelación por el visitante se rige por el contrato aprobado (modelo v2.0: mientras esté pendiente).  
**Dependencias:** BE-02 y BE-06.

### FE-07 — Progreso persistente para usuarios registrados

**Prioridad:** P0 · **HU:** 23 · **Estado:** página actualmente estática / API no verificada.

**Trabajo:** consumir API de pasos leídos y progreso por guía usando el usuario autenticado, mostrar barra con porcentaje numérico, estado `completada` o `pendiente` y enlace `Empezar`. Marcar completada cuando se haya leído hasta el último paso y aprobado la actividad, si aplica. Para visitante, mostrar invitación opcional a crear cuenta **sin fingir persistencia**.

**Aceptación:** el progreso registrado sobrevive a cerrar/iniciar sesión; no cruza cuentas; el visitante pierde su progreso temporal al recargar.  
**Dependencia:** BE-03, que debe confirmar o implementar endpoints y semántica.

### FE-08 — Panel estadístico del personal

**Prioridad:** P0 · **HU:** 31 · **Estado:** probable pendiente / API no verificada.

**Trabajo:** consumir endpoint(s) agregados del backend: top 10 guías más consultadas, consultas por categoría y número/temas de solicitudes. Selector de rango de fechas con últimos 7 días por defecto; estados de carga, vacío, error y control de rol. No descargar todos los registros para calcular gráficas en el navegador.

**Aceptación:** números coinciden con agregados del servidor para rango elegido; sin datos se muestra mensaje; usuarios sin rol permitido no acceden.  
**Dependencia:** BE-04.

### FE-09 — Validar el flujo público de cuenta y supresión

**Prioridad:** P0 · **HU:** 01, 02, 05 · **Estado:** UI y HTTP existentes; E2E no autorizado/probado en F00.

**Trabajo:** probar registro con consentimiento y validación OTP, inicio de sesión, refresh, cierre de sesión, rutas protegidas, manejo de 401/403 y **eliminación de cuenta** desde interfaz con confirmación por medio disponible. Completar solo elementos faltantes; no cambiar el contrato sin backend. Registrar la cuestión PO de la finalidad de fecha de nacimiento.

**Aceptación:** usuario ficticio se registra con consentimiento, valida, reingresa, renueva sesión, cierra sesión y elimina cuenta con eliminación/anonimización según BE; mensajes claros y sin filtración de tokens.  
**Dependencia:** BE-05 y autorización para operaciones de prueba con cuentas ficticias.

### FE-10 — Validar acceso y gestión del personal

**Prioridad:** P0 · **HU:** 04, 06 · **Estado:** pantallas existentes, E2E pendiente.

**Trabajo:** recorrer login del personal con segundo factor, cambio de contraseña temporal, crear/editar/desactivar cuentas desde administración y verificar que el rol de monitor no pueda gestionar empleados. Mantener campos/DTO actuales y corregir solo las diferencias observadas.

**Aceptación:** admin crea personal y lo desactiva; primer acceso obliga al flujo aprobado; usuario no admin recibe bloqueo; evidencia con cuentas ficticias.  
**Dependencia:** BE-05 y autorización explícita para escrituras de prueba.

### FE-11 — QR de plataforma, categorías y guías

**Prioridad:** P1 Must (después de bloqueos principales) · **HU:** 45 · **Estado:** no se observó componente específico; verificar antes de programar.

**Trabajo:** permitir descargar/imprimir QR para URL pública de inicio, categoría y guía; incorporar enlaces profundos públicos estables; uso sin autenticación. No imprimir códigos apuntando a `localhost`.

**Aceptación:** al escanear desde otro teléfono se abre la ruta correspondiente sin login; QR descarga/impresión operativos para personal.  
**Dependencia:** dirección pública/BE-09.

### FE-12 — Validación del contenido y catálogo aprobado

**Prioridad:** P0 de aceptación · **HU:** 09, 10, 17–20, 25–27 · **Estado:** requiere decisión PO.

**Trabajo:** documentar qué categorías y guías se muestran actualmente; contrastar las cuatro modalidades obligatorias **Smishing, Vishing, Quishing y Falso soporte**, una actividad inicial por guía, y las cinco o más simulaciones de phishing en conjunto. Verificar contraseñas/códigos y legitimidad de comunicaciones dentro de las guías existentes. **No editar ni reducir contenido existente.** Implementar solo un filtro de visibilidad si el PO lo aprueba y el contrato lo permite.

**Aceptación:** recorrido de las modalidades y contenidos transversales demostrable; evidencia/decisión PO ante divergencia del catálogo real (F00: 15 guías y cinco categorías) y backlog (MVP: una categoría Phishing y cuatro guías).

### FE-13 — Cierre de accesibilidad obligatoria (pospuesto, no descartado)

**Prioridad:** P1 Must · **HU:** 36–39 · **Estado:** defectos reportados por F00.

**Trabajo:** cerrar problemas de alto contraste ilegible, foco no visible, navegación principal ausente en móvil, teclado, formularios, 360 px, zoom 200 %, controles de al menos 44×44 y lectores de pantalla. Mantener funciones A-/A+, almacenamiento de preferencias y contenido intactos. Revisar Lighthouse CI >=90 y axe sin violaciones graves/críticas según HU-38.

**Aceptación:** todas las pantallas nuevas y existentes verifican criterios de HU-36–39, con evidencia manual y automatizada; no confundir una demo visual con aceptación formal. Puede hacerse después de FE-01–12 excepto los bloqueos de uso que afecten directamente a la demo.

### FE-14 — Pruebas integradas y cierre de entrega

**Prioridad:** P0 para cierre · **HU:** todas las Must · **Estado:** pendiente de verificación integral.

**Trabajo:** repetir `pnpm test`, `pnpm lint`, `pnpm format:check` y `pnpm build`, más smoke/E2E con API+PostgreSQL reales y rutas profundas. Recorridos obligatorios:
- **Visitante:** catálogo → guía → actividad → resultado → solicitar/cancelar ayuda, sin progreso persistente.
- **Registrado:** OTP/login → guía/práctica → progreso persistente → logout/reingreso → eliminar cuenta.
- **Monitor:** inicio de sesión → cola de ayuda → tomar/resolver → administración de guías según permiso.
- **Administrador:** cuentas del personal → estadísticas → QR.
- **Errores y permisos:** 400/401/403/409/500, pérdida de API, no mocks invisibles ni respuestas correctas prematuras.

**Aceptación:** matriz de 28 HU Must con evidencia `PASS_INTEGRATED`, `BLOCKED_API`, `FAIL` o `NOT_TESTED`; PR revisado y CI en verde. No declarar completada una HU solo por existir su página.

## 4. Secuencia recomendada para máxima velocidad

1. **En paralelo inmediatamente:** FE-03 (fallos de API), FE-04 (solicitud de ayuda), planificación FE-01; pedir al backend BE-01/02/03/04/06.
2. **Primera integración:** FE-01 (registrado; invitado según BE-01) → FE-02. Mientras tanto iniciar FE-05, FE-06 y FE-09/10 solo tras comprobar contratos.
3. **Cerrar dependencias:** FE-07 y FE-08 apenas BE-03/04 entreguen endpoints; FE-11 en cuanto exista URL pública; FE-12 con decisión PO.
4. **Cierre:** FE-13 y FE-14; la accesibilidad no bloqueante se trabaja después de integraciones funcionales, **pero debe aprobarse para cumplir el backlog**.

### Dependencias que debe entregar backend

| Se requiere en frontend | Entrega backend requerida |
|---|---|
| Práctica como invitado | BE-01: validación sin guardar intento ni progreso de invitado |
| Ayuda y cola | BE-02: cookies, deduplicación, posición y cancelación; BE-06: acciones del monitor |
| Gestión de guías | BE-06: DTO/endpoints; BE-07: semillas no sobrescriben ediciones |
| Progreso | BE-03: registrar paso y leer resumen de progreso autenticado |
| Estadísticas | BE-04: agregados y filtro temporal |
| Login/cuentas | BE-05: contratos verificados de OTP, roles y eliminación |
| QR | BE-09/despliegue: URL pública y rutas profundas funcionando |

## 5. Regla de ejecución de cada tarea (ODD + GitHub Flow)

1. Revisar solo el código relacionado; **no repetir F00 completo**.
2. Presentar tarea FE-XX, historias/criterios, archivos previstos, contratos, riesgos y tests; esperar aprobación humana.
3. Implementar **una unidad aprobada por vez** y no modificar `backend/`, semillas o contenido sin permiso.
4. Informar resultados exactos: `PASS_FE`, `PASS_INTEGRATED`, `BLOCKED_API`, `BLOCKED_DECISION`, `FAIL` o `NOT_TESTED`; no presentar mocks como API real.
5. Detenerse para revisión. Un estudiante hace manualmente `git add`, `git commit`, `git push`, crea el PR y lo fusiona solo con **una aprobación y CI verde**.
6. Crear issues con prefijos `FE-XX` en título y ramas `feat/<issue>-descripcion` o `fix/<issue>-descripcion`, usando el **número real** del issue; commits Conventional Commits.

**Fuera de alcance inmediato:** HU-07, 08, 11, 12, 14, 22, 24, 32–35, 40–44 por prioridad Should/Could, y HU-16 por Won't, salvo aprobación formal. Las tres fechas y puntos de sprint del backlog se mantienen como planificación histórica, sin modificarse.
