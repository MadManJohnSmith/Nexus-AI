import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'PENDIENTE' | 'EN_PROCESO' | 'CONCLUIDO' | 'VENCIDO' | 'ACTIVO' | 'INACTIVO' | 'ASESOR' | 'COORDINADOR' | 'ESTUDIANTE';

@Component({
  selector: 'nexus-pill-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="nexus-badge" [ngClass]="badgeClass">
      <span class="badge-dot"></span>
      {{ label || variant }}
    </span>
  `,
  styles: [`
    .nexus-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      border: 1px solid transparent;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: currentColor;
    }

    /* Tokens de Semáforo de Acuerdos y Estatus */
    .badge-pendiente {
      background-color: #F6FCFE;
      color: #57949D;
      border-color: #57949D;
    }

    .badge-en-proceso {
      background-color: #FEF8F3;
      color: #B57136;
      border-color: #B57136;
    }

    .badge-concluido {
      background-color: #E9FEF1;
      color: #437E5C;
      border-color: #437E5C;
    }

    .badge-vencido {
      background-color: #F8F1FF;
      color: #A14D98;
      border-color: #A14D98;
    }

    .badge-activo {
      background-color: #EDFBF2;
      color: #22C55E;
      border-color: #22C55E;
    }

    .badge-inactivo {
      background-color: #F2F4F7;
      color: #667085;
      border-color: #D0D5DD;
    }

    .badge-asesor {
      background-color: #EEF4FF;
      color: #3538CD;
      border-color: #6172F3;
    }

    .badge-coordinador {
      background-color: #F4F3FF;
      color: #5925DC;
      border-color: #7A5AF8;
    }

    .badge-estudiante {
      background-color: #F0FDF9;
      color: #115E59;
      border-color: #2DD4BF;
    }
  `]
})
export class PillBadgeComponent {
  @Input() variant: BadgeVariant | string = 'PENDIENTE';
  @Input() label?: string;

  get badgeClass(): string {
    const norm = (this.variant || '').toUpperCase().replace(/ /g, '_');
    switch (norm) {
      case 'PENDIENTE': return 'badge-pendiente';
      case 'EN_PROCESO':
      case 'EN PROCESO': return 'badge-en-proceso';
      case 'CONCLUIDO': return 'badge-concluido';
      case 'VENCIDO': return 'badge-vencido';
      case 'ACTIVO': return 'badge-activo';
      case 'INACTIVO': return 'badge-inactivo';
      case 'ASESOR':
      case 'ASESOR_PRINCIPAL':
      case 'COASESOR': return 'badge-asesor';
      case 'COORDINADOR': return 'badge-coordinador';
      case 'ESTUDIANTE': return 'badge-estudiante';
      default: return 'badge-inactivo';
    }
  }
}
