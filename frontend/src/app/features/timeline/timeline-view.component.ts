import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringService } from '../../core/services/monitoring.service';
import { StudentService } from '../../core/services/student.service';
import { TimelineEvent } from '../../core/models/monitoring.models';
import { Student } from '../../core/models/student.models';
import { TimelineComponent } from '../../shared/components/timeline/timeline.component';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-timeline-view',
  standalone: true,
  imports: [CommonModule, TimelineComponent, PillBadgeComponent],
  template: `
    <div class="timeline-page">
      <!-- Header -->
      <div class="timeline-header">
        <div>
          <h2 class="page-title">Línea de Tiempo Longitudinal del Doctorando</h2>
          <p class="page-subtitle">Trazabilidad cronológica unificada de tutorías, acuerdos, avances de tesis y evidencias</p>
        </div>
        <div class="header-badges">
          <span class="badge-total">📊 {{ events().length }} Eventos Registrados</span>
        </div>
      </div>

      <!-- Main Layout -->
      <div class="timeline-layout">
        <!-- Main Timeline Container -->
        <div class="timeline-container">
          @if (isLoading()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Generando línea de tiempo longitudinal...</p>
            </div>
          } @else {
            <nexus-timeline [events]="events()" (selectEvent)="openFlyout($event)"></nexus-timeline>
          }
        </div>

        <!-- Flyout Drawer Lateral Derecho (Detalle del Evento) -->
        @if (selectedEvent()) {
          <aside class="flyout-drawer">
            <div class="flyout-header">
              <div class="flyout-type-badge">
                <span class="flyout-icon">{{ getIcon(selectedEvent()!.tipo) }}</span>
                <div>
                  <h3 class="flyout-title">{{ selectedEvent()!.tipoLabel }}</h3>
                  <span class="flyout-date">📅 {{ selectedEvent()!.fecha }}</span>
                </div>
              </div>
              <button type="button" class="btn-close" (click)="closeFlyout()">✕</button>
            </div>

            <div class="flyout-body">
              <div class="flyout-section">
                <label class="section-label">Título / Asunto:</label>
                <h4 class="event-headline">{{ selectedEvent()!.titulo }}</h4>
              </div>

              <div class="flyout-section">
                <label class="section-label">Descripción Detallada:</label>
                <p class="event-full-text">{{ selectedEvent()!.resumen }}</p>
              </div>

              @if (selectedEvent()!.tipo === 'TUTORIA') {
                <div class="flyout-section info-card">
                  <h5 class="subhead">Detalle de la Sesión:</h5>
                  <p><strong>Modalidad:</strong> {{ selectedEvent()!.metadata.modalidad }}</p>
                  @if (selectedEvent()!.metadata.proxima_reunion_fecha) {
                    <p><strong>Próxima Reunión:</strong> {{ selectedEvent()!.metadata.proxima_reunion_fecha }}</p>
                    <p><strong>Objetivo:</strong> {{ selectedEvent()!.metadata.proxima_reunion_notas }}</p>
                  }
                  @if (selectedEvent()!.metadata.participantes?.length) {
                    <p><strong>Asistentes:</strong> {{ selectedEvent()!.metadata.participantes?.join(', ') }}</p>
                  }
                </div>
              }

              @if (selectedEvent()!.tipo === 'ACUERDO') {
                <div class="flyout-section info-card">
                  <h5 class="subhead">Estado del Compromiso:</h5>
                  <div class="badge-row">
                    <nexus-pill-badge [variant]="selectedEvent()!.metadata.estado || 'PENDIENTE'"></nexus-pill-badge>
                  </div>
                  <p><strong>Responsable Asignado:</strong> {{ selectedEvent()!.metadata.responsable }}</p>
                  <p><strong>Fecha Compromiso:</strong> {{ selectedEvent()!.fecha }}</p>
                </div>
              }

              @if (selectedEvent()!.tipo === 'TESIS') {
                <div class="flyout-section info-card">
                  <h5 class="subhead">Desglose de Avance:</h5>
                  <div class="progress-bar-wrap">
                    <div class="progress-fill" [style.width.%]="selectedEvent()!.metadata.porcentaje_avance || 0"></div>
                  </div>
                  <span class="pct-num">{{ selectedEvent()!.metadata.porcentaje_avance }}% Completado</span>
                </div>
              }

              @if (selectedEvent()!.tipo === 'EVIDENCIA') {
                <div class="flyout-section info-card">
                  <h5 class="subhead">Recurso Probatorio:</h5>
                  @if (selectedEvent()!.metadata.archivo_url) {
                    <a [href]="selectedEvent()!.metadata.archivo_url" target="_blank" class="btn-download">
                      📥 Descargar Archivo Adjunto
                    </a>
                  }
                  @if (selectedEvent()!.metadata.url_doi) {
                    <a [href]="selectedEvent()!.metadata.url_doi" target="_blank" class="btn-external">
                      🌐 Abrir Enlace Digital / DOI
                    </a>
                  }
                </div>
              }
            </div>
          </aside>
        }
      </div>
    </div>
  `,
  styles: [`
    .timeline-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .timeline-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .page-subtitle {
      font-size: 0.825rem;
      color: var(--color-text-muted);
    }

    .badge-total {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .timeline-layout {
      display: flex;
      gap: 24px;
      position: relative;
    }

    .timeline-container {
      flex: 1;
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      padding: 24px;
      box-shadow: var(--shadow-sm);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px;
      gap: 12px;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E4E7EC;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Flyout Drawer */
    .flyout-drawer {
      width: 380px;
      min-width: 380px;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      height: calc(100vh - 160px);
      position: sticky;
      top: 84px;
      animation: flyoutSlide 0.2s ease-out;
    }

    @keyframes flyoutSlide {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .flyout-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      background-color: #F8F9FC;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .flyout-type-badge {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .flyout-icon {
      font-size: 1.4rem;
    }

    .flyout-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .flyout-date {
      font-size: 0.725rem;
      color: var(--color-text-muted);
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.15rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .flyout-body {
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .flyout-section {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-text-muted);
      text-transform: uppercase;
    }

    .event-headline {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .event-full-text {
      font-size: 0.85rem;
      color: var(--color-text-main);
      line-height: 1.5;
      background-color: #FAFAFB;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
    }

    .info-card {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: 12px;
      font-size: 0.8rem;
      gap: 6px;
    }

    .subhead {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-emphasis);
      margin-bottom: 4px;
    }

    .progress-bar-wrap {
      height: 8px;
      background-color: #E4E7EC;
      border-radius: 4px;
      overflow: hidden;
      margin: 6px 0;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--color-primary);
      border-radius: 4px;
    }

    .pct-num {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-primary);
    }

    .btn-download, .btn-external {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      text-decoration: none;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      text-align: center;
      justify-content: center;
      margin-top: 6px;
    }

    .btn-external {
      background-color: #12B76A;
    }
  `]
})
export class TimelineViewComponent implements OnInit {
  private monitoringService = inject(MonitoringService);
  private studentService = inject(StudentService);

  public isLoading = signal<boolean>(true);
  public events = signal<TimelineEvent[]>([]);
  public selectedEvent = signal<TimelineEvent | null>(null);

  ngOnInit(): void {
    this.loadTimelineData();
  }

  public loadTimelineData(): void {
    this.isLoading.set(true);
    this.monitoringService.getTimeline().subscribe({
      next: (res) => {
        this.events.set(res.events);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public openFlyout(event: TimelineEvent): void {
    this.selectedEvent.set(event);
  }

  public closeFlyout(): void {
    this.selectedEvent.set(null);
  }

  public getIcon(tipo: string): string {
    switch (tipo) {
      case 'TUTORIA': return '📘';
      case 'ACUERDO': return '📝';
      case 'TESIS': return '📊';
      case 'EVIDENCIA': return '📎';
      default: return '📍';
    }
  }
}
