import { Component, Input, Output, EventEmitter, inject, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AgreementService } from '../../core/services/agreement.service';
import { AuthService } from '../../core/services/auth.service';
import { Agreement, AgreementState } from '../../core/models/agreement.models';
import { Student } from '../../core/models/student.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-agreement-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, PillBadgeComponent],
  template: `
    <div class="drawer-backdrop" (click)="onClose()">
      <aside class="drawer-container" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="drawer-header">
          <div class="header-info">
            <span class="header-icon">📝</span>
            <div>
              <h3 class="drawer-title">{{ isEditMode() ? 'Detalle y Estado de Acuerdo' : 'Nuevo Compromiso / Acuerdo' }}</h3>
              <p class="drawer-subtitle">Expediente: {{ student?.nombreCompleto }}</p>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="onClose()">✕</button>
        </div>

        @if (errorMessage()) {
          <div class="alert-error">
            <span>⚠️ {{ errorMessage() }}</span>
          </div>
        }

        <!-- Contenido del Drawer -->
        <div class="drawer-body">
          @if (isEditMode() && selectedAgreement) {
            <!-- Modo Edición y Transición de Estado -->
            <div class="edit-section">
              <div class="current-status-banner">
                <span class="status-lbl">Estado Actual:</span>
                <nexus-pill-badge [variant]="selectedAgreement.estado"></nexus-pill-badge>
              </div>

              <div class="info-group">
                <label class="info-label">Descripción:</label>
                <p class="info-text">{{ selectedAgreement.descripcion }}</p>
              </div>

              <div class="info-row">
                <div class="info-group">
                  <label class="info-label">Responsable:</label>
                  <p class="info-val">{{ selectedAgreement.responsableNombre }}</p>
                </div>
                <div class="info-group">
                  <label class="info-label">Fecha Límite:</label>
                  <p class="info-val" [class.overdue-text]="selectedAgreement.isOverdue">
                    {{ selectedAgreement.fechaLimite }} {{ selectedAgreement.isOverdue ? '(Vencido)' : '' }}
                  </p>
                </div>
              </div>

              <!-- Selector de Transición de Estado -->
              <div class="status-transition-box">
                <h4 class="box-title">Actualizar Ciclo de Vida:</h4>
                <div class="status-options">
                  <button 
                    type="button" 
                    class="status-btn btn-pend"
                    [class.active]="newStatus() === 'PENDIENTE'"
                    (click)="setNewStatus('PENDIENTE')">
                    Pendiente
                  </button>
                  <button 
                    type="button" 
                    class="status-btn btn-prog"
                    [class.active]="newStatus() === 'EN_PROCESO'"
                    (click)="setNewStatus('EN_PROCESO')">
                    En Proceso
                  </button>
                  <button 
                    type="button" 
                    class="status-btn btn-conc"
                    [class.active]="newStatus() === 'CONCLUIDO'"
                    [disabled]="authService.isStudent()"
                    [title]="authService.isStudent() ? 'Solo el Asesor o Coordinador pueden concluir acuerdos' : ''"
                    (click)="setNewStatus('CONCLUIDO')">
                    Concluido
                  </button>
                </div>

                <div class="comment-field">
                  <label class="info-label">Comentario o Motivo del Cambio:</label>
                  <input 
                    type="text" 
                    [(ngModel)]="statusComment" 
                    placeholder="Ej. Revisión y entrega completada satisfactoriamente"
                    class="form-input" 
                  />
                </div>

                <button 
                  type="button" 
                  class="btn-apply-status" 
                  [disabled]="!isStatusChanged() || isSubmitting()"
                  (click)="onUpdateStatus()">
                  @if (isSubmitting()) {
                    <span>Actualizando...</span>
                  } @else {
                    <span>Guardar Cambio de Estado</span>
                  }
                </button>
              </div>

              <!-- Historial de Auditoría (Audit Log) -->
              <div class="audit-trail">
                <h4 class="box-title">Historial de Transiciones:</h4>
                <div class="timeline-logs">
                  @for (log of selectedAgreement.auditLogs || []; track log.id) {
                    <div class="log-item">
                      <div class="log-dot"></div>
                      <div class="log-content">
                        <div class="log-header">
                          <span class="log-transition">{{ log.estadoAnterior }} ➔ {{ log.estadoNuevo }}</span>
                          <span class="log-date">{{ log.fechaCambio | date:'short' }}</span>
                        </div>
                        <p class="log-author">Por: <strong>{{ log.cambiadoPorNombre || 'Sistema' }}</strong></p>
                        @if (log.comentario) {
                          <p class="log-comment">"{{ log.comentario }}"</p>
                        }
                      </div>
                    </div>
                  } @empty {
                    <p class="empty-logs">Sin cambios registrados.</p>
                  }
                </div>
              </div>
            </div>
          } @else {
            <!-- Modo Creación de Nuevo Acuerdo -->
            <form [formGroup]="agreementForm" (ngSubmit)="onCreateAgreement()" class="create-form">
              <div class="form-group">
                <label class="form-label">Descripción del Compromiso / Tarea *</label>
                <textarea 
                  formControlName="descripcion" 
                  rows="3" 
                  placeholder="Ej. Redactar borrador del capítulo metodológico con experimentos..."
                  class="form-textarea">
                </textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Responsable Asignado *</label>
                <select formControlName="responsable" class="form-select">
                  <option [value]="null" disabled>Seleccionar Responsable</option>
                  @if (student?.user) {
                    <option [value]="student!.user">
                      {{ student!.nombreCompleto }} (Doctorando)
                    </option>
                  }
                  @for (m of student?.academicCommittee || []; track m.id) {
                    <option [value]="m.user">
                      {{ m.userNombre }} ({{ m.rolComiteDisplay }})
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Semestre Vinculado *</label>
                <select formControlName="semester" class="form-select">
                  <option [value]="null" disabled>Seleccionar Semestre</option>
                  @for (s of student?.semesters || []; track s.id) {
                    <option [value]="s.id">
                      Semestre {{ s.numero }} ({{ s.isActive ? 'Activo' : 'Concluido' }})
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha Límite de Cumplimiento *</label>
                <input type="date" formControlName="fecha_limite" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Estado Inicial</label>
                <select formControlName="estado" class="form-select">
                  <option value="PENDIENTE">PENDIENTE (Fondo #F6FCFE / #57949D)</option>
                  <option value="EN_PROCESO">EN PROCESO (Fondo #FEF8F3 / #B57136)</option>
                </select>
              </div>

              <button 
                type="submit" 
                class="btn-primary-full" 
                [disabled]="agreementForm.invalid || isSubmitting()">
                @if (isSubmitting()) {
                  <span>Registrando acuerdo...</span>
                } @else {
                  <span>Crear Compromiso / Acuerdo</span>
                }
              </button>
            </form>
          }
        </div>
      </aside>
    </div>
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(16, 24, 40, 0.5);
      backdrop-filter: blur(2px);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .drawer-container {
      width: 400px;
      min-width: 400px;
      height: 100vh;
      background-color: #FFFFFF;
      box-shadow: -4px 0 24px rgba(16, 24, 40, 0.15);
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.25s ease-out;
      border-left: 1px solid var(--color-border);
    }

    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }

    .drawer-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #F8F9FC;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-icon {
      font-size: 1.35rem;
    }

    .drawer-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .drawer-subtitle {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .drawer-body {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .alert-error {
      margin: 16px 24px 0;
      padding: 10px 12px;
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      font-size: 0.775rem;
      border-radius: var(--radius-sm);
    }

    .current-status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px;
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      margin-bottom: 16px;
    }

    .status-lbl {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .info-group {
      margin-bottom: 12px;
    }

    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      display: block;
      margin-bottom: 4px;
    }

    .info-text {
      font-size: 0.85rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
    }

    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .info-val {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .overdue-text {
      color: var(--color-danger);
    }

    .status-transition-box {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px;
      margin-top: 8px;
    }

    .box-title {
      font-size: 0.825rem;
      font-weight: 700;
      color: var(--color-emphasis);
      margin-bottom: 10px;
    }

    .status-options {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
    }

    .status-btn {
      flex: 1;
      border: 1px solid var(--color-border);
      background: #FFFFFF;
      padding: 6px 8px;
      font-size: 0.725rem;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .status-btn.btn-pend.active {
      background-color: #F6FCFE;
      color: #57949D;
      border-color: #57949D;
    }

    .status-btn.btn-prog.active {
      background-color: #FEF8F3;
      color: #B57136;
      border-color: #B57136;
    }

    .status-btn.btn-conc.active {
      background-color: #E9FEF1;
      color: #437E5C;
      border-color: #437E5C;
    }

    .status-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .comment-field {
      margin-bottom: 12px;
    }

    .btn-apply-status {
      width: 100%;
      padding: 8px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-apply-status:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Audit Trail */
    .audit-trail {
      margin-top: 16px;
    }

    .timeline-logs {
      display: flex;
      flex-direction: column;
      gap: 12px;
      border-left: 2px solid var(--color-border);
      padding-left: 14px;
      margin-left: 6px;
    }

    .log-item {
      position: relative;
    }

    .log-dot {
      position: absolute;
      left: -19px;
      top: 4px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-primary);
    }

    .log-content {
      font-size: 0.75rem;
    }

    .log-header {
      display: flex;
      justify-content: space-between;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .log-date {
      color: var(--color-text-light);
      font-size: 0.7rem;
    }

    .log-author {
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .log-comment {
      font-style: italic;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .empty-logs {
      font-size: 0.75rem;
      color: var(--color-text-light);
    }

    /* Create Form */
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
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

    .form-input, .form-select, .form-textarea {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
      transition: all 0.2s;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary);
      background-color: #FFFFFF;
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .btn-primary-full {
      width: 100%;
      padding: 10px 16px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
      transition: background-color 0.2s;
    }

    .btn-primary-full:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }

    .btn-primary-full:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class AgreementDrawerComponent implements OnChanges {
  @Input() student: Student | null = null;
  @Input() selectedAgreement: Agreement | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() agreementUpdated = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private agreementService = inject(AgreementService);
  public authService = inject(AuthService);

  public isEditMode = signal<boolean>(false);
  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  public newStatus = signal<AgreementState>('PENDIENTE');
  public statusComment: string = '';

  public agreementForm: FormGroup = this.fb.group({
    descripcion: ['', [Validators.required, Validators.minLength(5)]],
    responsable: [null, [Validators.required]],
    semester: [null, [Validators.required]],
    fecha_limite: [new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0], [Validators.required]],
    estado: ['PENDIENTE', [Validators.required]]
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedAgreement']) {
      if (this.selectedAgreement) {
        this.isEditMode.set(true);
        this.newStatus.set(this.selectedAgreement.estado);
        this.statusComment = '';
      } else {
        this.isEditMode.set(false);
        this.resetForm();
      }
    }
  }

  private resetForm(): void {
    const activeSem = this.student?.semesters?.find(s => s.isActive) || this.student?.semesters?.[0];
    this.agreementForm.reset({
      descripcion: '',
      responsable: this.student?.user || null,
      semester: activeSem ? activeSem.id : null,
      fecha_limite: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      estado: 'PENDIENTE'
    });
  }

  public setNewStatus(st: AgreementState): void {
    this.newStatus.set(st);
  }

  public isStatusChanged(): boolean {
    return !!this.selectedAgreement && this.newStatus() !== this.selectedAgreement.estado;
  }

  public onClose(): void {
    this.close.emit();
  }

  public onUpdateStatus(): void {
    if (!this.selectedAgreement) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.agreementService.updateStatus(
      this.selectedAgreement.id,
      this.newStatus(),
      this.statusComment
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.agreementUpdated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.estado?.[0] || err.error?.detail || 'Error al actualizar estado.');
      }
    });
  }

  public onCreateAgreement(): void {
    if (this.agreementForm.invalid || !this.student) {
      this.agreementForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const val = this.agreementForm.value;
    const payload = {
      student: this.student.id,
      semester: parseInt(val.semester, 10),
      descripcion: val.descripcion,
      responsable: parseInt(val.responsable, 10),
      fecha_limite: val.fecha_limite,
      estado: val.estado
    };

    this.agreementService.createAgreement(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.agreementUpdated.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.non_field_errors?.[0] || 'Error al crear acuerdo.');
      }
    });
  }
}
