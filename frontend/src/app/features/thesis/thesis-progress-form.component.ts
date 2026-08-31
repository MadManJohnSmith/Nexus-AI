import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThesisService } from '../../core/services/thesis.service';
import { Student } from '../../core/models/student.models';
import { ThesisComponents } from '../../core/models/thesis.models';

@Component({
  selector: 'nexus-thesis-progress-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="thesis-form-card">
      <div class="form-header">
        <span class="header-icon">📊</span>
        <div>
          <h3 class="form-title">Registrar Avance Longitudinal de Tesis Doctoral</h3>
          <p class="form-subtitle">Evaluación periódica del proyecto de investigación doctoral</p>
        </div>
      </div>

      @if (successMessage()) {
        <div class="alert-success">
          <span>✅ {{ successMessage() }}</span>
        </div>
      }

      @if (errorMessage()) {
        <div class="alert-error">
          <span>⚠️ {{ errorMessage() }}</span>
        </div>
      }

      <div class="form-body">
        <!-- Semestre Selection -->
        <div class="field-row">
          <div class="form-group">
            <label class="form-label">Semestre Evaluado *</label>
            <select [(ngModel)]="selectedSemesterId" class="form-select">
              @for (s of student?.semesters || []; track s.id) {
                <option [value]="s.id">
                  Semestre {{ s.numero }} ({{ s.isActive ? 'Activo en Curso' : 'Concluido' }})
                </option>
              }
            </select>
          </div>
        </div>

        <!-- Slider Sincronizado con Input Numérico -->
        <div class="slider-box">
          <div class="slider-header">
            <label class="form-label">Porcentaje Global de Avance de Investigación *</label>
            <div class="numeric-input-wrapper">
              <input 
                type="number" 
                min="0" 
                max="100" 
                [(ngModel)]="porcentajeGlobal" 
                class="num-input" 
              />
              <span class="pct-symbol">%</span>
            </div>
          </div>
          
          <div class="slider-track-container">
            <input 
              type="range" 
              min="0" 
              max="100" 
              [(ngModel)]="porcentajeGlobal" 
              class="range-slider"
            />
            <div class="slider-ticks">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Acordeón de Checklist por Componentes Temáticos -->
        <div class="components-accordion">
          <div class="accordion-header" (click)="toggleAccordion()">
            <span class="acc-title">📋 Desglose por Componentes y Fases de Tesis</span>
            <span class="acc-arrow">{{ isAccordionOpen ? '▲' : '▼' }}</span>
          </div>

          @if (isAccordionOpen) {
            <div class="accordion-content">
              <div class="comp-row">
                <span class="comp-lbl">1. Protocolo de Investigación Aprobado:</span>
                <input type="range" min="0" max="100" [(ngModel)]="componentes.protocolo" class="mini-slider" />
                <span class="comp-val">{{ componentes.protocolo }}%</span>
              </div>
              <div class="comp-row">
                <span class="comp-lbl">2. Estado del Arte y Marco Teórico:</span>
                <input type="range" min="0" max="100" [(ngModel)]="componentes.estado_arte" class="mini-slider" />
                <span class="comp-val">{{ componentes.estado_arte }}%</span>
              </div>
              <div class="comp-row">
                <span class="comp-lbl">3. Marco Metodológico y Algoritmos:</span>
                <input type="range" min="0" max="100" [(ngModel)]="componentes.metodologia" class="mini-slider" />
                <span class="comp-val">{{ componentes.metodologia }}%</span>
              </div>
              <div class="comp-row">
                <span class="comp-lbl">4. Experimentación y Análisis de Resultados:</span>
                <input type="range" min="0" max="100" [(ngModel)]="componentes.analisis" class="mini-slider" />
                <span class="comp-val">{{ componentes.analisis }}%</span>
              </div>
              <div class="comp-row">
                <span class="comp-lbl">5. Redacción de Capítulos del Manuscrito:</span>
                <input type="range" min="0" max="100" [(ngModel)]="componentes.redaccion" class="mini-slider" />
                <span class="comp-val">{{ componentes.redaccion }}%</span>
              </div>
            </div>
          }
        </div>

        <!-- Observaciones -->
        <div class="form-group">
          <label class="form-label">Observaciones y Recomendaciones del Comité</label>
          <textarea 
            rows="3" 
            [(ngModel)]="observaciones" 
            placeholder="Observaciones técnicas sobre el avance presentado..."
            class="form-textarea">
          </textarea>
        </div>

        <button 
          type="button" 
          class="btn-submit" 
          [disabled]="isSubmitting() || !selectedSemesterId"
          (click)="onSubmit()">
          @if (isSubmitting()) {
            <span>Guardando evaluación...</span>
          } @else {
            <span>Registrar Avance de Tesis</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .thesis-form-card {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 14px;
    }

    .header-icon {
      font-size: 1.5rem;
    }

    .form-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .form-subtitle {
      font-size: 0.775rem;
      color: var(--color-text-muted);
    }

    .form-body {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .form-select, .form-textarea {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
    }

    .slider-box {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .numeric-input-wrapper {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #FFFFFF;
      border: 1px solid var(--color-primary);
      padding: 4px 8px;
      border-radius: 6px;
    }

    .num-input {
      width: 48px;
      border: none;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-primary);
      text-align: right;
      outline: none;
    }

    .pct-symbol {
      font-weight: 700;
      color: var(--color-primary);
    }

    .slider-track-container {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .range-slider {
      width: 100%;
      accent-color: var(--color-primary);
      cursor: pointer;
    }

    .slider-ticks {
      display: flex;
      justify-content: space-between;
      font-size: 0.7rem;
      color: var(--color-text-light);
      font-weight: 600;
    }

    /* Accordion */
    .components-accordion {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      overflow: hidden;
    }

    .accordion-header {
      background-color: #FAFAFB;
      padding: 10px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .accordion-content {
      padding: 14px;
      background-color: #FFFFFF;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .comp-row {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.8rem;
    }

    .comp-lbl {
      flex: 2;
      color: var(--color-text-main);
      font-weight: 500;
    }

    .mini-slider {
      flex: 2;
      accent-color: var(--color-emphasis);
      cursor: pointer;
    }

    .comp-val {
      width: 40px;
      text-align: right;
      font-weight: 700;
      color: var(--color-emphasis);
    }

    .btn-submit {
      padding: 10px 20px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-submit:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert-success {
      background-color: var(--color-success-bg);
      border: 1px solid var(--color-success);
      color: var(--color-success);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
    }

    .alert-error {
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
    }
  `]
})
export class ThesisProgressFormComponent implements OnInit {
  @Input() student: Student | null = null;
  @Output() progressSaved = new EventEmitter<void>();

  private thesisService = inject(ThesisService);

  public selectedSemesterId: number | null = null;
  public porcentajeGlobal: number = 45;
  public observaciones: string = '';
  public isAccordionOpen: boolean = true;
  public isSubmitting = signal<boolean>(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  public componentes: ThesisComponents = {
    protocolo: 100,
    estado_arte: 80,
    marco_teorico: 50,
    metodologia: 30,
    analisis: 15,
    redaccion: 10
  };

  ngOnInit(): void {
    if (this.student?.semesters && this.student.semesters.length > 0) {
      const active = this.student.semesters.find(s => s.isActive) || this.student.semesters[0];
      this.selectedSemesterId = active.id;
    }
  }

  public toggleAccordion(): void {
    this.isAccordionOpen = !this.isAccordionOpen;
  }

  public onSubmit(): void {
    if (!this.student || !this.selectedSemesterId) return;

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.thesisService.registerProgress({
      student: this.student.id,
      semester: this.selectedSemesterId,
      porcentaje_avance: this.porcentajeGlobal,
      componentes_json: this.componentes,
      observaciones: this.observaciones
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Avance de tesis doctoral registrado exitosamente.');
        this.progressSaved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.porcentaje_avance?.[0] || 'Error al guardar avance.');
      }
    });
  }
}
