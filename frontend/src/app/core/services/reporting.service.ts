import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FullDossierResponse } from '../models/reporting.models';

@Injectable({
  providedIn: 'root'
})
export class ReportingService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v2/reporting/students/';

  public getFullDossier(studentId: number): Observable<FullDossierResponse> {
    return this.http.get<any>(`${this.baseUrl}${studentId}/full-dossier/`).pipe(
      map(res => ({
        demographics: {
          id: res.demographics.id,
          matricula: res.demographics.matricula,
          nombreCompleto: res.demographics.nombre_completo,
          email: res.demographics.email,
          programaDoctoral: res.demographics.programa_doctoral,
          fechaIngreso: res.demographics.fecha_ingreso,
          cohorte: res.demographics.cohorte,
          semestreActual: res.demographics.semestre_actual,
          asesorPrincipal: res.demographics.asesor_principal,
          coasesor: res.demographics.coasesor,
          estatusActivo: res.demographics.estatus_activo
        },
        academicCommittee: (res.academic_committee || []).map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          nombre: c.nombre,
          email: c.email,
          rolComite: c.rol_comite,
          rolComiteDisplay: c.rol_comite_display,
          fechaAsignacion: c.fecha_asignacion,
          isActive: c.is_active
        })),
        semesters: (res.semesters || []).map((s: any) => ({
          id: s.id,
          numero: s.numero,
          fechaInicio: s.fecha_inicio,
          fechaFin: s.fecha_fin,
          isActive: s.is_active
        })),
        tutorings: (res.tutorings || []).map((t: any) => ({
          id: t.id,
          semesterNumero: t.semester_numero,
          fechaSesion: t.fecha_sesion,
          modalidad: t.modalidad,
          resumenGeneral: t.resumen_general,
          proximaReunionFecha: t.proxima_reunion_fecha,
          proximaReunionNotas: t.proxima_reunion_notas,
          createdBy: t.created_by,
          participantes: t.participantes || [],
          observaciones: (t.observaciones || []).map((o: any) => ({
            tema: o.tema,
            detalle: o.detalle,
            autor: o.autor
          }))
        })),
        agreements: (res.agreements || []).map((a: any) => ({
          id: a.id,
          semesterNumero: a.semester_numero,
          descripcion: a.descripcion,
          responsableNombre: a.responsable_nombre,
          fechaLimite: a.fecha_limite,
          estado: a.estado,
          isOverdue: a.is_overdue
        })),
        thesisHistory: (res.thesis_history || []).map((th: any) => ({
          id: th.id,
          semesterNumero: th.semester_numero,
          porcentajeAvance: th.porcentaje_avance,
          fechaRegistro: th.fecha_registro,
          componentesJson: th.componentes_json,
          observaciones: th.observaciones,
          registradoPor: th.registrado_por
        })),
        publications: (res.publications || []).map((p: any) => ({
          id: p.id,
          semesterNumero: p.semester_numero,
          titulo: p.titulo,
          autores: p.autores,
          tipo: p.tipo,
          revistaEditorial: p.revista_editorial,
          estado: p.estado,
          fechaPublicacion: p.fecha_publicacion,
          doiUrl: p.doi_url
        })),
        academicEvents: (res.academic_events || []).map((e: any) => ({
          id: e.id,
          semesterNumero: e.semester_numero,
          tipoEvento: e.tipo_evento,
          nombreEvento: e.nombre_evento,
          tituloPonencia: e.titulo_ponencia,
          fechaPresentacion: e.fecha_presentacion,
          sedeLugar: e.sede_lugar,
          modalidad: e.modalidad
        })),
        researchStays: (res.research_stays || []).map((st: any) => ({
          id: st.id,
          semesterNumero: st.semester_numero,
          institucionReceptora: st.institucion_receptora,
          pais: st.pais,
          fechaInicio: st.fecha_inicio,
          fechaFin: st.fecha_fin,
          responsableEstancia: st.responsable_estancia,
          objetivos: st.objetivos
        })),
        evidences: (res.evidences || []).map((ev: any) => ({
          id: ev.id,
          semesterNumero: ev.semester_numero,
          tipo: ev.tipo,
          descripcion: ev.descripcion,
          fechaCarga: ev.fecha_carga,
          cargadoPor: ev.cargado_por,
          archivoUrl: ev.archivo_url,
          urlDoi: ev.url_doi,
          actividadTipo: ev.actividad_tipo
        })),
        generatedAt: res.generated_at
      }))
    );
  }

  public getExportUrl(studentId: number, format: 'pdf' | 'xlsx'): string {
    return `${this.baseUrl}${studentId}/export/?format=${format}`;
  }
}
