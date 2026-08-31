import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Student, Semester, AcademicCommitteeMember, PaginatedResponse } from '../models/student.models';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2';

  public getStudents(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Student>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('page_size', pageSize.toString());

    return this.http.get<any>(`${this.API_URL}/students/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapStudentFromApi)
      }))
    );
  }

  public getStudentById(id: number): Observable<Student> {
    return this.http.get<any>(`${this.API_URL}/students/${id}/`).pipe(
      map(this.mapStudentFromApi)
    );
  }

  public createStudent(studentData: Partial<Student>): Observable<{ studentCreatedId: number; mensaje: string; student: Student }> {
    const payload = {
      matricula: studentData.matricula,
      nombre_completo: studentData.nombreCompleto,
      programa_doctoral: studentData.programaDoctoral,
      fecha_ingreso: studentData.fechaIngreso,
      cohorte: studentData.cohorte,
      estatus_activo: studentData.estatusActivo ?? true
    };

    return this.http.post<any>(`${this.API_URL}/students/`, payload).pipe(
      map(res => ({
        studentCreatedId: res.student_created_id,
        mensaje: res.mensaje,
        student: this.mapStudentFromApi(res.student)
      }))
    );
  }

  public getStudentCommittee(studentId: number): Observable<AcademicCommitteeMember[]> {
    return this.http.get<any[]>(`${this.API_URL}/students/${studentId}/committee/`).pipe(
      map(members => members.map(this.mapCommitteeFromApi))
    );
  }

  public addCommitteeMember(studentId: number, memberData: { userId: number; rolComite: string }): Observable<any> {
    const payload = {
      user: memberData.userId,
      rol_comite: memberData.rolComite
    };
    return this.http.post<any>(`${this.API_URL}/students/${studentId}/committee/`, payload);
  }

  public removeCommitteeMember(studentId: number, memberId: number): Observable<{ details: string; success: boolean }> {
    return this.http.delete<any>(`${this.API_URL}/students/${studentId}/committee/${memberId}/`);
  }

  public getSemesters(studentId?: number): Observable<PaginatedResponse<Semester>> {
    let params = new HttpParams();
    if (studentId) {
      params = params.set('student', studentId.toString());
    }
    return this.http.get<any>(`${this.API_URL}/semesters/`, { params }).pipe(
      map(res => ({
        count: res.count,
        next: res.next,
        previous: res.previous,
        results: (res.results || []).map(this.mapSemesterFromApi)
      }))
    );
  }

  public createSemester(semesterData: Partial<Semester>): Observable<any> {
    const payload = {
      student: semesterData.student,
      numero: semesterData.numero,
      fecha_inicio: semesterData.fechaInicio,
      fecha_fin: semesterData.fechaFin,
      is_active: semesterData.isActive ?? false
    };
    return this.http.post<any>(`${this.API_URL}/semesters/`, payload);
  }

  private mapStudentFromApi(raw: any): Student {
    return {
      id: raw.id,
      user: raw.user,
      matricula: raw.matricula,
      nombreCompleto: raw.nombre_completo,
      email: raw.email,
      programaDoctoral: raw.programa_doctoral,
      fechaIngreso: raw.fecha_ingreso,
      cohorte: raw.cohorte,
      estatusActivo: raw.estatus_activo,
      semestreActual: raw.semestre_actual ?? 1,
      asesorPrincipal: raw.asesor_principal ?? 'Sin Asignar',
      coasesor: raw.coasesor ?? 'Sin Asignar',
      totalSemestres: raw.total_semestres ?? 0,
      semesters: (raw.semesters || []).map((s: any) => ({
        id: s.id,
        student: s.student,
        studentMatricula: s.student_matricula,
        numero: s.numero,
        fechaInicio: s.fecha_inicio,
        fechaFin: s.fecha_fin,
        isActive: s.is_active
      })),
      academicCommittee: (raw.academic_committee || []).map((c: any) => ({
        id: c.id,
        student: c.student,
        studentMatricula: c.student_matricula,
        user: c.user,
        userNombre: c.user_nombre,
        userEmail: c.user_email,
        userRole: c.user_role,
        rolComite: c.rol_comite,
        rolComiteDisplay: c.rol_comite_display,
        fechaAsignacion: c.fecha_asignacion,
        isActive: c.is_active
      })),
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }

  private mapSemesterFromApi(s: any): Semester {
    return {
      id: s.id,
      student: s.student,
      studentMatricula: s.student_matricula,
      numero: s.numero,
      fechaInicio: s.fecha_inicio,
      fechaFin: s.fecha_fin,
      isActive: s.is_active
    };
  }

  private mapCommitteeFromApi(c: any): AcademicCommitteeMember {
    return {
      id: c.id,
      student: c.student,
      studentMatricula: c.student_matricula,
      user: c.user,
      userNombre: c.user_nombre,
      userEmail: c.user_email,
      userRole: c.user_role,
      rolComite: c.rol_comite,
      rolComiteDisplay: c.rol_comite_display,
      fechaAsignacion: c.fecha_asignacion,
      isActive: c.is_active
    };
  }
}
