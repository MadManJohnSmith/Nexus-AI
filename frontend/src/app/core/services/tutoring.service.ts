import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { TutoringSession, CreateTutoringSessionPayload } from '../models/tutoring.models';
import { PaginatedResponse } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class TutoringService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2/tutoring-sessions';

  public getSessions(studentId?: number, semesterId?: number, page: number = 1): Observable<PaginatedResponse<TutoringSession>> {
    let params = new HttpParams().set('page', page.toString());
    if (studentId) params = params.set('student', studentId.toString());
    if (semesterId) params = params.set('semester', semesterId.toString());

    return this.http.get<any>(`${this.API_URL}/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapSessionFromApi)
      }))
    );
  }

  public getSessionById(id: number): Observable<TutoringSession> {
    return this.http.get<any>(`${this.API_URL}/${id}/`).pipe(
      map(this.mapSessionFromApi)
    );
  }

  public createSession(payload: CreateTutoringSessionPayload): Observable<{ tutoringSessionCreatedId: number; mensaje: string; session: TutoringSession }> {
    return this.http.post<any>(`${this.API_URL}/`, payload).pipe(
      map(res => ({
        tutoringSessionCreatedId: res.tutoring_session_created_id,
        mensaje: res.mensaje,
        session: this.mapSessionFromApi(res.session)
      }))
    );
  }

  public addObservation(sessionId: number, tema: string, observaciones: string): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/${sessionId}/observations/`, {
      tema_revisado: tema,
      observaciones_detalladas: observaciones
    });
  }

  private mapSessionFromApi(raw: any): TutoringSession {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      fechaSesion: raw.fecha_sesion,
      modalidad: raw.modalidad,
      resumenGeneral: raw.resumen_general,
      proximaReunionFecha: raw.proxima_reunion_fecha,
      proximaReunionNotas: raw.proxima_reunion_notas,
      createdBy: raw.created_by,
      createdByNombre: raw.created_by_nombre,
      totalObservaciones: raw.total_observaciones ?? 0,
      totalParticipantes: raw.total_participantes ?? 0,
      participants: (raw.participants || []).map((p: any) => ({
        id: p.id,
        session: p.session,
        user: p.user,
        userNombre: p.user_nombre,
        userEmail: p.user_email,
        rolEnSesion: p.rol_en_sesion,
        asistenciaConfirmada: p.asistencia_confirmada
      })),
      observations: (raw.observations || []).map((o: any) => ({
        id: o.id,
        session: o.session,
        autor: o.autor,
        autorNombre: o.autor_nombre,
        temaRevisado: o.tema_revisado,
        observacionesDetalladas: o.observaciones_detalladas,
        createdAt: o.created_at
      })),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
