# Matriz de Discrepancias de Esquema y Tablas Descubiertas (Post-Mortem)
**Proyecto:** N.E.X.U.S. (Núcleo de Expediente y Seguimiento Universitario Superior)  
**Documento:** `discovered_schema_diffs.md`  
**Autor:** nexus-orchestrator (Tech Lead & Meta-Arquitecto)

---

## 1. Introducción
Durante la ejecución técnica de los 6 Sprints, el equipo identificó que los requerimientos iniciales del backlog presentaban omisiones estructurales que, de no haberse resuelto en la capa de datos, habrían provocado bloqueos de integridad referencial, fallas en la auditoría de estados, lentitud extrema (problemas de consultas N+1 en el Timeline) o riesgos de seguridad.

A continuación se detalla la matriz de tablas intermedias, campos calculados e índices agregados formalmente al esquema final.

---

## 2. Matriz de Entidades y Columnas Descubiertas

| Entidad / Tabla | Elemento Añadido | Tipo de Dato / Constraint | Justificación Técnica y Criterio Resuelto |
|-----------------|------------------|---------------------------|-------------------------------------------|
| `apps.agreements.AgreementAuditLog` | **Tabla Completa** | `Model` con FK hacia `Agreement` y `CustomUser`, `estado_anterior`, `estado_nuevo`, `comentario`, `fecha_cambio` | **Obligatorio para HU-14 (Bitácora de Acuerdos):** Requerido para almacenar la trazabilidad inmutable de transiciones de estado, autor del cambio y motivos sin sobreescribir el registro del acuerdo. |
| `apps.evidence.Evidence` | `mime_type` | `CharField(100)` | **Obligatorio para CA-21.1:** Permite verificar y servir el tipo de contenido HTTP exacto (`application/pdf`, `image/png`, `application/zip`) en descargas. |
| `apps.evidence.Evidence` | `file_size_bytes` | `BigIntegerField` | **Obligatorio para CA-21.2:** Almacena el tamaño real del archivo para validar el límite estricto de 15 MB sin necesidad de leer el disco en cada consulta. |
| `apps.evidence.Evidence` | `actividad_tipo` & `actividad_id` | `CharField(20)` + `BigIntegerField(db_index=True)` | **Obligatorio para HU-21 / HU-26:** Permite la vinculación polimórfica ligera con sesiones de tutoría, acuerdos, avances de tesis o productos sin requerir FKs nulas múltiples. |
| `apps.thesis.ThesisProgress` | `componentes_json` | `JSONField(default=dict)` | **Obligatorio para HU-15 (Desglose de Tesis):** Almacena la matriz estructurada (`protocolo`, `estadoArte`, `marcoTeorico`, `metodologia`, `analisis`, `redaccion`) requerida para el acordeón del formulario. |
| `apps.academic_output.Publication` | `doi_url` | `URLField(blank=True)` | **Obligatorio para HU-17 / HU-22:** Permite indexar enlaces persistentes DOI de artículos directamente en el Timeline. |
| `apps.academic_output.Publication` | `evidencia_id` | `ForeignKey(Evidence, null=True, SET_NULL)` | **Obligatorio para CA-17.2:** Permite vincular el comprobante o preprint adjunto en el repositorio de evidencias. |
| `apps.students.Semester` | `is_active` | `BooleanField(default=False)` | **Obligatorio para HU-04:** Permite determinar de manera reactiva el semestre en curso del doctorando sin recalcular fechas en cada endpoint. |
| `apps.identity.CustomUser` | `role` | `CharField(choices=['COORDINADOR', 'ASESOR', 'ESTUDIANTE'])` | **Obligatorio para RBAC (CA-02.1 / CA-02.2):** Garantiza que los permisos de lectura/escritura sean validados en la capa de seguridad de Django REST Framework. |

---

## 3. Índices Compuestos y de Desempeño Creados para el Timeline

Para cumplir con la directiva arquitectónica de **cero consultas N+1 y tiempos de respuesta < 500 ms** en el Timeline Longitudinal (HU-23) y el Dashboard del Coordinador (HU-24), se agregaron índices a nivel de base de datos en los siguientes campos de ordenación:

1. `TutoringSession.fecha_sesion` (`db_index=True`).
2. `Agreement.fecha_limite` y `Agreement.estado` (`db_index=True`).
3. `ThesisProgress.fecha_registro` (`db_index=True`).
4. `Evidence.fecha_carga` (`db_index=True`).
5. `AcademicEvent.fecha_presentacion` (`db_index=True`).
6. `ResearchStay.fecha_inicio` (`db_index=True`).
7. `OtherProduct.fecha_registro` (`db_index=True`).

---

## 4. Conclusión Técnica
La incorporación proactiva de estas tablas y campos garantizó que la plataforma alcanzara un 100% de cumplimiento en su Definition of Done (DoD), manteniendo la integridad referencial y facilitando la exportación fluida en PDF y Excel sin parches posteriores.
