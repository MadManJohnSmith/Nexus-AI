import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { AlertsResponse, TimelineResponse } from '../models/monitoring.models';

@Injectable({
  providedIn: 'root'
})
export class MonitoringService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/v2/monitoring';

  public alertsState = signal<AlertsResponse | null>(null);

  public getAlerts(): Observable<AlertsResponse> {
    return this.http.get<any>(`${this.API_URL}/alerts/`).pipe(
      map(res => ({
        totalAlertas: res.total_alertas,
        totalVencidos: res.total_vencidos,
        totalPorVencer: res.total_por_vencer,
        alertasVencidas: (res.alertas_vencidas || []).map(this.mapAlertItem),
        alertasPorVencer: (res.alertas_por_vencer || []).map(this.mapAlertItem)
      })),
      tap(alerts => this.alertsState.set(alerts))
    );
  }

  public getTimeline(studentId?: number): Observable<TimelineResponse> {
    let params = new HttpParams();
    if (studentId) params = params.set('student', studentId.toString());

    return this.http.get<any>(`${this.API_URL}/timeline/`, { params }).pipe(
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
          metadata: e.metadata || {}
        }))
      }))
    );
  }

  private mapAlertItem(raw: any) {
    return {
      id: raw.id,
      tipoAlerta: raw.tipo_alerta,
      descripcion: raw.descripcion,
      studentId: raw.student_id,
      studentNombre: raw.student_nombre,
      studentMatricula: raw.student_matricula,
      responsableNombre: raw.responsable_nombre,
      fechaLimite: raw.fecha_limite,
      diasRestantes: raw.dias_restantes,
      estado: raw.estado
    };
  }
}
