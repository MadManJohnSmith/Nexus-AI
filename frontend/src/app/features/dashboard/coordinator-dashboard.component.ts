import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MonitoringService } from '../../core/services/monitoring.service';
import { CoordinatorDashboardResponse, CasoAtencion, CohorteDistribucionTesis } from '../../core/models/monitoring.models';

@Component({
  selector: 'nexus-coordinator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-layout">
      <!-- Header del Dashboard -->
      <div class="dashboard-header">
        <div>
          <h2 class="dash-title">Dashboard del Coordinador de Posgrado (HU-24)</h2>
          <p class="dash-subtitle">Visión panorámica de la cohorte doctoral, semáforos de riesgo académico e indicadores institucionales.</p>
        </div>
        <button type="button" class="btn-refresh" (click)="loadDashboard()">
          🔄 Actualizar Métricas
        </button>
      </div>

      <!-- Fila Superior de Summary Cards (KPIs) -->
      @if (dashboardData()) {
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon-wrap primary">👥</div>
            <div class="kpi-content">
              <span class="kpi-title">Doctorandos Activos</span>
              <span class="kpi-value">{{ dashboardData()!.kpis.totalEstudiantesActivos }}</span>
              <span class="kpi-trend positive">Matrícula Regular</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap info">📘</div>
            <div class="kpi-content">
              <span class="kpi-title">Tutorías del Periodo</span>
              <span class="kpi-value">{{ dashboardData()!.kpis.totalTutorias }}</span>
              <span class="kpi-trend">Sesiones registradas</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap warning">📝</div>
            <div class="kpi-content">
              <span class="kpi-title">Acuerdos Pendientes</span>
              <span class="kpi-value">{{ dashboardData()!.kpis.totalAcuerdosPendientes }}</span>
              <span class="kpi-pill pending">En seguimiento</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap danger">⚠️</div>
            <div class="kpi-content">
              <span class="kpi-title">Acuerdos Vencidos</span>
              <span class="kpi-value text-danger">{{ dashboardData()!.kpis.totalAcuerdosVencidos }}</span>
              <span class="kpi-pill overdue">Atención Urgente</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon-wrap success">🎓</div>
            <div class="kpi-content">
              <span class="kpi-title">Producción Científica</span>
              <span class="kpi-value">{{ dashboardData()!.kpis.totalPublicaciones }}</span>
              <span class="kpi-sub">{{ dashboardData()!.kpis.totalEventos }} congresos / {{ dashboardData()!.kpis.totalEstancias }} estancias</span>
            </div>
          </div>
        </div>

        <!-- Sección de Semáforo de Riesgo y Casos de Atención -->
        <div class="dashboard-main-grid">
          <!-- Columna Izquierda: Tabla Priorizada de Casos de Atención -->
          <div class="dash-col-left">
            <section class="dash-card">
              <div class="dash-card-header">
                <div>
                  <h3 class="card-title">Semáforo de Riesgo y Casos de Atención Prioritaria</h3>
                  <p class="card-subtitle">Doctorandos con acuerdos vencidos, más de 30 días sin tutoría o rezago en tesis.</p>
                </div>
                <div class="risk-legend">
                  <span class="legend-item"><span class="dot red"></span> Alto Riesgo</span>
                  <span class="legend-item"><span class="dot amber"></span> Riesgo Medio</span>
                  <span class="legend-item"><span class="dot green"></span> Regular</span>
                </div>
              </div>

              <div class="dash-table-wrapper">
                <table class="dash-table">
                  <thead>
                    <tr>
                      <th>Doctorando</th>
                      <th>Cohorte / Sem</th>
                      <th>Última Tutoría</th>
                      <th>Acuerdos Vencidos</th>
                      <th>Avance Tesis</th>
                      <th>Nivel de Riesgo</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (caso of dashboardData()!.casosAtencion; track caso.studentId) {
                      <tr [class.risk-row-high]="caso.nivelRiesgo === 'ALTO'" [class.risk-row-medium]="caso.nivelRiesgo === 'MEDIO'">
                        <td>
                          <div class="student-cell">
                            <strong>{{ caso.nombreCompleto }}</strong>
                            <span class="mat-sub">{{ caso.matricula }} • Asesor: {{ caso.asesorPrincipal }}</span>
                          </div>
                        </td>
                        <td>{{ caso.cohorte }} (Sem {{ caso.semestreActual }})</td>
                        <td>
                          <div class="tutoria-cell">
                            <span>{{ caso.fechaUltimaTutoria }}</span>
                            <small [class.text-danger]="caso.diasSinTutoria > 45" [class.text-warning]="caso.diasSinTutoria > 30 && caso.diasSinTutoria <= 45">
                              ({{ caso.diasSinTutoria }} días sin sesión)
                            </small>
                          </div>
                        </td>
                        <td>
                          @if (caso.acuerdosVencidosCount > 0) {
                            <span class="overdue-count-pill">{{ caso.acuerdosVencidosCount }} vencido(s)</span>
                          } @else {
                            <span class="text-muted">0</span>
                          }
                        </td>
                        <td>
                          <div class="mini-progress-wrap">
                            <div class="mini-progress-bar">
                              <div class="mini-fill" [style.width.%]="caso.porcentajeTesis"></div>
                            </div>
                            <span class="mini-pct">{{ caso.porcentajeTesis }}%</span>
                          </div>
                        </td>
                        <td>
                          <div class="risk-badge" [class.high]="caso.nivelRiesgo === 'ALTO'" [class.medium]="caso.nivelRiesgo === 'MEDIO'" [class.low]="caso.nivelRiesgo === 'BAJO'">
                            <span class="risk-dot"></span>
                            <span>{{ caso.nivelRiesgo }}</span>
                          </div>
                        </td>
                        <td>
                          <button type="button" class="btn-inspect" (click)="goToStudentExpediente(caso.studentId)">
                            Ver Expediente
                          </button>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="7" class="empty-table">No se detectaron alumnos en condición de riesgo.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <!-- Columna Derecha: Distribución de Tesis por Cohorte -->
          <div class="dash-col-right">
            <section class="dash-card">
              <div class="dash-card-header">
                <h3 class="card-title">Avance de Tesis por Cohorte</h3>
              </div>
              <div class="cohort-list">
                @for (c of dashboardData()!.distribucionTesisCohorte; track c.cohorte) {
                  <div class="cohort-item">
                    <div class="cohort-meta">
                      <strong>Cohorte {{ c.cohorte }}</strong>
                      <span>{{ c.totalEstudiantes }} doctorando(s)</span>
                    </div>
                    <div class="cohort-bar-wrap">
                      <div class="cohort-bar">
                        <div class="cohort-bar-fill" [style.width.%]="c.promedioAvanceTesis"></div>
                      </div>
                      <span class="cohort-avg">{{ c.promedioAvanceTesis }}% prom.</span>
                    </div>
                  </div>
                }
              </div>
            </section>

            <!-- Acceso Rápido a Reportes -->
            <section class="dash-card summary-box">
              <h4 class="card-title-sm">Exportación de Reportes del Posgrado</h4>
              <p class="text-sm">Genere cédulas oficiales de seguimiento para comités evaluadores y acreditaciones Conahcyt.</p>
              <button type="button" class="btn-export-link" routerLink="/reports">
                📄 Ir al Módulo de Reportes ➔
              </button>
            </section>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dash-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .dash-subtitle {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .btn-refresh {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--color-text-main);
      transition: all 0.2s;
    }

    .btn-refresh:hover {
      background-color: #F8F9FC;
      border-color: var(--color-primary);
      color: var(--color-primary);
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: var(--shadow-sm);
    }

    .kpi-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .kpi-icon-wrap.primary { background: #EEF0FF; color: #6365EF; }
    .kpi-icon-wrap.info { background: #E0F2FE; color: #0284C7; }
    .kpi-icon-wrap.warning { background: #FEF3C7; color: #D97706; }
    .kpi-icon-wrap.danger { background: #FEE2E2; color: #DC2626; }
    .kpi-icon-wrap.success { background: #DCFCE7; color: #16A34A; }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .kpi-title {
      font-size: 0.725rem;
      color: var(--color-text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .kpi-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--color-text-main);
      line-height: 1.1;
    }

    .kpi-value.text-danger {
      color: var(--color-danger);
    }

    .kpi-trend {
      font-size: 0.675rem;
      color: var(--color-text-light);
    }

    .kpi-pill {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      width: fit-content;
      margin-top: 2px;
    }

    .kpi-pill.pending { background: #FEF8F3; color: #B57136; }
    .kpi-pill.overdue { background: #F8F1FF; color: #A14D98; }

    .kpi-sub {
      font-size: 0.65rem;
      color: var(--color-text-muted);
    }

    .dashboard-main-grid {
      display: grid;
      grid-template-columns: 7fr 3fr;
      gap: 20px;
    }

    .dash-card {
      background: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }

    .dash-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .card-subtitle {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .risk-legend {
      display: flex;
      gap: 12px;
      font-size: 0.725rem;
      color: var(--color-text-muted);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot.red { background: var(--color-danger); }
    .dot.amber { background: #F59E0B; }
    .dot.green { background: var(--color-success); }

    .dash-table-wrapper {
      overflow-x: auto;
    }

    .dash-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      text-align: left;
    }

    .dash-table th {
      padding: 10px 12px;
      background: #F8F9FC;
      color: var(--color-text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
    }

    .dash-table td {
      padding: 12px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-main);
    }

    .risk-row-high {
      background-color: #FFF5F5;
    }

    .risk-row-medium {
      background-color: #FFFAF0;
    }

    .student-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .mat-sub {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .tutoria-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .overdue-count-pill {
      background: #FEE2E2;
      color: #DC2626;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.725rem;
    }

    .mini-progress-wrap {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .mini-progress-bar {
      width: 60px;
      height: 6px;
      background: #E4E7EC;
      border-radius: 3px;
      overflow: hidden;
    }

    .mini-fill {
      height: 100%;
      background: var(--color-primary);
    }

    .mini-pct {
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .risk-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
      width: fit-content;
    }

    .risk-badge.high { background: #FEE2E2; color: #DC2626; }
    .risk-badge.medium { background: #FEF3C7; color: #D97706; }
    .risk-badge.low { background: #DCFCE7; color: #16A34A; }

    .risk-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .btn-inspect {
      background: #FFFFFF;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-inspect:hover {
      background: var(--color-primary);
      color: #FFFFFF;
    }

    .cohort-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .cohort-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-bottom: 10px;
      border-bottom: 1px dashed var(--color-border);
    }

    .cohort-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .cohort-bar-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .cohort-bar {
      flex: 1;
      height: 8px;
      background: #F2F4F7;
      border-radius: 4px;
      overflow: hidden;
    }

    .cohort-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), #8B8DF7);
    }

    .cohort-avg {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-emphasis);
      min-width: 65px;
      text-align: right;
    }

    .summary-box {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .card-title-sm {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .text-sm {
      font-size: 0.775rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .btn-export-link {
      background: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
      padding: 8px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
      margin-top: 6px;
    }

    .btn-export-link:hover {
      background: var(--color-primary);
      color: #FFFFFF;
    }

    .text-danger { color: var(--color-danger); }
    .text-warning { color: #D97706; }
    .text-muted { color: var(--color-text-light); }
  `]
})
export class CoordinatorDashboardComponent implements OnInit {
  private monitoringService = inject(MonitoringService);
  private router = inject(Router);

  public dashboardData = signal<CoordinatorDashboardResponse | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  public loadDashboard(): void {
    this.monitoringService.getCoordinatorDashboard().subscribe({
      next: (res) => this.dashboardData.set(res)
    });
  }

  public goToStudentExpediente(studentId: number): void {
    this.router.navigate(['/student-overview']);
  }
}
