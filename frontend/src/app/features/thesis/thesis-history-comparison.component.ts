import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThesisService } from '../../core/services/thesis.service';
import { ThesisHistoryResponse, SemesterThesisHistory } from '../../core/models/thesis.models';

@Component({
  selector: 'nexus-thesis-history-comparison',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="thesis-history-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Evolución Histórica de Tesis por Semestre (HU-16)</h3>
          <p class="card-subtitle">Comparativa longitudinal del porcentaje de avance reportado en cada semestre del doctorado.</p>
        </div>
      </div>

      <div class="card-body">
        @if (isLoading()) {
          <div class="loading-box">Cargando histórico...</div>
        } @else {
          <!-- Gráfica de Barras Horizontales Comparativas (Semestres 1 a 6) -->
          <div class="bars-container">
            @for (sem of historyData()?.semestersHistory || []; track sem.semesterNumero) {
              <div class="bar-row">
                <div class="sem-label">
                  <strong>Semestre {{ sem.semesterNumero }}</strong>
                  <span class="eval-date">{{ sem.hasData ? sem.fechaRegistro : 'Sin evaluar' }}</span>
                </div>

                <div class="bar-track">
                  <div 
                    class="bar-fill" 
                    [style.width.%]="sem.porcentajeAvance"
                    [class.bar-empty]="!sem.hasData"
                    [class.bar-complete]="sem.porcentajeAvance === 100">
                    <span class="bar-value-label">{{ sem.porcentajeAvance }}%</span>
                  </div>
                </div>

                <div class="bar-details-badge">
                  @if (sem.hasData) {
                    <span class="evaluator-tag">Evaluó: {{ sem.registradoPorNombre || 'Asesor' }}</span>
                  } @else {
                    <span class="pending-tag">Pendiente</span>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Resumen de Consistencia Longitudinal -->
          <div class="longitudinal-footer">
            <div class="footer-stat">
              <span class="stat-lbl">Avance Actual Consolidado:</span>
              <strong class="stat-val highlight">{{ getLatestProgress() }}%</strong>
            </div>
            <div class="footer-stat">
              <span class="stat-lbl">Semestres Evaluados:</span>
              <strong class="stat-val">{{ getEvaluatedSemestersCount() }} de 6</strong>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .thesis-history-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      padding: 20px;
      box-shadow: var(--shadow-sm);
    }

    .card-header {
      padding-bottom: 14px;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 20px;
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

    .bars-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 140px 1fr 160px;
      align-items: center;
      gap: 16px;
    }

    .sem-label {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sem-label strong {
      font-size: 0.85rem;
      color: var(--color-text-main);
    }

    .eval-date {
      font-size: 0.7rem;
      color: var(--color-text-light);
    }

    .bar-track {
      height: 26px;
      background-color: #F2F4F7;
      border-radius: 6px;
      overflow: hidden;
      position: relative;
      border: 1px solid var(--color-border);
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), #8B8DF7);
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      min-width: 32px;
    }

    .bar-fill.bar-empty {
      background: #E4E7EC;
      width: 0% !important;
      min-width: 0px;
    }

    .bar-fill.bar-complete {
      background: linear-gradient(90deg, #12B76A, #32D583);
    }

    .bar-value-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #FFFFFF;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    }

    .bar-details-badge {
      text-align: right;
    }

    .evaluator-tag {
      font-size: 0.725rem;
      font-weight: 600;
      color: var(--color-primary);
      background-color: var(--color-primary-light);
      padding: 3px 8px;
      border-radius: 4px;
    }

    .pending-tag {
      font-size: 0.725rem;
      color: var(--color-text-light);
      background-color: #F2F4F7;
      padding: 3px 8px;
      border-radius: 4px;
    }

    .longitudinal-footer {
      display: flex;
      gap: 32px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px dashed var(--color-border);
    }

    .footer-stat {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.825rem;
    }

    .stat-lbl {
      color: var(--color-text-muted);
    }

    .stat-val {
      font-weight: 700;
      color: var(--color-text-main);
    }

    .stat-val.highlight {
      color: var(--color-primary);
      font-size: 1rem;
    }

    .loading-box {
      text-align: center;
      padding: 30px;
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }
  `]
})
export class ThesisHistoryComparisonComponent implements OnInit, OnChanges {
  @Input() studentId: number | null = null;

  private thesisService = inject(ThesisService);
  public isLoading = signal<boolean>(false);
  public historyData = signal<ThesisHistoryResponse | null>(null);

  ngOnInit(): void {
    if (this.studentId) this.loadHistory();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] && this.studentId) {
      this.loadHistory();
    }
  }

  public loadHistory(): void {
    if (!this.studentId) return;
    this.isLoading.set(true);
    this.thesisService.getThesisHistory(this.studentId).subscribe({
      next: (res) => {
        this.historyData.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  public getLatestProgress(): number {
    const list = this.historyData()?.semestersHistory || [];
    const evaluated = list.filter(s => s.hasData);
    return evaluated.length > 0 ? evaluated[evaluated.length - 1].porcentajeAvance : 0;
  }

  public getEvaluatedSemestersCount(): number {
    const list = this.historyData()?.semestersHistory || [];
    return list.filter(s => s.hasData).length;
  }
}
