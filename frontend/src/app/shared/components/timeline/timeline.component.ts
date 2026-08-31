import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimelineEvent } from '../../../core/models/monitoring.models';
import { PillBadgeComponent } from '../pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-timeline',
  standalone: true,
  imports: [CommonModule, PillBadgeComponent],
  template: `
    <div class="timeline-container">
      @for (item of events; track item.id; let idx = $index; let isLast = $last) {
        <div class="timeline-item" (click)="onNodeClick(item)">
          <!-- Línea vertical continua e Ícono/Dot -->
          <div class="timeline-axis">
            <div class="timeline-dot" [ngClass]="getDotClass(item.tipo)">
              <span class="dot-icon">{{ getIcon(item.tipo) }}</span>
            </div>
            @if (!isLast) {
              <div class="timeline-line"></div>
            }
          </div>

          <!-- Contenido / Card del Nodo -->
          <div class="timeline-content-card" [ngClass]="getCardHoverClass(item.tipo)">
            <div class="card-top-row">
              <div class="type-and-date">
                <span class="type-pill" [ngClass]="getTypePillClass(item.tipo)">
                  {{ item.tipoLabel }}
                </span>
                @if (item.semesterNumero) {
                  <span class="semester-tag">Semestre {{ item.semesterNumero }}</span>
                }
              </div>
              <span class="event-date">📅 {{ item.fecha }}</span>
            </div>

            <h4 class="event-title">{{ item.titulo }}</h4>
            <p class="event-summary">{{ item.resumen }}</p>

            <div class="card-footer-row">
              <span class="author-tag">👤 {{ item.autorNombre }}</span>
              <span class="click-hint">Click para ver detalle ➔</span>
            </div>
          </div>
        </div>
      } @empty {
        <div class="empty-timeline">
          <p>No hay eventos registrados en la trayectoria de este estudiante.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .timeline-container {
      display: flex;
      flex-direction: column;
      position: relative;
      padding: 12px 0;
    }

    .timeline-item {
      display: flex;
      gap: 20px;
      cursor: pointer;
      position: relative;
    }

    .timeline-axis {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 40px;
      flex-shrink: 0;
    }

    .timeline-dot {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s ease;
      background-color: #FFFFFF;
      border: 2px solid var(--color-border);
    }

    .timeline-item:hover .timeline-dot {
      transform: scale(1.15);
    }

    .dot-tutoria {
      border-color: #6365EF;
      background-color: #EEF0FF;
      color: #6365EF;
    }

    .dot-acuerdo {
      border-color: #57949D;
      background-color: #F6FCFE;
      color: #57949D;
    }

    .dot-tesis {
      border-color: #2C1867;
      background-color: #F4F3FF;
      color: #2C1867;
    }

    .dot-evidencia {
      border-color: #12B76A;
      background-color: #ECFDF3;
      color: #12B76A;
    }

    .dot-publicacion {
      border-color: #8B5CF6;
      background-color: #F5F3FF;
      color: #8B5CF6;
    }

    .dot-evento {
      border-color: #F59E0B;
      background-color: #FEF3C7;
      color: #D97706;
    }

    .dot-estancia {
      border-color: #0284C7;
      background-color: #E0F2FE;
      color: #0284C7;
    }

    .dot-producto {
      border-color: #EC4899;
      background-color: #FDF2F8;
      color: #EC4899;
    }

    .dot-icon {
      font-size: 1rem;
    }

    .timeline-line {
      width: 2px;
      flex: 1;
      background-color: #E4E7EC;
      margin: 4px 0;
    }

    .timeline-content-card {
      flex: 1;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .timeline-item:hover .timeline-content-card {
      box-shadow: var(--shadow-md);
      border-color: var(--color-primary);
      transform: translateX(4px);
    }

    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .type-and-date {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .type-pill {
      font-size: 0.725rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .pill-tutoria { background: #EEF0FF; color: #6365EF; }
    .pill-acuerdo { background: #F6FCFE; color: #57949D; }
    .pill-tesis { background: #F4F3FF; color: #2C1867; }
    .pill-evidencia { background: #ECFDF3; color: #12B76A; }
    .pill-publicacion { background: #F5F3FF; color: #8B5CF6; }
    .pill-evento { background: #FEF3C7; color: #D97706; }
    .pill-estancia { background: #E0F2FE; color: #0284C7; }
    .pill-producto { background: #FDF2F8; color: #EC4899; }

    .semester-tag {
      font-size: 0.7rem;
      background: #F2F4F7;
      color: var(--color-text-muted);
      padding: 2px 6px;
      border-radius: 4px;
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
      justify-content: space-between;
      align-items: center;
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px dashed var(--color-border);
      font-size: 0.75rem;
    }

    .author-tag {
      color: var(--color-text-light);
      font-weight: 500;
    }

    .click-hint {
      color: var(--color-primary);
      font-weight: 600;
    }

    .empty-timeline {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted);
      font-size: 0.875rem;
    }
  `]
})
export class TimelineComponent {
  @Input() events: TimelineEvent[] = [];
  @Output() nodeSelected = new EventEmitter<TimelineEvent>();

  public onNodeClick(item: TimelineEvent): void {
    this.nodeSelected.emit(item);
  }

  public getIcon(tipo: string): string {
    switch (tipo) {
      case 'TUTORIA': return '📘';
      case 'ACUERDO': return '📝';
      case 'TESIS': return '📊';
      case 'EVIDENCIA': return '📎';
      case 'PUBLICACION': return '🎓';
      case 'EVENTO': return '🏛️';
      case 'ESTANCIA': return '✈️';
      case 'PRODUCTO': return '💻';
      default: return '📌';
    }
  }

  public getDotClass(tipo: string): string {
    return 'dot-' + tipo.toLowerCase();
  }

  public getTypePillClass(tipo: string): string {
    return 'pill-' + tipo.toLowerCase();
  }

  public getCardHoverClass(tipo: string): string {
    return 'hover-' + tipo.toLowerCase();
  }
}
