import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ThesisProgress, ThesisComponents } from '../models/thesis.models';
import { PaginatedResponse } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class ThesisService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2/thesis-progress';

  public getProgressList(studentId?: number, semesterId?: number): Observable<PaginatedResponse<ThesisProgress>> {
    let params = new HttpParams();
    if (studentId) params = params.set('student', studentId.toString());
    if (semesterId) params = params.set('semester', semesterId.toString());

    return this.http.get<any>(`${this.API_URL}/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapProgressFromApi)
      }))
    );
  }

  public registerProgress(payload: {
    student: number;
    semester: number;
    porcentaje_avance: number;
    componentes_json: ThesisComponents;
    observaciones?: string;
  }): Observable<{ thesisProgressCreatedId: number; mensaje: string; thesisProgress: ThesisProgress }> {
    return this.http.post<any>(`${this.API_URL}/`, payload).pipe(
      map(res => ({
        thesisProgressCreatedId: res.thesis_progress_created_id,
        mensaje: res.mensaje,
        thesisProgress: this.mapProgressFromApi(res.thesis_progress)
      }))
    );
  }

  private mapProgressFromApi(raw: any): ThesisProgress {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      porcentajeAvance: raw.porcentaje_avance,
      componentesJson: raw.componentes_json || {
        protocolo: 0,
        estado_arte: 0,
        marco_teorico: 0,
        metodologia: 0,
        analisis: 0,
        redaccion: 0
      },
      observaciones: raw.observaciones || '',
      fechaRegistro: raw.fecha_registro,
      registradoPor: raw.registrado_por,
      registradoPorNombre: raw.registrado_por_nombre,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
