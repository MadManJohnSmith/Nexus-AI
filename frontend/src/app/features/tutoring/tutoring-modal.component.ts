import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TutoringService } from '../../core/services/tutoring.service';
import { Student, AcademicCommitteeMember } from '../../core/models/student.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'nexus-tutoring-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-backdrop" (click)="onClose()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-title-block">
            <span class="header-icon">📘</span>
            <div>
              <h2 class="modal-title">Registrar Sesión de Tutoría Doctoral</h2>
              <p class="modal-subtitle">Expediente: {{ student?.nombreCompleto }} ({{ student?.matricula }})</p>
            </div>
          </div>
          <button type="button" class="btn-close" (click)="onClose()">✕</button>
        </div>

        @if (errorMessage()) {
          <div class="alert-danger">
            <span>⚠️ {{ errorMessage() }}</span>
          </div>
        }

        <!-- Formulario 2 Columnas -->
        <form [formGroup]="tutoringForm" (ngSubmit)="onSubmit()" class="modal-body">
          <div class="two-column-grid">
            <!-- Columna 1: Datos Base de la Sesión -->
            <div class="form-col">
              <h3 class="col-heading">1. Parámetros de la Sesión</h3>
              
              <div class="form-group">
                <label class="form-label">Semestre Académico Asignado *</label>
                <select formControlName="semester" class="form-select">
                  <option [value]="null" disabled>Seleccionar Semestre</option>
                  @for (s of student?.semesters || []; track s.id) {
                    <option [value]="s.id">
                      Semestre {{ s.numero }} ({{ s.isActive ? 'En Curso Activo' : 'Concluido' }})
                    </option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha de la Tutoría *</label>
                <input type="date" formControlName="fecha_sesion" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Modalidad de la Reunión *</label>
                <div class="radio-cards-group">
                  <label class="radio-card" [class.selected]="tutoringForm.get('modalidad')?.value === 'PRESENCIAL'">
                    <input type="radio" value="PRESENCIAL" formControlName="modalidad" class="sr-only" />
                    <span class="card-icon">🏛️</span>
                    <span class="card-text">Presencial</span>
                  </label>
                  <label class="radio-card" [class.selected]="tutoringForm.get('modalidad')?.value === 'VIRTUAL'">
                    <input type="radio" value="VIRTUAL" formControlName="modalidad" class="sr-only" />
                    <span class="card-icon">💻</span>
                    <span class="card-text">Virtual</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Columna 2: Participantes y Próxima Reunión -->
            <div class="form-col">
              <h3 class="col-heading">2. Participantes del Comité y Compromisos</h3>

              <div class="form-group">
                <label class="form-label">Asistencia del Comité Tutoral:</label>
                <div class="committee-checklist">
                  @for (member of student?.academicCommittee || []; track member.id) {
                    <label class="checkbox-item">
                      <input 
                        type="checkbox" 
                        [checked]="isParticipantSelected(member.user)" 
                        (change)="toggleParticipant(member.user, member.rolComiteDisplay)" 
                      />
                      <span class="chk-name">{{ member.userNombre }}</span>
                      <span class="chk-role">({{ member.rolComiteDisplay }})</span>
                    </label>
                  } @empty {
                    <p class="empty-hint">No hay miembros registrados en el comité.</p>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Fecha Próxima Reunión (Compromiso)</label>
                <input type="date" formControlName="proxima_reunion_fecha" class="form-input" />
              </div>

              <div class="form-group">
                <label class="form-label">Objetivos para la Próxima Sesión</label>
                <input 
                  type="text" 
                  formControlName="proxima_reunion_notas" 
                  placeholder="Ej. Revisión final del capítulo 3 y resultados experimentales"
                  class="form-input" 
                />
              </div>
            </div>
          </div>

          <!-- Fila Completa: Resumen General y Observaciones -->
          <div class="full-width-section">
            <h3 class="col-heading">3. Resumen y Observaciones Académicas</h3>
            <div class="form-group">
              <label class="form-label">Resumen General de la Sesión *</label>
              <textarea 
                formControlName="resumen_general" 
                rows="3" 
                placeholder="Describa brevemente los puntos centrales abordados en la sesión de tutoría..."
                class="form-textarea">
              </textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Observaciones y Comentarios Académicos de Avance</label>
              <textarea 
                formControlName="observaciones_detalladas" 
                rows="3" 
                placeholder="Observaciones técnicas sobre el marco teórico, metodología o avance de tesis..."
                class="form-textarea">
              </textarea>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="modal-footer">
            <button type="button" class="btn-secondary" (click)="onClose()">Cancelar</button>
            <button type="submit" class="btn-primary" [disabled]="tutoringForm.invalid || isSubmitting()">
              @if (isSubmitting()) {
                <span>Guardando sesión...</span>
              } @else {
                <span>Registrar Sesión de Tutoría</span>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(16, 24, 40, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
    }

    .modal-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 860px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid var(--color-border);
      animation: modalSlide 0.2s ease-out;
    }

    @keyframes modalSlide {
      from { transform: translateY(16px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      padding: 20px 28px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: #F8F9FC;
    }

    .header-title-block {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      font-size: 1.5rem;
    }

    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .modal-subtitle {
      font-size: 0.8rem;
      color: var(--color-text-muted);
    }

    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.25rem;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .modal-body {
      padding: 24px 28px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .two-column-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .form-col {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .col-heading {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-emphasis);
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 6px;
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

    .radio-cards-group {
      display: flex;
      gap: 10px;
    }

    .radio-card {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background-color: #FAFAFB;
      cursor: pointer;
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-muted);
      transition: all 0.2s;
    }

    .radio-card.selected {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
      color: var(--color-primary);
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      border: 0;
    }

    .committee-checklist {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 10px;
      max-height: 140px;
      overflow-y: auto;
    }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--color-text-main);
      cursor: pointer;
    }

    .chk-name {
      font-weight: 600;
    }

    .chk-role {
      font-size: 0.725rem;
      color: var(--color-text-muted);
    }

    .full-width-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--color-border);
    }

    .modal-footer {
      padding: 16px 28px;
      border-top: 1px solid var(--color-border);
      background-color: #F8F9FC;
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn-secondary {
      padding: 8px 16px;
      border: 1px solid var(--color-border);
      background: #FFFFFF;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
    }

    .btn-primary {
      padding: 8px 20px;
      border: none;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert-danger {
      margin: 16px 28px 0;
      padding: 10px 14px;
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger);
      color: var(--color-danger);
      font-size: 0.8rem;
      border-radius: var(--radius-sm);
    }
  `]
})
export class TutoringModalComponent implements OnInit {
  @Input() student: Student | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() sessionSaved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private tutoringService = inject(TutoringService);
  private authService = inject(AuthService);

  public isSubmitting = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);
  public selectedParticipants: { user: number; rol_en_sesion: string; asistencia_confirmada: boolean }[] = [];

  public tutoringForm: FormGroup = this.fb.group({
    semester: [null, [Validators.required]],
    fecha_sesion: [new Date().toISOString().split('T')[0], [Validators.required]],
    modalidad: ['PRESENCIAL', [Validators.required]],
    proxima_reunion_fecha: [''],
    proxima_reunion_notas: [''],
    resumen_general: ['', [Validators.required, Validators.minLength(10)]],
    observaciones_detalladas: ['']
  });

  ngOnInit(): void {
    if (this.student && this.student.semesters && this.student.semesters.length > 0) {
      const activeSem = this.student.semesters.find(s => s.isActive) || this.student.semesters[0];
      this.tutoringForm.patchValue({ semester: activeSem.id });
    }

    // Pre-seleccionar todos los miembros del comite tutoral por defecto
    if (this.student?.academicCommittee) {
      this.selectedParticipants = this.student.academicCommittee.map(m => ({
        user: m.user,
        rol_en_sesion: m.rolComiteDisplay,
        asistencia_confirmada: true
      }));
    }
  }

  public isParticipantSelected(userId: number): boolean {
    return this.selectedParticipants.some(p => p.user === userId && p.asistencia_confirmada);
  }

  public toggleParticipant(userId: number, roleName: string): void {
    const idx = this.selectedParticipants.findIndex(p => p.user === userId);
    if (idx >= 0) {
      this.selectedParticipants[idx].asistencia_confirmada = !this.selectedParticipants[idx].asistencia_confirmada;
    } else {
      this.selectedParticipants.push({
        user: userId,
        rol_en_sesion: roleName,
        asistencia_confirmada: true
      });
    }
  }

  public onClose(): void {
    this.close.emit();
  }

  public onSubmit(): void {
    if (this.tutoringForm.invalid || !this.student) {
      this.tutoringForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formVal = this.tutoringForm.value;
    const currentUserId = this.authService.currentUser()?.id || 1;

    const observations = formVal.observaciones_detalladas ? [{
      autor: currentUserId,
      tema_revisado: 'Revisión General de Avance Doctoral',
      observaciones_detalladas: formVal.observaciones_detalladas
    }] : [];

    const payload = {
      student: this.student.id,
      semester: parseInt(formVal.semester, 10),
      fecha_sesion: formVal.fecha_sesion,
      modalidad: formVal.modalidad,
      resumen_general: formVal.resumen_general,
      proxima_reunion_fecha: formVal.proxima_reunion_fecha || null,
      proxima_reunion_notas: formVal.proxima_reunion_notas || '',
      participants: this.selectedParticipants.filter(p => p.asistencia_confirmada),
      observations: observations
    };

    this.tutoringService.createSession(payload).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.sessionSaved.emit();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.detail || err.error?.non_field_errors?.[0] || 'Error al registrar sesión.');
      }
    });
  }
}
