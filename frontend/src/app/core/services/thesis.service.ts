import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ThesisProgress, ThesisHistoryResponse } from '../models/thesis.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class ThesisService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v2/thesis-progress/';

  public getProgressList(studentId?: number, semesterId?: number): Observable<PaginatedResponse<ThesisProgress>> {
    let params: any = {};
    if (studentId) params.student = studentId;
    if (semesterId) params.semester = semesterId;
    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => ({
        ...res,
        results: (res.results || []).map((p: any) => this.mapProgress(p))
      }))
    );
  }

  public getThesisHistory(studentId: number): Observable<ThesisHistoryResponse> {
    return this.http.get<any>(`${this.apiUrl}history/`, { params: { student_id: studentId } }).pipe(
      map(res => ({
        studentId: res.student_id,
        studentNombre: res.student_nombre,
        studentMatricula: res.student_matricula,
        semestersHistory: (res.semesters_history || []).map((h: any) => ({
          semesterNumero: h.semester_numero,
          semesterId: h.semester_id,
          hasData: h.has_data,
          porcentajeAvance: h.porcentaje_avance,
          fechaRegistro: h.fecha_registro,
          observaciones: h.observaciones,
          componentesJson: {
            protocolo: h.componentes_json?.protocolo ?? 0,
            estadoArte: h.componentes_json?.estado_arte ?? h.componentes_json?.estadoArte ?? 0,
            marcoTeorico: h.componentes_json?.marco_teorico ?? h.componentes_json?.marcoTeorico ?? 0,
            metodologia: h.componentes_json?.metodologia ?? 0,
            analisis: h.componentes_json?.analisis ?? 0,
            redaccion: h.componentes_json?.redaccion ?? 0
          },
          registradoPorNombre: h.registrado_por_nombre
        }))
      }))
    );
  }

  public createProgress(data: {
    student: number;
    semester: number;
    porcentajeAvance: number;
    componentesJson?: any;
    observaciones: string;
  }): Observable<any> {
    const payload = {
      student: data.student,
      semester: data.semester,
      porcentaje_avance: data.porcentajeAvance,
      componentes_json: data.componentesJson,
      observaciones: data.observaciones
    };
    return this.http.post<any>(this.apiUrl, payload);
  }

  private mapProgress(raw: any): ThesisProgress {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      porcentajeAvance: raw.porcentaje_avance,
      componentesJson: raw.componentes_json,
      observaciones: raw.observaciones,
      registradoPor: raw.registrado_por,
      registradoPorNombre: raw.registrado_por_nombre,
      fechaRegistro: raw.fecha_registro,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
