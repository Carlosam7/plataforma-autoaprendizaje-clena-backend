# Revisión y validación del plan ODD — Kamá

**Fecha de revisión propuesta:** completar por el equipo.  
**Estado:** propuesta de ejecución técnica pendiente de validación del equipo; el backlog v2.1 y modelo de datos v2.0 son las fuentes de requisitos, no un proyecto ya implementado.

## 1. Decisión que solicitamos al equipo

Aprobar, aprobar con observaciones o devolver para cambios **el modo de trabajo de Claude Code bajo ODD**: explorar el repositorio antes de modificar, planificar tareas pequeñas, implementar de manera verificable, ejecutar pruebas, evidenciar resultados y abrir PR para revisión humana. El agente no aprueba cambios de alcance, no sustituye a los responsables y no hace merge o despliegues sensibles por su cuenta.

**Lo que NO estamos votando de nuevo:** categoría Phishing; 4 guías (Smishing, Vishing, Quishing, Falso soporte); HU-25–27 integradas; HU-16 fuera del MVP; progreso de invitados en memoria hasta recargar; evaluación de 1–10 preguntas por actividad y aprobación ≥70 %; sprints, fechas, puntos e historias históricamente asignadas sin cambios (S1 03–05/11, 29 puntos; S2 06–09/11, 36 puntos; S3 10–12/11, 40 puntos).

## 2. Qué propone el plan ODD

1. **Reconocimiento:** Claude Code lee código y documentación existentes, realiza un inventario, identifica dependencias y reporta incertidumbres. Al comienzo no edita nada.
2. **Autorización:** los responsables aprueban una unidad de trabajo y sus criterios antes de programar.
3. **Implementación incremental:** unidad pequeña y demostrable; tests y commits trazables a HU/issue; sin generar toda la aplicación en un único prompt.
4. **Verificación:** pruebas unitarias, integración/e2e, seguridad, accesibilidad, documentación de API y evidencia de resultado contra criterios del backlog.
5. **Revisión humana:** PR con revisión de un compañero, sin merge/despliegue irreversible automático.

**Orden técnico propuesto** (NO redefine los sprints): A Reconocimiento → B infraestructura reproducible → C catálogo/lector público → D identidad y roles → E actividades y progreso → F contenidos transversales → G ayuda y analítica → H accesibilidad integral y QR → I validación humana. La accesibilidad se aplica desde cada interfaz, no se deja para el final.

**Primera unidad sugerida si el repositorio está vacío:** base reproducible (NestJS, Prisma, PostgreSQL, `/health`, tests y CI); después, catálogo Phishing y lector de una guía. Si hay código, se reutiliza antes de crear estructuras nuevas.

## 3. Preguntas de validación (marcar y comentar)

- [ ] **Alcance:** ¿el orden de ejecución respeta las 28 historias Must, el backlog y los sprints aprobados?
- [ ] **ODD:** ¿aceptamos empezar por reconocimiento de solo lectura y exigir autorización antes de implementar?
- [ ] **Arquitectura:** ¿la propuesta es compatible con NestJS + Clean Architecture + PostgreSQL/Prisma y las 23 tablas de referencia?
- [ ] **Frontend:** ¿se usará un stack ya presente en el repositorio, o hay que aprobar React + TypeScript + Vite u otra opción?
- [ ] **Integración:** ¿estamos de acuerdo con ramas, PR, reviewer humano, CI y trazabilidad HU → issue → PR?
- [ ] **Calidad:** ¿se verificarán 70 % de cobertura en dominio/casos de uso, e2e, Swagger y controles de accesibilidad conforme al backlog?
- [ ] **Seguridad y datos:** ¿quedarán bloqueados los cambios destructivos, la publicación de secretos y los despliegues reales sin autorización?
- [ ] **Colaboración:** ¿están claros los responsables de aprobación y de revisión? ¿Cada integrante podrá explicar el código entregado?
- [ ] **Primera unidad:** ¿qué debe implementar Claude Code primero, después del diagnóstico del repositorio?

## 4. Decisiones todavía abiertas (no atribuir aprobación implícita)

| ID | Decisión pendiente | Responsable propuesto para discutir |
|---|---|---|
| P-01 | Justificar la fecha de nacimiento en HU-01 o cambiar formalmente el requisito | PO + backend |
| P-02 | Qué ocurre con progreso cuando cambian pasos de una guía ya publicada | PO + backend |
| P-03 | Stack frontend definitivo, después de revisar repositorio | Frontend + equipo |
| P-04 | Proveedor de correo/SMS para OTP y presupuesto | Infra/autenticación + PO |
| P-05 | Hosting, dominio, backups y despliegue | Infra + equipo |
| P-06 | Paleta, componentes accesibles y contenido visual revisado | Frontend + accesibilidad + PO |
| P-07 | Proveedor de almacenamiento de imágenes (HU-14 Should) | Backend + PO |
| P-08 | Estado real del repositorio, PRs y módulos existentes | Todos; se resuelve en reconocimiento |

## 5. Revisión por integrante (reparto propuesto en el plan)

| Integrante | En qué concentrar sus comentarios |
|---|---|
| **Wilmer (PO / infraestructura-autenticación)** | Prioridades, bloqueos P-01/P-04/P-05, autorizaciones, límites de Claude Code |
| **Esteban (backend)** | Módulos, Prisma, migraciones, API, contratos, P-02/P-07, tests |
| **Andrés (frontend)** | Stack P-03, catálogo/lector, actividades, manejo de invitados, consumo de API |
| **Carlos (Scrum Master / accesibilidad y QA)** | DoD, PR, evidencias, accesibilidad, prueba cualitativa, coherencia del flujo con Scrum |

## 6. Acta rápida de aprobación

**Resultado:** [ ] Aprobado  [ ] Aprobado con observaciones  [ ] Requiere cambios

**Observaciones concretas (archivo/sección, propuesta, justificación):**

1. 
2. 
3. 

**Bloqueos para empezar:**

**Primera unidad autorizada después del diagnóstico:**

**Revisaron (nombre y fecha):**

- Wilmer: 
- Esteban: 
- Andrés: 
- Carlos: 

## 7. Archivos para leer, en orden

1. **`LEER_PRIMERO_Validacion_ODD_Kama.md`** — este resumen y acta (5–10 minutos).
2. **`docs/plan_odd_kama.md`** — propuesta completa (apartados 1–7).
3. **`docs/decisiones_y_bloqueos.md`** — decisiones aprobadas y bloqueos pendientes.
4. **`docs/trazabilidad_must.csv`** — 28 Must, puntos y sprints de referencia.
5. **`docs/criterios_de_verificacion.md`** — evidencias de calidad.
6. **`docs/Backlog_Kama_v2.1_validado.md`** y **`docs/Modelo_de_Datos_Kama_v2.0.docx`** — documentos fuente para comprobar discrepancias.

**Nota:** el plan no acredita que ODD/Gentle AI esté instalado ni que Claude Code haya revisado el repositorio. Eso debe comprobarse durante la fase de preparación. El listado de pendientes no autoriza al agente a resolverlos unilateralmente.
