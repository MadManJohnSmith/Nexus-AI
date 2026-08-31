# Plan Operativo de Trabajo para Equipo de 15 Desarrolladores Humanos
**Proyecto:** N.E.X.U.S. (Núcleo de Expediente y Seguimiento Universitario Superior)  
**Materia:** Trabajo Colaborativo e Ingeniería de Software Avanzada  
**Documento:** `human_team_plan_15devs.md`  
**Autor:** nexus-orchestrator (Tech Lead & Meta-Arquitecto)

---

## 1. Estructura Organizacional y Roles Funcionales (15 Devs)

El equipo de 15 ingenieros se divide en **3 Equipos Scrum** (5 desarrolladores por equipo), cada uno con asignación de roles técnicos especializados para garantizar el cumplimiento del estándar de calidad, la Definition of Done (DoD) y la trazabilidad académica individual:

```
N.E.X.U.S. TEAM (15 DESARROLLADORES)
├── EQUIPO 1: Núcleo, Tutorías y Producción Académica (Devs 1 a 5)
│   ├── Dev 1 & Dev 2: Backend Models, APIs, Migrations & Permisos DRF
│   ├── Dev 3 & Dev 4: Frontend Angular 20 (Signals, Modales, Tokens UI)
│   └── Dev 5: QA, Pruebas E2E, Seeders & Revisión Cruzada de PRs
├── EQUIPO 2: Permisos, Acuerdos, Tesis y Evidencias (Devs 6 a 10)
│   ├── Dev 6 & Dev 7: Backend Models, RBAC, Máquinas de Estado & Validaciones
│   ├── Dev 8 & Dev 9: Frontend Angular 20 (Drawers 400px, Acordeones, Semáforos)
│   └── Dev 10: QA, Pruebas de Carga/Seguridad, Seeders & Revisión de PRs
└── EQUIPO 3: Línea de Tiempo, Indicadores y Reportes Integrales (Devs 11 a 15)
    ├── Dev 11 & Dev 12: Backend APIs de Agregación, Full Dossier & Optimizaciones
    ├── Dev 13 & Dev 14: Frontend Angular 20 (Timeline Vertical, Dashboards, @media print)
    └── Dev 15: QA, Pruebas de Integración Visual, Seeders & Cierre de Release
```

---

## 2. Matriz de Roles y Responsabilidades Técnicas

| Rol Funcional | Perfil Técnico | Responsabilidades Principales en el Proyecto |
|---|---|---|
| **Dev 1, 6, 11** | Backend Lead / ORM Specialist | Modelado Django ORM, migraciones de esquema, definición de serializers y endpoints REST V2. |
| **Dev 2, 7, 12** | Backend Security & Services | Lógica de negocio (services.py), reglas RBAC, optimización de queries (`prefetch_related`), exportadores. |
| **Dev 3, 8, 13** | Frontend Component Architect | Arquitectura Angular Standalone, Signals (`signal`, `computed`), layouts, integración HTTP con Interceptores. |
| **Dev 4, 9, 14** | Frontend UI/UX Specialist | Maquetación HTML5/CSS3 con tokens institucionales, modales de 2 columnas, drawers laterales, `@media print`. |
| **Dev 5, 10, 15** | QA Lead & Code Reviewer | Pruebas unitarias (`manage.py test`), scripts E2E, mantenimiento de `seed_data.py`, auditoría de PRs. |

---

## 3. Plan de Asignación por Sprint y Evidencias Individuales Evaluables

### SPRINT 1: Cimientos de Identidad, RBAC, Alumnos y App Shell
* **Equipo 1 (HU-01, HU-03, HU-04, HU-06):**
  * *Dev 1:* Modelo `CustomUser` y `Student`, serializers y migraciones iniciales.
  * *Dev 2:* Configuración de SimpleJWT, endpoint de login y semestres 1 a 6 (`Semester`).
  * *Dev 3:* Interceptor JWT en Angular (`auth.interceptor.ts`) y `AuthService`.
  * *Dev 4:* `LoginComponent` y estructura inicial de `StudentOverviewComponent` (Grid 70/30).
  * *Dev 5:* Pruebas unitarias de autenticación JWT y creación de alumnos.
* **Equipo 2 (HU-02, HU-05):**
  * *Dev 6:* Modelo `AcademicCommittee` y asignación de roles de asesor.
  * *Dev 7:* Permisos RBAC (`IsCoordinator`, `IsAssignedAdvisorOrStudent`).
  * *Dev 8:* Componente de visualización del comité tutoral en Angular.
  * *Dev 9:* Sub-componente de información del programa y cohorte en la ficha.
  * *Dev 10:* Pruebas de aislamiento de roles y seguridad (CA-02.1 / CA-02.2).
* **Equipo 3 (HU-07):**
  * *Dev 11:* Estructura de navegación y metadatos de usuario en backend.
  * *Dev 12:* Endpoint de perfil activo `/api/v2/auth/me/`.
  * *Dev 13:* Layout `AppShellComponent` (Sidebar izquierdo + Top Navbar).
  * *Dev 14:* Componente dinámico de Breadcrumbs con contexto institucional.
  * *Dev 15:* Script de pruebas de navegación y verificación de responsividad.

---

### SPRINT 2: Sesiones de Tutoría y Máquina de Estados de Acuerdos
* **Equipo 1 (HU-08, HU-09, HU-10, HU-11):**
  * *Dev 1:* Modelos `TutoringSession`, `TutoringParticipant`, `TutoringObservation`.
  * *Dev 2:* ViewSets y Serializers de tutorías con validación de fechas.
  * *Dev 3:* `TutoringService` en Angular y control de estado de sesión.
  * *Dev 4:* Modal de tutoría en 2 columnas (`TutoringModalComponent`).
  * *Dev 5:* Pruebas unitarias de registro de sesiones y participantes.
* **Equipo 2 (HU-12, HU-13, HU-14):**
  * *Dev 6:* Modelo `Agreement` y `AgreementAuditLog`.
  * *Dev 7:* Máquina de estados (Pendiente, En Proceso, Concluido, Vencido) y método `cambiar_estado()`.
  * *Dev 8:* Drawer lateral derecho de 400px para gestión de acuerdos.
  * *Dev 9:* Componente `PillBadgeComponent` con tokens de color de semáforo.
  * *Dev 10:* Pruebas unitarias de transiciones válidas e inválidas de estados.
* **Equipo 3:**
  * *Dev 11 & 12:* Optimización de endpoints de listado de acuerdos filtrados.
  * *Dev 13 & 14:* Vista de lista de acuerdos (`AgreementsListComponent`) con filtros y buscador.
  * *Dev 15:* Script de automatización de pruebas de ciclo de vida de acuerdos.

---

### SPRINT 3: Tesis, Evidencias, Timeline Longitudinal y Alertas
* **Equipo 1:**
  * *Dev 1 & 2:* Endpoints de soporte para filtrado de tutorías por estudiante.
  * *Dev 3 & 4:* Integración de pestaña de tutorías con modal reactivo.
  * *Dev 5:* Pruebas de integración entre tutorías y acuerdos derivados.
* **Equipo 2 (HU-15, HU-21, HU-22):**
  * *Dev 6:* Modelo `ThesisProgress` con validación 0-100% y `componentes_json`.
  * *Dev 7:* Modelo `Evidence` con validación de carga multipart (15MB máx) y enlaces DOI.
  * *Dev 8:* Formulario interactivo de tesis con sliders/inputs por capítulo.
  * *Dev 9:* Modal de carga de evidencia con preview de tipo de archivo.
  * *Dev 10:* Pruebas de límite de tamaño de archivo (15MB) y formato JSON de tesis.
* **Equipo 3 (HU-23, HU-25):**
  * *Dev 11:* Endpoint unificado `GET /api/v2/monitoring/timeline/?student={id}` con ordenación cronológica.
  * *Dev 12:* Endpoint de conteo de alertas `GET /api/v2/monitoring/alerts/`.
  * *Dev 13:* Componente `TimelineComponent` con Flyout Drawer lateral interactivo de 380px.
  * *Dev 14:* Menú desplegable de alertas con badges en la campana del Top Navbar.
  * *Dev 15:* Pruebas E2E de interacción del Timeline y apertura de evidencias.

---

### SPRINT 4: Producción Científica, Histórico Semestral y Dashboard
* **Equipo 1 (HU-16, HU-17, HU-18, HU-19, HU-20):**
  * *Dev 1:* Modelos `Publication`, `AcademicEvent`, `ResearchStay`, `OtherProduct`.
  * *Dev 2:* Endpoint de histórico semestral `/api/v2/thesis/history/`.
  * *Dev 3:* `AcademicOutputPanelComponent` con sub-tabs y modales de alta.
  * *Dev 4:* Componente `ThesisHistoryComparisonComponent` con barras comparativas semestres 1 a 6.
  * *Dev 5:* Pruebas unitarias de modelos de producción académica y URLs DOI.
* **Equipo 2:**
  * *Dev 6 & 7:* Integración de producción académica con evidencias vinculadas.
  * *Dev 8 & 9:* Ajustes en drawer de acuerdos para enlazar productos de investigación.
  * *Dev 10:* Pruebas de integridad referencial entre productos y evidencias.
* **Equipo 3 (HU-24):**
  * *Dev 11:* Endpoint `GET /api/v2/monitoring/coordinator-dashboard/` con cálculo de KPIs.
  * *Dev 12:* Algoritmo de clasificación de riesgo (Alto, Medio, Bajo).
  * *Dev 13:* `CoordinatorDashboardComponent` con tarjetas de métricas institucionales.
  * *Dev 14:* Tabla de casos prioritarios con filtros de búsqueda interactivos.
  * *Dev 15:* Pruebas de rendimiento del dashboard con datasets masivos.

---

### SPRINT 5: Supervisión Activa, Cédula Full Dossier y Exportación
* **Equipo 1 (HU-28):**
  * *Dev 1:* Módulo de exportación Excel multi-hoja con `openpyxl`.
  * *Dev 2:* Módulo de exportación PDF oficial con `reportlab`.
  * *Dev 3:* Integración de botones de descarga directa en UI de reportes.
  * *Dev 4:* Manejo de blobs binarios y notificaciones de descarga en Angular.
  * *Dev 5:* Pruebas unitarias de generación de archivos (.xlsx y .pdf).
* **Equipo 2 (HU-26):**
  * *Dev 6:* `SupervisionRulesEngine` (detección >45 días sin tutoría, acuerdos sin evidencia).
  * *Dev 7:* Endpoint `GET /api/v2/monitoring/supervision-alerts/`.
  * *Dev 8:* Componente visual de alertas de supervisión para el coordinador.
  * *Dev 9:* Modal de detalle de regla infringida.
  * *Dev 10:* Pruebas unitarias de las 3 reglas de supervisión activa.
* **Equipo 3 (HU-27):**
  * *Dev 11:* Servicio `DossierService.get_full_dossier()` con `prefetch_related`.
  * *Dev 12:* Endpoint `GET /api/v2/reporting/students/{id}/full-dossier/`.
  * *Dev 13:* Componente `StudentDossierReportComponent` con formato de cédula institucional.
  * *Dev 14:* Reglas CSS `@media print` para impresión limpia sin navbar ni sidebar.
  * *Dev 15:* Pruebas E2E de consolidación de expediente completo.

---

### SPRINT 6: Release Candidate v1.0.0-rc, Auditoría de Seguridad y Post-Mortem
* **Todos los Equipos:**
  * *Devs 1, 6, 11:* Auditoría final de índices en base de datos y migraciones sin conflictos.
  * *Devs 2, 7, 12:* Verificación exhaustiva de permisos RBAC y aislamiento de roles.
  * *Devs 3, 8, 13:* Validación de compilación en producción (`ng build --configuration=production`).
  * *Devs 4, 9, 14:* Pulido visual de diseño institucional, contraste de colores y accesibilidad.
  * *Devs 5, 10, 15:* Ejecución de `seed_data.py`, suite de 29 pruebas unitarias y generación de documentación técnica post-mortem.

---

## 4. Rúbrica de Evaluación Individual para la Materia

Cada desarrollador será evaluado sobre **100 puntos** con base en las siguientes evidencias verificables en el repositorio Git:

1. **Commits y Pull Requests Individuales (30 pts):**
   - Commits atómicos con formato convencional (`feat(HU-XX): ...`, `test(HU-XX): ...`).
   - Mínimo de 3 PRs revisados y aprobados mediante protocolo de revisión cruzada.
2. **Implementación de Código sin Mocks (30 pts):**
   - Código limpio, tipado estricto (Python type hints y TypeScript interfaces), libre de `any` injustificados.
3. **Pruebas Automatizadas y Calidad (25 pts):**
   - Autoría de al menos 2 pruebas unitarias o de integración aprobadas en el pipeline.
4. **Documentación Técnica y Criterios de Aceptación (15 pts):**
   - Redacción del archivo `docs/sprints/sprint_N/equipo_M/HU-ID.md` correspondiente a su asignación.
