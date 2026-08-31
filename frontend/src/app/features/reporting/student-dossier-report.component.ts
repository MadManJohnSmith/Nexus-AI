import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { ReportingService } from '../../core/services/reporting.service';
import { FullDossierResponse } from '../../core/models/reporting.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-student-dossier-report',
  standalone: true,
  imports: [CommonModule, FormsModule, PillBadgeComponent],
  template: `
    <div class="report-wrapper">
      <!-- Barra de Acciones del Reporte (Oculta en Impresión) -->
      <div class="report-toolbar no-print">
        <div class="toolbar-info">
          <h2 class="toolbar-title">Cédula Oficial de Expediente Doctoral (HU-27)</h2>
          <p class="toolbar-subtitle">Formato institucional consolidado para auditorías académicas y acreditación Conahcyt.</p>
        </div>

        <div class="toolbar-actions">
          <button type="button" class="btn-tool btn-print" (click)="triggerPrint()">
            🖨️ Imprimir / Guardar PDF
          </button>
          <a [href]="getExportUrl('pdf')" target="_blank" class="btn-tool btn-download-pdf">
            📄 Descargar PDF Oficial
          </a>
          <a [href]="getExportUrl('xlsx')" target="_blank" class="btn-tool btn-download-excel">
            📊 Descargar Excel
          </a>
        </div>
      </div>

      <!-- Ficha Institucional del Expediente (Optimizada para @media print) -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Consolidando expediente completo...</p>
        </div>
      } @else if (dossier()) {
        <div class="dossier-sheet">
          <!-- Cabecera Institucional -->
          <header class="sheet-header">
            <div class="header-branding">
              <div class="logo-box">N.E.X.U.S.</div>
              <div class="header-titles">
                <h1 class="inst-name">SISTEMA INTEGRAL DE POSGRADO SUPERIOR</h1>
                <h2 class="doc-title">CÉDULA OFICIAL DE SEGUIMIENTO Y TRAYECTORIA DOCTORAL</h2>
              </div>
            </div>
            <div class="sheet-meta">
              <span><strong>Generado:</strong> {{ dossier()!.generatedAt }}</span>
              <span><strong>Estatus:</strong> {{ dossier()!.demographics.estatusActivo ? 'REGULAR / ACTIVO' : 'INACTIVO' }}</span>
            </div>
          </header>

          <!-- 1. Datos del Doctorando y Asesores -->
          <section class="sheet-section">
            <h3 class="section-title">1. DATOS GENERALES DEL DOCTORANDO</h3>
            <div class="data-grid-4">
              <div class="dg-item">
                <span class="dg-label">Nombre del Doctorando:</span>
                <span class="dg-val highlight">{{ dossier()!.demographics.nombreCompleto }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Matrícula:</span>
                <span class="dg-val bold">{{ dossier()!.demographics.matricula }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Programa Doctoral:</span>
                <span class="dg-val">{{ dossier()!.demographics.programaDoctoral }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Cohorte / Ingreso:</span>
                <span class="dg-val">{{ dossier()!.demographics.cohorte }} ({{ dossier()!.demographics.fechaIngreso }})</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Semestre Actual:</span>
                <span class="dg-val bold">Semestre {{ dossier()!.demographics.semestreActual }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Correo Electrónico:</span>
                <span class="dg-val">{{ dossier()!.demographics.email || 'No registrado' }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Director de Tesis (Asesor Principal):</span>
                <span class="dg-val highlight">{{ dossier()!.demographics.asesorPrincipal }}</span>
              </div>
              <div class="dg-item">
                <span class="dg-label">Coasesor Académico:</span>
                <span class="dg-val">{{ dossier()!.demographics.coasesor || 'No asignado' }}</span>
              </div>
            </div>
          </section>

          <!-- 2. Comité Tutoral -->
          <section class="sheet-section">
            <h3 class="section-title">2. COMITÉ TUTORAL ASIGNADO</h3>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Investigador / Asesor</th>
                  <th>Rol en el Comité</th>
                  <th>Correo Institucional</th>
                  <th>Fecha de Asignación</th>
                </tr>
              </thead>
              <tbody>
                @for (c of dossier()!.academicCommittee; track c.id) {
                  <tr>
                    <td><strong>{{ c.nombre }}</strong></td>
                    <td>{{ c.rolComiteDisplay }}</td>
                    <td>{{ c.email }}</td>
                    <td>{{ c.fechaAsignacion }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="4" class="empty-cell">Sin comité formal asignado.</td></tr>
                }
              </tbody>
            </table>
          </section>

          <!-- 3. Trayectoria de Tesis -->
          <section class="sheet-section">
            <h3 class="section-title">3. EVOLUCIÓN HISTÓRICA DEL AVANCE DE TESIS</h3>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Semestre</th>
                  <th>% Avance Global</th>
                  <th>Fecha Evaluación</th>
                  <th>Evaluó</th>
                  <th>Observaciones de Avance</th>
                </tr>
              </thead>
              <tbody>
                @for (th of dossier()!.thesisHistory; track th.id) {
                  <tr>
                    <td><strong>Semestre {{ th.semesterNumero }}</strong></td>
                    <td class="text-center bold">{{ th.porcentajeAvance }}%</td>
                    <td>{{ th.fechaRegistro }}</td>
                    <td>{{ th.registradoPor }}</td>
                    <td>{{ th.observaciones || 'Sin observaciones adicionales' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="5" class="empty-cell">Sin avances de tesis registrados en el expediente.</td></tr>
                }
              </tbody>
            </table>
          </section>

          <!-- 4. Sesiones de Tutoría -->
          <section class="sheet-section">
            <h3 class="section-title">4. SESIONES DE TUTORÍA Y SEGUIMIENTO ACADÉMICO</h3>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Sem</th>
                  <th>Fecha</th>
                  <th>Modalidad</th>
                  <th>Asesor / Registrador</th>
                  <th>Resumen de la Sesión</th>
                  <th>Próxima Reunión</th>
                </tr>
              </thead>
              <tbody>
                @for (t of dossier()!.tutorings; track t.id) {
                  <tr>
                    <td class="text-center">Sem {{ t.semesterNumero }}</td>
                    <td>{{ t.fechaSesion }}</td>
                    <td>{{ t.modalidad }}</td>
                    <td>{{ t.createdBy }}</td>
                    <td>{{ t.resumenGeneral }}</td>
                    <td>{{ t.proximaReunionFecha || 'N/A' }}</td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty-cell">No se han registrado sesiones de tutoría.</td></tr>
                }
              </tbody>
            </table>
          </section>

          <!-- 5. Acuerdos y Compromisos -->
          <section class="sheet-section">
            <h3 class="section-title">5. ESTADO DE ACUERDOS Y COMPROMISOS</h3>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Sem</th>
                  <th>Compromiso / Tarea</th>
                  <th>Responsable</th>
                  <th>Fecha Límite</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                @for (a of dossier()!.agreements; track a.id) {
                  <tr>
                    <td>#{{ a.id }}</td>
                    <td>Sem {{ a.semesterNumero || 'N/A' }}</td>
                    <td>{{ a.descripcion }}</td>
                    <td>{{ a.responsableNombre }}</td>
                    <td>{{ a.fechaLimite }}</td>
                    <td><strong>{{ a.estado }}</strong></td>
                  </tr>
                } @empty {
                  <tr><td colspan="6" class="empty-cell">Sin acuerdos registrados.</td></tr>
                }
              </tbody>
            </table>
          </section>

          <!-- 6. Producción Científica y Congresos -->
          <section class="sheet-section">
            <h3 class="section-title">6. PRODUCCIÓN CIENTÍFICA Y PONENCIAS</h3>
            <table class="sheet-table">
              <thead>
                <tr>
                  <th>Sem</th>
                  <th>Tipo</th>
                  <th>Título de la Contribución</th>
                  <th>Revista / Congreso / Editorial</th>
                  <th>Estado / Fecha</th>
                  <th>DOI / Enlace</th>
                </tr>
              </thead>
              <tbody>
                @for (p of dossier()!.publications; track p.id) {
                  <tr>
                    <td class="text-center">Sem {{ p.semesterNumero }}</td>
                    <td>{{ p.tipo }}</td>
                    <td><strong>{{ p.titulo }}</strong><br><small>{{ p.autores }}</small></td>
                    <td>{{ p.revistaEditorial }}</td>
                    <td>{{ p.estado }} ({{ p.fechaPublicacion || 'N/A' }})</td>
                    <td>{{ p.doiUrl || 'N/A' }}</td>
                  </tr>
                }
                @for (ev of dossier()!.academicEvents; track ev.id) {
                  <tr>
                    <td class="text-center">Sem {{ ev.semesterNumero }}</td>
                    <td>{{ ev.tipoEvento }}</td>
                    <td><strong>{{ ev.tituloPonencia }}</strong></td>
                    <td>{{ ev.nombreEvento }} ({{ ev.sedeLugar }})</td>
                    <td>PRESENTADO ({{ ev.fechaPresentacion }})</td>
                    <td>N/A</td>
                  </tr>
                }
                @if (dossier()!.publications.length === 0 && dossier()!.academicEvents.length === 0) {
                  <tr><td colspan="6" class="empty-cell">Sin productos científicos registrados.</td></tr>
                }
              </tbody>
            </table>
          </section>

          <!-- Firmas Institucionales para Impresión -->
          <footer class="sheet-signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <span class="sig-name">{{ dossier()!.demographics.nombreCompleto }}</span>
              <span class="sig-role">Firma del Doctorando</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span class="sig-name">{{ dossier()!.demographics.asesorPrincipal }}</span>
              <span class="sig-role">Director de Tesis (Asesor)</span>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <span class="sig-name">Coordinación de Posgrado</span>
              <span class="sig-role">Visto Bueno y Sello Oficial</span>
            </div>
          </footer>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-wrapper {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .report-toolbar {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow-sm);
    }

    .toolbar-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .toolbar-subtitle {
      font-size: 0.775rem;
      color: var(--color-text-muted);
    }

    .toolbar-actions {
      display: flex;
      gap: 10px;
    }

    .btn-tool {
      padding: 8px 14px;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-print {
      background: var(--color-emphasis);
      color: #FFFFFF;
      border: none;
    }

    .btn-download-pdf {
      background: var(--color-primary);
      color: #FFFFFF;
      border: none;
    }

    .btn-download-excel {
      background: #12B76A;
      color: #FFFFFF;
      border: none;
    }

    .btn-tool:hover {
      opacity: 0.9;
    }

    .dossier-sheet {
      background: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 40px;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }

    .sheet-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid var(--color-primary);
      padding-bottom: 16px;
    }

    .header-branding {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo-box {
      background: linear-gradient(135deg, var(--color-primary), var(--color-emphasis));
      color: #FFFFFF;
      font-weight: 800;
      font-size: 1.1rem;
      padding: 10px 14px;
      border-radius: 8px;
    }

    .inst-name {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-muted);
      letter-spacing: 0.05em;
    }

    .doc-title {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--color-emphasis);
      letter-spacing: -0.01em;
    }

    .sheet-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .sheet-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .section-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #E4E7EC;
      padding-bottom: 4px;
    }

    .data-grid-4 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px 24px;
      background: #F8F9FC;
      padding: 14px 18px;
      border-radius: 6px;
      border: 1px solid var(--color-border);
    }

    .dg-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .dg-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .dg-val {
      font-size: 0.85rem;
      color: var(--color-text-main);
    }

    .dg-val.highlight {
      color: var(--color-primary);
      font-weight: 700;
    }

    .dg-val.bold {
      font-weight: 700;
    }

    .sheet-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.775rem;
    }

    .sheet-table th {
      background: #F2F4F7;
      color: var(--color-text-main);
      font-weight: 700;
      padding: 8px 10px;
      text-align: left;
      border: 1px solid var(--color-border);
    }

    .sheet-table td {
      padding: 8px 10px;
      border: 1px solid var(--color-border);
      color: var(--color-text-main);
    }

    .empty-cell {
      text-align: center;
      color: var(--color-text-light);
      padding: 12px;
    }

    .text-center { text-align: center; }

    .sheet-signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      margin-top: 40px;
      padding-top: 20px;
    }

    .sig-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 4px;
    }

    .sig-line {
      width: 100%;
      border-top: 1px solid #333333;
      margin-bottom: 6px;
    }

    .sig-name {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .sig-role {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 16px;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E4E7EC;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* REGLAS CSS OBLIGATORIAS @media print (HU-27) */
    @media print {
      .no-print,
      .nexus-sidebar,
      .nexus-navbar,
      .report-toolbar {
        display: none !important;
      }

      body, html, .nexus-layout, .nexus-main-wrapper, .nexus-content-body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
      }

      .dossier-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }

      .sheet-table th, .sheet-table td {
        border-color: #999999 !important;
      }

      .sheet-signatures {
        page-break-inside: avoid;
      }
    }
  `]
})
export class StudentDossierReportComponent implements OnInit {
  private studentService = inject(StudentService);
  private reportingService = inject(ReportingService);

  public isLoading = signal<boolean>(true);
  public dossier = signal<FullDossierResponse | null>(null);
  public currentStudentId: number = 1;

  ngOnInit(): void {
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.currentStudentId = res.results[0].id;
          this.loadDossier(this.currentStudentId);
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => this.isLoading.set(false)
    });
  }

  public loadDossier(studentId: number): void {
    this.isLoading.set(true);
    this.reportingService.getFullDossier(studentId).subscribe({
      next: (data) => {
        this.dossier.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  public triggerPrint(): void {
    window.print();
  }

  public getExportUrl(format: 'pdf' | 'xlsx'): string {
    return this.reportingService.getExportUrl(this.currentStudentId, format);
  }
}
