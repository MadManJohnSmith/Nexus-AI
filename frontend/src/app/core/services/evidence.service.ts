import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Evidence, EvidenceActivityType, EvidenceType } from '../models/evidence.models';
import { PaginatedResponse } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class EvidenceService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2/evidences';

  public getEvidences(studentId?: number, semesterId?: number, actividadTipo?: EvidenceActivityType): Observable<PaginatedResponse<Evidence>> {
    let params = new HttpParams();
    if (studentId) params = params.set('student', studentId.toString());
    if (semesterId) params = params.set('semester', semesterId.toString());
    if (actividadTipo) params = params.set('actividad_tipo', actividadTipo);

    return this.http.get<any>(`${this.API_URL}/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapEvidenceFromApi)
      }))
    );
  }

  public uploadFileEvidence(payload: {
    student: number;
    semester: number;
    actividad_tipo?: string;
    actividad_id?: number;
    file: File;
    descripcion: string;
  }): Observable<{ evidenceCreatedId: number; mensaje: string; evidence: Evidence }> {
    const formData = new FormData();
    formData.append('student', payload.student.toString());
    formData.append('semester', payload.semester.toString());
    formData.append('tipo', 'ARCHIVO_LOCAL');
    formData.append('descripcion', payload.descripcion);
    formData.append('archivo_adjunto', payload.file, payload.file.name);
    if (payload.actividad_tipo) formData.append('actividad_tipo', payload.actividad_tipo);
    if (payload.actividad_id) formData.append('actividad_id', payload.actividad_id.toString());

    return this.http.post<any>(`${this.API_URL}/`, formData).pipe(
      map(res => ({
        evidenceCreatedId: res.evidence_created_id,
        mensaje: res.mensaje,
        evidence: this.mapEvidenceFromApi(res.evidence)
      }))
    );
  }

  public registerDoiEvidence(payload: {
    student: number;
    semester: number;
    actividad_tipo?: string;
    actividad_id?: number;
    url_doi: string;
    descripcion: string;
  }): Observable<{ evidenceCreatedId: number; mensaje: string; evidence: Evidence }> {
    const data = {
      student: payload.student,
      semester: payload.semester,
      tipo: 'ENLACE_DOI',
      url_doi: payload.url_doi,
      descripcion: payload.descripcion,
      actividad_tipo: payload.actividad_tipo || 'OTRO',
      actividad_id: payload.actividad_id || null
    };

    return this.http.post<any>(`${this.API_URL}/`, data).pipe(
      map(res => ({
        evidenceCreatedId: res.evidence_created_id,
        mensaje: res.mensaje,
        evidence: this.mapEvidenceFromApi(res.evidence)
      }))
    );
  }

  private mapEvidenceFromApi(raw: any): Evidence {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      actividadTipo: raw.actividad_tipo,
      actividadTipoDisplay: raw.actividad_tipo_display,
      actividadId: raw.actividad_id,
      tipo: raw.tipo,
      archivoAdjunto: raw.archivo_adjunto,
      archivoUrl: raw.archivo_url,
      urlDoi: raw.url_doi,
      mimeType: raw.mime_type,
      fileSizeBytes: raw.file_size_bytes,
      descripcion: raw.descripcion,
      fechaCarga: raw.fecha_carga,
      cargadoPor: raw.cargado_por,
      cargadoPorNombre: raw.cargado_por_nombre
    };
  }
}
