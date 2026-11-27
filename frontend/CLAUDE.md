# Kamá — instrucciones persistentes de Claude Code para FRONTEND

> **Plan maestro obligatorio:** `../docs/Kama_Plan_Maestro_Frontend_SDD.md` (ruta desde `frontend/`).
> **Estado de estas instrucciones:** propuesta lista para aprobación e incorporación por el equipo.
> **Propósito:** evolucionar el frontend existente mediante ODD, priorizando accesibilidad, sin reescribir el contenido educativo y sin que Claude realice operaciones Git de escritura.

## 1. Antes de cualquier tarea

1. Lee **completo** `../docs/Kama_Plan_Maestro_Frontend_SDD.md`. Si ejecutas Claude desde la raíz del repositorio, utiliza `docs/Kama_Plan_Maestro_Frontend_SDD.md`. Verifica cuál es la raíz real y que la ruta existe.
2. Inspecciona la estructura, el estado de la rama y los cambios no confirmados mediante **Git solo lectura**. **No cambies de rama ni sincronices remotamente**.
3. La primera unidad de trabajo es **F00: diagnóstico de solo lectura**. No modifiques archivos en F00 ni ejecutes procesos que escriban código o recursos sin autorización.
4. Antes de cada unidad posterior revisa el código, los tests y contratos realmente relevantes. Si una HU necesita los criterios exactos del backlog v2.1 o una regla del modelo v2.0 que no están disponibles, solicítalos **solo para esa tarea**. Esos documentos pueden permanecer fuera del repositorio.
5. Distingue observaciones reales, hipótesis, mocks y dependencias pendientes. No declares verificado algo que no has probado.

## 2. Alcance autorizado

- Trabaja **exclusivamente en frontend**: código, pruebas y estilos de `frontend/**`, dentro del alcance de la unidad expresamente aprobada.
- `backend/**`, incluido `backend/CLAUDE.md`, Prisma, migraciones, semillas y tests, es **estrictamente de solo lectura**. Se permite examinar controladores, DTO y Swagger para contrastar contratos; está prohibido modificar, ejecutar migraciones o alterar datos.
- No modificar `docker-compose.yml`, `.github/**`, archivos de raíz, CI, infraestructura o despliegue por iniciativa propia.
- `frontend/Dockerfile` y `frontend/nginx.conf` requieren permiso específico del responsable de infraestructura.
- `frontend/package.json` y `frontend/pnpm-lock.yaml` solo se modifican después de proponer y obtener autorización explícita para dependencias o scripts.
- No modificar el plan maestro, este `CLAUDE.md`, ni inventar otros documentos operativos sin aprobación del equipo.

## 3. Conservar lo que ya existe

- No reinicializar React/Vite, no crear otro frontend y no reestructurar el proyecto en masa.
- Respetar las capas existentes: `src/domain`, `src/application`, `src/infrastructure`, `src/main` y `src/presentation`.
- Reutilizar componentes, páginas, casos de uso, puertos, repositorios HTTP/en memoria, tokens CSS y pruebas existentes. No duplicarlos sin justificarlo.
- **El contenido educativo ya implementado se conserva.** No editar, borrar, reemplazar, reordenar ni resumir guías, pasos, imágenes informativas, explicaciones, preguntas, opciones, claves de respuesta o retroalimentación sin autorización explícita del equipo/PO.
- El backlog validado contempla una categoría Phishing y cuatro guías mínimas, pero existen documentos históricos con otras propuestas. **No forzar conteos ni modificar contenido por esa discrepancia**: registrar el caso y solicitar decisión al PO cuando afecte una implementación.
- Revisar y mejorar **cómo se presenta** el contenido (semántica, teclado, foco, contraste, interacción y lectura) sin alterar su significado.
- No implementar por iniciativa propia historias Should/Could/Won't, nuevas categorías ni una gestión dinámica de categorías (HU-16 fuera del MVP).

## 4. Accesibilidad: primera prioridad

Referencias: **HU-36, HU-37, HU-38, HU-39** y WCAG 2.2 AA, más requisitos de interfaz de las demás HU.

- Texto base de al menos **18 px**, controles A-/A+ y alto contraste accesibles y funcionales; medir contraste normal **≥4.5:1** para texto y alto contraste **≥7:1** según el backlog, cuando aplique.
- Controles interactivos de **al menos 44 × 44 px** según HU-39, o excepciones formalmente aprobadas; enfoque visible, orden de tabulación lógico y teclado completo.
- HTML semántico y formularios accesibles (`label`, errores asociados, estado de envío y recuperación). Preferir elementos HTML nativos a `div` clicables; ARIA cuando aporte.
- Imágenes informativas con texto alternativo; decorativas adecuadamente ocultas; feedback anunciado de forma pertinente, nunca solo color.
- Diseños desde **360 px** y zoom **200 %** sin pérdida de información o scroll horizontal problemático; respetar movimiento reducido y tamaño de texto aumentado.
- Evaluar por pantalla y estado: `loading`, `empty`, `success`, `error`, `unauthorized/forbidden`, formularios y diálogos.
- Verificar con teclado y, cuando sea posible, lector de pantalla; Lighthouse/axe complementan, **no reemplazan** pruebas manuales. Si una herramienta no está instalada, no instalar sin aprobación ni afirmar que se ejecutó.
- Figma es referencia visual **solo si el equipo lo aprobó**. No sustituir los tokens actuales por una paleta nueva por iniciativa propia.

## 5. Backend e integración

- Verificar métodos, rutas exactas, parámetros, formas de respuesta, permisos y errores en código o Swagger real, antes de modificar un adaptador HTTP.
- Reutilizar `Http*Repository` y puertos actuales. No insertar llamadas `fetch` improvisadas en páginas ni inventar endpoints.
- Distinguir `PASS_FE` (solo interfaz), `PASS_INTEGRATED` (contra backend verificado), `MOCKED`, `BLOCKED_API`, `FAIL`, `NOT_TESTED`.
- No sustituir datos reales por mocks sin autorización; si son necesarios, aislarlos y etiquetarlos claramente. No presentarlos como integración.
- Usuarios invitados: conservar estado de **progreso educativo y respuestas únicamente en memoria**; no guardarlo en `localStorage`, `sessionStorage`, IndexedDB ni persistir intentos de invitados en backend. Las preferencias de accesibilidad se tratan por separado.
- Usuarios registrados: persistencia de progreso únicamente mediante API real verificada; no simular que ya persiste.
- No filtrar respuestas correctas antes de contestar. No registrar o exponer secretos, JWT, refresh tokens, códigos OTP ni datos reales de personas en capturas, pruebas o logs.
- Si detectas problema BE, descríbelo y deja una dependencia para el equipo correspondiente. **No lo corrijas desde esta ruta.**

## 6. ODD: un incremento autorizado cada vez

1. **DIAGNÓSTICO:** revisar lo existente e identificar un hallazgo verificable; en F00 no editar nada.
2. **PROPUESTA:** antes de editar presentar identificador de unidad, HU/AC pertinentes, problema, alcance, archivos previstos, exclusiones, riesgo y pruebas a ejecutar.
3. **APROBACIÓN:** esperar mensaje humano explícito. El silencio, la intención general de «hacer el frontend» o un plan previamente escrito **no autorizan implementar todas las etapas**.
4. **IMPLEMENTACIÓN:** cambiar **solo** lo aprobado y preservar código/contenido existente. Si surge una modificación fuera de alcance, detener esa parte y pedir autorización.
5. **VERIFICACIÓN:** ejecutar únicamente scripts disponibles, seguros y autorizados; indicar comandos y resultados reales. No ejecutar instalación, `--fix`, actualizaciones de snapshots, refactors masivos ni scripts destructivos sin permiso.
6. **ENTREGA Y PAUSA:** mostrar archivos modificados, diff relevante, estado por criterios, evidencias de accesibilidad, pruebas, limitaciones y propuesta de mensaje Conventional Commits. **Detenerse hasta revisión y commit humano antes de continuar.**

La secuencia F00–F10 del plan es orientativa; se priorizan defectos de accesibilidad reales. No reconstruir una pantalla o módulo ya completo solo porque aparece en la ruta.

## 7. Git: operaciones de escritura EXCLUSIVAMENTE humanas

**Claude puede consultar:** `git status`, `git diff`, `git log`, `git show`, `git ls-files`, `git branch --show-current` sin opciones de escritura.

**Claude no puede ejecutar ni delegar:** `git add`, `git commit`, `git push`, `git pull`, `git fetch`, `git switch`, `git checkout`, `git merge`, `git rebase`, `git reset`, `git restore`, `git clean`, `git stash`, `git cherry-pick`, creación/borrado de ramas o tags, modificaciones a `.git/` o equivalentes en herramientas/APIs.

- Solo integrantes humanos crean/cambian ramas, seleccionan cambios para staging, redactan el commit, hacen push, PR y merge.
- No abrir ni gestionar PR por cuenta propia.
- Si hay cambios previos de otros compañeros, no borrarlos ni restaurarlos; señalarlos al responsable.
- Puedes **sugerir** un mensaje de commit, nunca ejecutarlo ni dar por confirmado que existe.
- Si alguna automatización ODD/skills/hook exige commits o escritura fuera de alcance, **no la ejecutes** y solicita adaptación.
- Este archivo es una restricción textual; el equipo debe reforzarla con permisos de herramientas y revisión humana.

## 8. Informe de cierre obligatorio

Para cada unidad entregada, responder en español:

1. ID de unidad, objetivo y autorización recibida.
2. Qué existía y qué cambió; archivos tocados y razón.
3. HU y criterios evaluados con estado `PASS_FE / PASS_INTEGRATED / MOCKED / FAIL / BLOCKED_API / BLOCKED_DECISION / NOT_TESTED`, y evidencia.
4. Pruebas ejecutadas: comando exacto, resultado, limitaciones; pruebas no ejecutadas y motivo.
5. Accesibilidad: evidencia de teclado, foco, contraste, 360 px, zoom, lector cuando aplique.
6. Confirmación verificable de que `backend/**` y el contenido educativo no fueron modificados, o explicación de cualquier incidencia.
7. Riesgos, dependencias y decisiones pendientes.
8. Propuesta de mensaje Conventional Commits **para que el estudiante lo haga manualmente**.
9. Estado final: **ESPERANDO REVISIÓN HUMANA Y COMMIT**.

No iniciar la siguiente etapa sin una nueva autorización explícita.
