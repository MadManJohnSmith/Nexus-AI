import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEvent } from '../../../core/models/monitoring.models';
import { PillBadgeComponent } from '../../components/pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-timeline',
  standalone: true,
  imports: [CommonModule, PillBadgeComponent],
  template: `
    <div class="timeline-wrapper">
      <div class="timeline-line"></div>

      @for (event of events; track event.id) {
        <div class="timeline-item" (click)="onSelectEvent(event)">
          <!-- Node Dot with Icon & Institutional Colors -->
          <div class="node-badge" [ngClass]="getNodeClass(event.tipo, event.metadata.estado)">
            <span class="node-icon">{{ getNodeIcon(event.tipo) }}</span>
          </div>

          <!-- Content Card -->
          <div class="event-card">
            <div class="card-top-row">
              <div class="event-type-badge">
                <span class="type-title">{{ event.tipoLabel }}</span>
                @if (event.semesterNumero) {
                  <span class="sem-chip">Semestre {{ event.semesterNumero }}</span>
                }
              </div>
              <span class="event-date">📅 {{ event.fecha }}</span>
            </div>

            <h4 class="event-title">{{ event.titulo }}</h4>
            <p class="event-summary">{{ event.resumen }}</p>

            <div class="card-footer-row">
              <span class="event-author">👤 {{ event.autorNombre || 'Autor' }}</span>
              @if (event.tipo === 'ACUERDO' && event.metadata.estado) {
                <nexus-pill-badge [variant]="event.metadata.estado"></nexus-pill-badge>
              }
              @if (event.tipo === 'EVIDENCIA' && event.metadata.url_doi) {
                <span class="link-chip">🌐 Enlace DOI</span>
              }
              <span class="details-hint">Ver detalle ➔</span>
            </div>
          </div>
        </div>
      } @empty {
        <div class="empty-timeline">
          <p>No hay eventos registrados en la trayectoria longitudinal.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline-wrapper {
      position: relative;
      padding: 20px 0 20px 32px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .timeline-line {
      position: absolute;
      left: 17px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: var(--color-border);
      z-index: 1;
    }

    .timeline-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 20px;
      cursor: pointer;
      z-index: 2;
    }

    .node-badge {
      width: 36px;
      height: 36px;
      min-width: 36px;
      border-radius: 50%;
      background-color: #FFFFFF;
      border: 2px solid var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      margin-left: -35px;
      transition: all 0.2s ease;
    }

    .timeline-item:hover .node-badge {
      transform: scale(1.15);
      box-shadow: 0 0 0 4px var(--color-primary-light);
    }

    .node-icon {
      font-size: 1rem;
    }

    /* Node Styles by Type */
    .node-tutoria {
      border-color: #6365EF;
      background-color: #EEF0FF;
    }

    .node-acuerdo-pendiente {
      border-color: #57949D;
      background-color: #F6FCFE;
    }

    .node-acuerdo-proceso {
      border-color: #B57136;
      background-color: #FEF8F3;
    }

    .node-acuerdo-concluido {
      border-color: #437E5C;
      background-color: #E9FEF1;
    }

    .node-acuerdo-vencido {
      border-color: #A14D98;
      background-color: #F8F1FF;
    }

    .node-tesis {
      border-color: #2C1867;
      background-color: #F4F3FF;
    }

    .node-evidencia {
      border-color: #12B76A;
      background-color: #ECFDF3;
    }

    /* Event Card */
    .event-card {
      flex: 1;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: all 0.2s;
    }

    .timeline-item:hover .event-card {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .event-type-badge {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .type-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-emphasis);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .sem-chip {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .event-date {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .event-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .event-summary {
      font-size: 0.825rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .card-footer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 10px;
      border-top: 1px solid #F2F4F7;
      margin-top: 4px;
      font-size: 0.75rem;
    }

    .event-author {
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .link-chip {
      background-color: #ECFDF3;
      color: #027A48;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .details-hint {
      color: var(--color-primary);
      font-weight: 600;
    }

    .empty-timeline {
      padding: 40px;
      text-align: center;
      color: var(--color-text-muted);
    }
  `]
})
export class TimelineComponent {
  @Input() events: TimelineEvent[] = [];
  @Output() selectEvent = new EventEmitter<TimelineEvent>();

  public onSelectEvent(event: TimelineEvent): void {
    this.selectEvent.emit(event);
  }

  public getNodeIcon(tipo: string): string {
    switch (tipo) {
      case 'TUTORIA': return '📘';
      case 'ACUERDO': return '📝';
      case 'TESIS': return '📊';
      case 'EVIDENCIA': return '📎';
      default: return '📍';
    }
  }

  public getNodeClass(tipo: string, estado?: string): string {
    if (tipo === 'TUTORIA') return 'node-tutoria';
    if (tipo === 'TESIS') return 'node-tesis';
    if (tipo === 'EVIDENCIA') return 'node-evidencia';
    if (tipo === 'ACUERDO') {
      const norm = (estado || 'PENDIENTE').toUpperCase();
      if (norm === 'PENDIENTE') return 'node-acuerdo-pendiente';
      if (norm === 'EN_PROCESO') return 'node-acuerdo-proceso';
      if (norm === 'CONCLUIDO') return 'node-acuerdo-concluido';
      if (norm === 'VENCIDO') return 'node-acuerdo-vencido';
    }
    return 'node-tutoria';
  }
}
