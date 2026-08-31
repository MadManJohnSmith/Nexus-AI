import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AlertsResponse, TimelineResponse, CoordinatorDashboardResponse } from '../models/monitoring.models';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private http = inject(HttpClient);
  private alertsUrl = '/api/v2/monitoring/alerts/';
  private timelineUrl = '/api/v2/monitoring/timeline/';
  private dashboardUrl = '/api/v2/monitoring/coordinator-dashboard/';

  public getAlerts(): Observable<AlertsResponse> {
    return this.http.get<any>(this.alertsUrl).pipe(
      map(res => ({
        totalAlertas: res.total_alertas,
        totalVencidos: res.total_vencidos,
        totalPorVencer: res.total_por_vencer,
        alertasVencidas: (res.alertas_vencidas || []).map((a: any) => ({
          id: a.id,
          tipoAlerta: a.tipo_alerta,
          descripcion: a.descripcion,
          studentId: a.student_id,
          studentNombre: a.student_nombre,
          studentMatricula: a.student_matricula,
          responsableNombre: a.responsable_nombre,
          fechaLimite: a.fecha_limite,
          diasRestantes: a.dias_restantes,
          estado: a.estado
        })),
        alertasPorVencer: (res.alertas_por_vencer || []).map((a: any) => ({
          id: a.id,
          tipoAlerta: a.tipo_alerta,
          descripcion: a.descripcion,
          studentId: a.student_id,
          studentNombre: a.student_nombre,
          studentMatricula: a.student_matricula,
          responsableNombre: a.responsable_nombre,
          fechaLimite: a.fecha_limite,
          diasRestantes: a.dias_restantes,
          estado: a.estado
        }))
      }))
    );
  }

  public getTimeline(studentId?: number): Observable<TimelineResponse> {
    let params: any = {};
    if (studentId) params.student = studentId;

    return this.http.get<any>(this.timelineUrl, { params }).pipe(
      map(res => ({
        studentId: res.student_id,
        studentNombre: res.student_nombre,
        studentMatricula: res.student_matricula,
        totalEventos: res.total_eventos,
        events: (res.events || []).map((e: any) => ({
          id: e.id,
          rawId: e.raw_id,
          tipo: e.tipo,
          tipoLabel: e.tipo_label,
          titulo: e.titulo,
          fecha: e.fecha,
          resumen: e.resumen,
          semesterNumero: e.semester_numero,
          autorNombre: e.autor_nombre,
          metadata: e.metadata
        }))
      }))
    );
  }

  public getCoordinatorDashboard(): Observable<CoordinatorDashboardResponse> {
    return this.http.get<any>(this.dashboardUrl).pipe(
      map(res => ({
        kpis: {
          totalEstudiantesActivos: res.kpis?.total_estudiantes_activos ?? 0,
          totalTutorias: res.kpis?.total_tutorias ?? 0,
          totalAcuerdosPendientes: res.kpis?.total_acuerdos_pendientes ?? 0,
          totalAcuerdosVencidos: res.kpis?.total_acuerdos_vencidos ?? 0,
          totalPublicaciones: res.kpis?.total_publicaciones ?? 0,
          totalEventos: res.kpis?.total_eventos ?? 0,
          totalEstancias: res.kpis?.total_estancias ?? 0
        },
        casosAtencion: (res.casos_atencion || []).map((c: any) => ({
          studentId: c.student_id,
          matricula: c.matricula,
          nombreCompleto: c.nombre_completo,
          cohorte: c.cohorte,
          semestreActual: c.semestre_actual,
          asesorPrincipal: c.asesor_principal,
          fechaUltimaTutoria: c.fecha_ultima_tutoria,
          diasSinTutoria: c.dias_sin_tutoria,
          acuerdosVencidosCount: c.acuerdos_vencidos_count,
          porcentajeTesis: c.porcentaje_tesis,
          nivelRiesgo: c.nivel_riesgo,
          motivosRiesgo: c.motivos_riesgo || []
        })),
        distribucionTesisCohorte: (res.distribucion_tesis_cohorte || []).map((d: any) => ({
          cohorte: d.cohorte,
          totalEstudiantes: d.total_estudiantes,
          promedioAvanceTesis: d.promedio_avance_tesis
        }))
      }))
    );
  }
}
