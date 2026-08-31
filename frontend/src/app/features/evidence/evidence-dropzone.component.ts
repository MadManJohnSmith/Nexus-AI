import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvidenceService } from '../../core/services/evidence.service';
import { Student } from '../../core/models/student.models';
import { EvidenceType, EvidenceActivityType } from '../../core/models/evidence.models';

@Component({
  selector: 'nexus-evidence-dropzone',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="evidence-card">
      <div class="card-header">
        <span class="header-icon">📎</span>
        <div>
          <h3 class="card-title">Carga y Registro de Evidencias Documentales</h3>
          <p class="card-subtitle">Documentación probatoria, protocolos aprobados y enlaces a productos indexados</p>
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

      <div class="card-body">
        <!-- Switch de Tipo de Evidencia -->
        <div class="type-switch">
          <button 
            type="button" 
            class="switch-btn" 
            [class.active]="evidenceType === 'ARCHIVO_LOCAL'"
            (click)="evidenceType = 'ARCHIVO_LOCAL'">
            📁 Archivo Local (PDF / Imagen / ZIP / DOCX)
          </button>
          <button 
            type="button" 
            class="switch-btn" 
            [class.active]="evidenceType === 'ENLACE_DOI'"
            (click)="evidenceType = 'ENLACE_DOI'">
            🌐 Enlace Digital / DOI Indexado
          </button>
        </div>

        <div class="field-grid">
          <div class="form-group">
            <label class="form-label">Semestre Vinculado *</label>
            <select [(ngModel)]="selectedSemesterId" class="form-select">
              @for (s of student?.semesters || []; track s.id) {
                <option [value]="s.id">
                  Semestre {{ s.numero }} ({{ s.isActive ? 'Activo' : 'Concluido' }})
                </option>
              }
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo de Actividad *</label>
            <select [(ngModel)]="actividadTipo" class="form-select">
              <option value="TESIS">Avance de Tesis Doctoral</option>
              <option value="TUTORIA">Sesión de Tutoría</option>
              <option value="ACUERDO">Compromiso / Acuerdo</option>
              <option value="OTRO">Otro Producto Académico</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Título / Descripción de la Evidencia *</label>
          <input 
            type="text" 
            [(ngModel)]="descripcion" 
            placeholder="Ej. Protocolo_Doctoral_Aprobado_Comite.pdf"
            class="form-input" 
          />
        </div>

        <!-- Modo Archivo Local: Dropzone -->
        @if (evidenceType === 'ARCHIVO_LOCAL') {
          <div 
            class="dropzone-area" 
            [class.dragover]="isDragOver"
            (dragover)="onDragOver($event)"
            (dragleave)="isDragOver = false"
            (drop)="onDrop($event)"
            (click)="fileInput.click()">
            <input 
              #fileInput 
              type="file" 
              (change)="onFileSelected($event)" 
              accept=".pdf,.png,.jpg,.jpeg,.zip,.docx,.doc" 
              class="hidden-input" 
            />
            <span class="drop-icon">☁️</span>
            @if (selectedFile) {
              <div class="file-preview">
                <strong class="file-name">{{ selectedFile.name }}</strong>
                <span class="file-size">({{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB)</span>
              </div>
            } @else {
              <p class="drop-prompt">
                Arrastre y suelte su archivo aquí, o <span class="browse-link">explore su equipo</span>
              </p>
              <span class="drop-hint">Formatos soportados: PDF, PNG, JPG, ZIP, DOCX (Máx. 15 MB)</span>
            }
          </div>
        }

        <!-- Modo Enlace DOI -->
        @if (evidenceType === 'ENLACE_DOI') {
          <div class="form-group">
            <label class="form-label">URL o Identificador Digital DOI *</label>
            <input 
              type="url" 
              [(ngModel)]="urlDoi" 
              placeholder="https://doi.org/10.1145/XXXXXX o enlace web al repositorio..." 
              class="form-input" 
            />
          </div>
        }

        <button 
          type="button" 
          class="btn-upload" 
          [disabled]="isSubmitting() || !isFormValid()"
          (click)="onSubmit()">
          @if (isSubmitting()) {
            <span>Subiendo evidencia...</span>
          } @else {
            <span>Guardar Evidencia</span>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .evidence-card {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 14px;
    }

    .header-icon {
      font-size: 1.5rem;
    }

    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .card-subtitle {
      font-size: 0.775rem;
      color: var(--color-text-muted);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .type-switch {
      display: flex;
      background-color: #F2F4F7;
      border-radius: var(--radius-sm);
      padding: 4px;
      gap: 4px;
    }

    .switch-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .switch-btn.active {
      background-color: #FFFFFF;
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .field-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
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

    .form-input, .form-select {
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
    }

    /* Dropzone Area */
    .dropzone-area {
      border: 2px dashed #D0D5DD;
      border-radius: var(--radius-md);
      padding: 28px;
      text-align: center;
      background-color: #FAFAFB;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .dropzone-area:hover, .dropzone-area.dragover {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    .hidden-input {
      display: none;
    }

    .drop-icon {
      font-size: 2rem;
    }

    .drop-prompt {
      font-size: 0.85rem;
      color: var(--color-text-main);
      font-weight: 500;
    }

    .browse-link {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: underline;
    }

    .drop-hint {
      font-size: 0.725rem;
      color: var(--color-text-light);
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #FFFFFF;
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--color-primary);
    }

    .file-name {
      font-size: 0.825rem;
      color: var(--color-primary);
    }

    .file-size {
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .btn-upload {
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

    .btn-upload:hover:not(:disabled) {
      background-color: var(--color-primary-hover);
    }

    .btn-upload:disabled {
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
export class EvidenceDropzoneComponent implements OnInit {
  @Input() student: Student | null = null;
  @Output() evidenceSaved = new EventEmitter<void>();

  private evidenceService = inject(EvidenceService);

  public evidenceType: EvidenceType = 'ARCHIVO_LOCAL';
  public selectedSemesterId: number | null = null;
  public actividadTipo: EvidenceActivityType = 'TESIS';
  public descripcion: string = '';
  public urlDoi: string = '';
  public selectedFile: File | null = null;
  public isDragOver = false;

  public isSubmitting = signal<boolean>(false);
  public successMessage = signal<string | null>(null);
  public errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    if (this.student?.semesters && this.student.semesters.length > 0) {
      const active = this.student.semesters.find(s => s.isActive) || this.student.semesters[0];
      this.selectedSemesterId = active.id;
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    if (file.size > 15 * 1024 * 1024) {
      this.errorMessage.set('El archivo seleccionado supera el límite de 15 MB.');
      return;
    }
    this.selectedFile = file;
    if (!this.descripcion) {
      this.descripcion = file.name;
    }
  }

  public isFormValid(): boolean {
    if (!this.selectedSemesterId || !this.descripcion) return false;
    if (this.evidenceType === 'ARCHIVO_LOCAL') return !!this.selectedFile;
    if (this.evidenceType === 'ENLACE_DOI') return !!this.urlDoi;
    return false;
  }

  public onSubmit(): void {
    if (!this.student || !this.selectedSemesterId || !this.isFormValid()) return;

    this.isSubmitting.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    if (this.evidenceType === 'ARCHIVO_LOCAL' && this.selectedFile) {
      this.evidenceService.uploadFileEvidence({
        student: this.student.id,
        semester: this.selectedSemesterId,
        actividad_tipo: this.actividadTipo,
        file: this.selectedFile,
        descripcion: this.descripcion
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Archivo de evidencia subido y registrado exitosamente.');
          this.selectedFile = null;
          this.descripcion = '';
          this.evidenceSaved.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.archivo_adjunto?.[0] || 'Error al subir archivo.');
        }
      });
    } else if (this.evidenceType === 'ENLACE_DOI') {
      this.evidenceService.registerDoiEvidence({
        student: this.student.id,
        semester: this.selectedSemesterId,
        actividad_tipo: this.actividadTipo,
        url_doi: this.urlDoi,
        descripcion: this.descripcion
      }).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Enlace digital / DOI registrado exitosamente.');
          this.urlDoi = '';
          this.descripcion = '';
          this.evidenceSaved.emit();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.url_doi?.[0] || 'Error al registrar enlace DOI.');
        }
      });
    }
  }
}
