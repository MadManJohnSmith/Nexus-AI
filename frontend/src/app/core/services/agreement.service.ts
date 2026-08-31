import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Agreement, AgreementFilterParams, AgreementState } from '../models/agreement.models';
import { PaginatedResponse } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class AgreementService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2/agreements';

  public getAgreements(filters: AgreementFilterParams = {}): Observable<PaginatedResponse<Agreement>> {
    let params = new HttpParams();
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.pageSize) params = params.set('page_size', filters.pageSize.toString());
    if (filters.student) params = params.set('student', filters.student.toString());
    if (filters.semester) params = params.set('semester', filters.semester.toString());
    if (filters.responsable) params = params.set('responsable', filters.responsable.toString());
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.search) params = params.set('search', filters.search);

    return this.http.get<any>(`${this.API_URL}/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapAgreementFromApi)
      }))
    );
  }

  public getAgreementById(id: number): Observable<Agreement> {
    return this.http.get<any>(`${this.API_URL}/${id}/`).pipe(
      map(this.mapAgreementFromApi)
    );
  }

  public createAgreement(payload: {
    student: number;
    semester?: number;
    session?: number;
    descripcion: string;
    responsable: number;
    fecha_limite: string;
    estado?: AgreementState;
  }): Observable<{ agreementCreatedId: number; mensaje: string; agreement: Agreement }> {
    return this.http.post<any>(`${this.API_URL}/`, payload).pipe(
      map(res => ({
        agreementCreatedId: res.agreement_created_id,
        mensaje: res.mensaje,
        agreement: this.mapAgreementFromApi(res.agreement)
      }))
    );
  }

  public updateStatus(id: number, nuevoEstado: AgreementState, comentario?: string): Observable<{ mensaje: string; agreement: Agreement }> {
    return this.http.patch<any>(`${this.API_URL}/${id}/status/`, {
      estado: nuevoEstado,
      comentario: comentario || ''
    }).pipe(
      map(res => ({
        mensaje: res.mensaje,
        agreement: this.mapAgreementFromApi(res.agreement)
      }))
    );
  }

  private mapAgreementFromApi(raw: any): Agreement {
    return {
      id: raw.id,
      session: raw.session,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      descripcion: raw.descripcion,
      responsable: raw.responsable,
      responsableNombre: raw.responsable_nombre,
      responsableEmail: raw.responsable_email,
      fechaLimite: raw.fecha_limite,
      estado: raw.estado,
      estadoDisplay: raw.estado_display,
      fechaCambioEstado: raw.fecha_cambio_estado,
      modificadoPor: raw.modificado_por,
      modificadoPorNombre: raw.modificado_por_nombre,
      isOverdue: raw.is_overdue ?? false,
      auditLogs: (raw.audit_logs || []).map((l: any) => ({
        id: l.id,
        agreement: l.agreement,
        estadoAnterior: l.estado_anterior,
        estadoNuevo: l.estado_nuevo,
        cambiadoPor: l.cambiado_por,
        cambiadoPorNombre: l.cambiado_por_nombre,
        fechaCambio: l.fecha_cambio,
        comentario: l.comentario
      })),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
