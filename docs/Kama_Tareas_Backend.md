# Kamá — Plan de tareas pendientes del backend

**Versión de trabajo:** 1.0 · **Fecha:** 26 de noviembre de 2026  
**Responsable:** equipo backend · **Carpeta de implementación:** `backend/` y configuración compartida únicamente cuando esté autorizada.  
**Objetivo inmediato:** validar y completar APIs/reglas necesarias para que el frontend cierre las historias Must usando PostgreSQL real.  
**Estado:** propuesta de priorización; no supone que los endpoints faltan sin inspección de código y pruebas.

## 1. Fuentes, límites y evidencia

Fuentes: **Backlog Kamá v2.1 validado** (28 historias Must), **Modelo de datos Kamá v2.0**, diagnóstico frontend F00 de Claude Code facilitado el 26/11/2026, documentación académica y plan maestro del frontend.

- El informe F00 confirma respuestas HTTP reales de guías, actividades y creación de ayuda, pero **no equivale a auditoría completa de backend**.
- La estructura del backend contiene módulos de `auth`, `personal`, `guia`, `practica`, `ayuda` y otros; por tanto **primero revisar lo existente y corregir/integrar**, no reconstruir.
- Las entidades, DTO, controladores, Prisma, semillas y pruebas del backend solo los cambia el equipo autorizado de backend. Claude asignado a frontend mantiene backend **de solo lectura**.
- Contenido educativo de las guías **protegido**: no reescribir, eliminar ni reducir material sin aprobación expresa del Product Owner.
- No desarrollar Should/Could/Won't sin aprobación. **HU-16 (gestión dinámica de categorías) queda fuera del MVP**.
- Aplicar Clean Architecture existente, validación uniforme, Swagger, 401/403 y pruebas unitarias/e2e; migraciones versionadas y sin operaciones destructivas sin autorización.
- GitHub Flow: estudiantes realizan commits/PR manualmente, con Conventional Commits, una aprobación y CI verde.

**Prioridad de ejecución:** `P0` desbloquea una historia Must del frontend o protege datos; `P1` es cierre/despliegue/riesgo que sigue siendo necesario.  
**Estados:** `REPORTADO` por F00, `REVISAR` sin evidencia E2E, `DEPENDENCIA PO` pendiente de decisión, `RIESGO HISTÓRICO` detectado antes pero no revalidado.

### Línea base constatada por F00

- `GET /api/v1/categorias`, `/guias`, `/guias/smishing`, `/guias/smishing/actividad` y `/aviso-privacidad/vigente` respondieron 200 con PostgreSQL activo.
- `POST /api/v1/guias/smishing/actividad/intentos` y `POST /api/v1/intentos/:id/respuestas` funcionaron en una prueba. El backend devolvió resultados y evitó contestar un intento finalizado dos veces.
- `POST /api/v1/solicitudes-ayuda` respondió 201; la lectura posterior sin la cookie de la solicitud devolvió 401. Esto **puede ser el control esperado de identidad**, no un fallo confirmado.
- F00 reportó **15 guías en cinco categorías**, mientras el backlog aprobado describe el MVP inicial de **cuatro guías bajo Phishing**. El equipo quiere preservar el contenido actual; queda pendiente la decisión formal de alcance/visibilidad.
- El árbol compartido no mostraba módulos explícitos de progreso o estadísticas; **su ausencia real debe comprobarse**, incluyendo rutas definidas en otros módulos.

## 2. Tablero resumido de backend

| ID | Prioridad | Historia(s) | Estado | Resultado buscado | Desbloquea |
|---|---|---|---|---|---|
| **BE-01** | P0 | HU-03, 21, 23 | REPORTADO / verificar BD | Invitados practican **sin persistir** intentos educativos | FE-01, FE-02 |
| **BE-02** | P0 | HU-29, 30 | API parcial probada | Solicitud, identificación, deduplicación y cancelación correctas | FE-04, FE-06 |
| **BE-03** | P0 | HU-23 | REVISAR | API de pasos leídos y progreso persistente | FE-07 |
| **BE-04** | P0 | HU-31 | REVISAR | Agregaciones estadísticas por periodo | FE-08 |
| **BE-05** | P0 | HU-01, 02, 04–06 | REVISAR | Autenticación, personal y eliminación verificadas E2E | FE-09, FE-10 |
| **BE-06** | P0 | HU-13, 15, 30 | REVISAR | Contratos seguros de gestión de guías y cola | FE-05, FE-06 |
| **BE-07** | P0 protección de datos | HU-13, 15, 17–20 | RIESGO HISTÓRICO | Semillas no sobrescriben ediciones del personal | FE-05 |
| **BE-08** | P0 decisión/aceptación | HU-09, 17–20, 25–27 | DEPENDENCIA PO | Alcance publicado coherente sin borrar contenido | FE-12 |
| **BE-09** | P1 despliegue | Transversal; HU-45 | REVISAR | Entorno reproducible, proxy y URL pública real | FE-11, FE-14 |

## 3. Fichas ejecutables de backend

### BE-01 — Corregir o confirmar práctica de invitados no persistente

**Prioridad:** P0 · **HU:** 03, 21, 23 · **Tipo:** posible bloqueo funcional y de privacidad.

**Evidencia y discrepancia:** en F00 se pudo crear un intento sin iniciar sesión usando `POST /guias/smishing/actividad/intentos` y responder cuatro preguntas. Esto **sugiere** persistencia anónima, pero hay que inspeccionar la base de datos para confirmar si se creó una fila. El modelo v2.0 exige **`intento.usuario_id NOT NULL`**, intentos persistentes solo para registrados y progreso de invitados únicamente en memoria de React.

**Trabajo:**
1. Comprobar esquema/migraciones efectivamente aplicadas y si existen filas de intento sin usuario; **no ejecutar limpiezas destructivas sin aprobación**.
2. Revisar guard/flujo del intento, respuestas y feedback para público vs registrado.
3. Definir con frontend contrato para **evaluar una pregunta de invitado sin guardar intento ni respuesta** y sin revelar respuesta correcta antes de contestar. Puede ser endpoint público de validación sin persistencia u otra solución acordada; no inventar ruta sin contrato.
4. Conservar el flujo seguro/persistente para usuario registrado; errores y calificación >=70 %.
5. Agregar pruebas: invitado no crea filas; registrado sí; intento finalizado no puede recontestarse; preguntas públicas no incluyen `es_correcta`.

**Aceptación:** un visitante completa una actividad y ve aciertos/explicaciones, pero no genera `intento`, `respuesta_intento`, `progreso_guia` ni `paso_leido`; recarga y pierde progreso. Usuario autenticado conserva los registros previstos.  
**Desbloquea:** FE-01 y FE-02.

### BE-02 — Consolidar solicitudes de ayuda y cola

**Prioridad:** P0 · **HU:** 29, 30 · **Tipo:** validación + corrección solo si falla.

**Evidencia:** `POST /solicitudes-ayuda` devolvió 201. `GET /solicitudes-ayuda/:id` sin cookie devolvió 401. F00 también obtuvo solicitudes separadas, pero **no está probado que se repitiera la misma sesión/cookie/equipo**.

**Trabajo:**
1. Probar `POST → GET → POST repetido → CANCELAR`, reutilizando la **misma cookie**, mismo equipo y misma solicitud, con datos ficticios.
2. Comprobar que se evita duplicar una solicitud activa por equipo según regla aprobada; devolver una solicitud/estado reutilizable y posición de cola si corresponde.
3. Verificar que el visitante solo pueda leer/cancelar **su propia** solicitud. Según modelo v2.0, cancelar mientras esté `PENDIENTE`.
4. Verificar listado por orden de llegada y transiciones del monitor `PENDIENTE → EN_ATENCION → RESUELTA`, comentario, identidad del monitor, y toma atómica para evitar doble asignación.
5. Validar endpoints, DTO, cookies, CORS/SameSite, reglas de error/401/403/409 y Swagger.

**Aceptación:** una sesión de visitante no duplica activas ni puede manipular solicitudes ajenas; dos monitores no toman el mismo caso; API ofrece lo que FE-04/06 necesitan. **No tratar un 401 sin cookie como bug por sí solo.**

### BE-03 — API de progreso de usuarios registrados

**Prioridad:** P0 · **HU:** 23 · **Tipo:** verificar, implementar solo si falta.

**Trabajo:**
1. Buscar código, rutas y tablas reales `progreso_guia`, `paso_leido` y relación con intentos; no inferir ausencia por nombre del módulo.
2. Confirmar o diseñar endpoints autenticados para **marcar paso leído** y **consultar progreso agregado por guía**, coordinando DTO con FE-07.
3. Calcular porcentaje desde `pasos leídos / total de pasos`, con progreso como completado al llegar al último paso **y aprobar la actividad si existe**.
4. Respetar aislamiento por usuario, autenticación, borrado tras HU-05 y no persistencia para invitados.
5. Documentar pendiente PO: qué ocurre con progreso de una guía publicada al eliminar o modificar pasos.

**Aceptación:** usuario A no ve progreso de B; avance sobrevive logout/login; respuestas sin autenticar están protegidas; los invitados no crean registros; pruebas unitarias y e2e.  
**Desbloquea:** FE-07.

### BE-04 — API de estadísticas agregadas del personal

**Prioridad:** P0 · **HU:** 31 · **Tipo:** verificar, implementar si falta.

**Trabajo:**
1. Comprobar si ya existe controlador/ruta de reportes y registros de consulta de guías. Confirmar que la apertura pública genera la métrica requerida sin capturar datos personales del invitado.
2. Exponer **top 10 de guías abiertas**, consultas agrupadas por categoría y número/temas de solicitudes, con filtro temporal y **últimos 7 días por defecto**.
3. Usar agregaciones PostgreSQL (`groupBy` o SQL controlado), nunca cargar todas las filas en memoria. Revisar índices de consultas por guía/fecha, permisos de personal y error/vacío.
4. Pactar un DTO mínimo con FE-08 y documentarlo en Swagger.

**Aceptación:** resultados verificables contra la BD para intervalos conocidos; 401/403 según rol; consultas eficientes y fechas/zonas horarias correctamente delimitadas; pruebas e2e.  
**Desbloquea:** FE-08.

### BE-05 — E2E de cuentas públicas, personal y eliminación

**Prioridad:** P0 · **HU:** 01, 02, 04, 05, 06 · **Tipo:** implementación existente por validar.

**Trabajo:** probar **solo con cuentas ficticias y autorización para escrituras**: registro con consentimiento + OTP, duplicados, login, renovación/rotación refresh, logout, protección 401/403; login con segundo factor para personal; primer cambio de contraseña temporal; administración/desactivación de personal solo por admin; eliminación de cuenta con confirmación y borrado/anonimización conforme al modelo v2.0. Verificar que el aviso de privacidad recoja finalidades efectivas.

**Bloqueo de alcance:** fecha de nacimiento exigida por HU-01 sin finalidad documentada; PO debe justificarla o tramitar formalmente su eliminación, sin improvisar motivos.

**Aceptación:** casos positivos/negativos con datos ficticios, no mostrar OTP/JWT en evidencias ni logs públicos; aislamiento de roles; registros educativos eliminados y métricas agregadas anonimizadas al borrar cuenta.  
**Desbloquea:** FE-09/10.

### BE-06 — Contratos de administración de guías y cola

**Prioridad:** P0 · **HU:** 13, 15, 30 · **Tipo:** confirmar antes de exigir desarrollo frontend.

**Trabajo:** listar controladores/DTO actuales de gestión de guías y cola; probar crear borrador, editar metadatos/pasos, publicar solo con al menos un paso, ocultar conservando progreso, reordenar; verificar permisos monitor/admin y errores uniformes. Para cola, revisar rutas de listado/toma/resolución y control de concurrencia. Documentar payloads/ejemplos de respuesta reales en Swagger y entregar mini contrato a frontend.

**Aceptación:** Swagger + pruebas E2E de respuestas 2xx/400/401/403/409 y reglas del dominio; no modificar material educativo existente durante las pruebas.  
**Desbloquea:** FE-05/06.

### BE-07 — Proteger ediciones del personal frente a seeds

**Prioridad:** P0 antes de pruebas de edición reales · **HU:** 13, 15 y guías 17–20 · **Tipo:** riesgo histórico por revalidar.

**Trabajo:** comprobar si `prisma/seed.ts` actualiza/reemplaza contenido por slug u orden al reiniciar; ejecutar prueba **sobre base desechable** `seed → editar guía ficticia → seed → verificar conservación`. Si el riesgo persiste, usar estrategia idempotente que inicialice ausentes sin sobrescribir cambios de personal, respetando datos obligatorios que sí deban actualizarse. Separar contenido de demostración de producción; documentar excepciones.

**Aceptación:** las ediciones del personal sobreviven reinicio y repetición de semillas; tests de regresión; **sin alterar ni borrar guías reales**.

### BE-08 — Definir visibilidad del catálogo y validar contenido

**Prioridad:** P0 para aceptación · **HU:** 09, 17–20, 25–27 · **Tipo:** depende de PO.

**Contexto:** F00 encontró **15 guías y cinco categorías**; el backlog v2.1/MDD v2.0 define como carga inicial del MVP una sola categoría Phishing y cuatro guías (Smishing, Vishing, Quishing, Falso soporte). El equipo indicó que el contenido ya existente cumple su finalidad. Una divergencia documental **no autoriza borrar ni modificar datos**.

**Trabajo:** elevar al PO el inventario real (categorías, guías publicadas y actividades), comprobar cuatro modalidades, al menos cinco simulaciones de phishing y transversalidad HU-26/27. Pedir decisión escrita sobre catálogo público de la entrega. Solo implementar reglas de visibilidad o semillas si hay aprobación y pruebas para conservar datos.

**Aceptación:** diferencia resuelta documentalmente y funcionalidad FE-12 validada; no crear nueva categoría/guía/actividad innecesaria ni implementar HU-16.

### BE-09 — Despliegue, infraestructura y CI reproducible

**Prioridad:** P1, pero bloqueante de demo pública y HU-45 · **Ámbito:** backend, operaciones y cambios compartidos aprobados.

**Trabajo:** verificar `docker compose` con PostgreSQL 15, migraciones, seeds, estado de salud; rutas `/api/v1` y Swagger `/docs`; cookies/refresh/CORS en entorno real; `frontend/nginx.conf` para SPA y proxy; navegación directa a `/guias/:slug` sin 404; variables de entorno sin secretos por defecto de producción; CI `test/lint/build` de ambos proyectos y URL externa estable para QR.

**Aceptación:** entorno limpio se levanta y reproduce flujos de visitante, registrado y personal; rutas internas no fallan al refrescar; migraciones y seeds no borran ediciones; evidencia de CI y documentación de despliegue. **No duplicar contenedores en puertos ya utilizados.**

## 4. Contratos y dependencias con frontend

| BE entrega | FE usa | Evidencia mínima que debe enviar backend |
|---|---|---|
| BE-01: práctica pública no persistente | FE-01/02 | Request/response de validación por pregunta y prueba de cero filas de invitado |
| BE-02: ayuda / cookies / deduplicación / transiciones | FE-04/06 | Ejemplos de API en misma sesión, cancelar, tomar, resolver, permisos |
| BE-03: progreso autenticado | FE-07 | DTO registrar paso + DTO resumen/porcentaje + reglas |
| BE-04: reportes agregados | FE-08 | DTO top 10, categorías, ayudas, fechas por defecto |
| BE-05: auth y privacidad | FE-09/10 | Auth/OTP/refresh/cuenta, errores 401/403 y cuenta ficticia de test |
| BE-06: CMS + cola | FE-05/06 | Swagger, estados de guía, cambios de pasos, solicitudes |
| BE-07: semillas seguras | FE-05 | Prueba de regresión de edición tras resembrar |
| BE-08: decisión de catálogo | FE-12 | Acuerdo PO documentado y alcance visible |
| BE-09: deploy y URL | FE-11/14 | Entorno disponible y acceso desde otra máquina |

## 5. Orden de trabajo en paralelo

1. **Día de arranque técnico:** auditar BE-01, BE-02, BE-03 y BE-04 en paralelo; entregar contratos existentes de BE-05/06 sin implementar duplicados. Revisar BE-07 **antes de que el personal edite**.
2. **Primera integración:** cerrar BE-01 y BE-02 para permitir prácticas y ayuda; FE inicia inmediatamente con endpoints ya funcionales mientras se resuelven diferencias de invitados.
3. **Segunda integración:** finalizar BE-03 y BE-04 para que FE monte progreso y estadísticas; BE-05/06 corrige hallazgos E2E puntuales.
4. **Cierre de aceptación:** acuerdo PO para BE-08, CI y despliegue BE-09; pruebas cruzadas con FE-14.

## 6. Definición de terminado para cada tarea backend

- La historia se comprueba contra el **criterio exacto del backlog v2.1**, sin sustituirlo por la mera presencia de un endpoint.
- Arquitectura limpia: reglas en dominio/aplicación, sin imports de NestJS/Prisma allí; DTO y errores uniformes.
- Se probó autorización pública/JWT/roles; respuesta 401/403/409 según corresponda; entradas validadas (`whitelist`, `forbidNonWhitelisted` cuando aplique).
- Pruebas unitarias de cambios y e2e de flujos; regresiones de invitados/consentimiento/privacidad y concurrencia cuando apliquen.
- Swagger actualizado para cada contrato nuevo/modificado; migraciones y seeds reproducibles si se cambia BD.
- No ejecutar actualizaciones de datos reales, operaciones destructivas ni pruebas con cuentas sin autorización.
- Entregable de integración para frontend: ruta, método, esquema de request/response, ejemplos de error, permiso requerido y evidencia `PASS_INTEGRATED`.
- Un integrante del equipo hace **manualmente** rama/commit/push/PR; revisión por al menos un compañero y CI verde antes de merge.

**Fuera de alcance inmediato:** HU-07, 08, 11, 12, 14, 22, 24, 32–35, 40–44 y HU-16, salvo decisión formal. Las fechas/puntos de los tres sprints anteriores no se reescriben por esta planificación de cierre.
