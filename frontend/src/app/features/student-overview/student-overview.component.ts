import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { TutoringService } from '../../core/services/tutoring.service';
import { AgreementService } from '../../core/services/agreement.service';
import { AuthService } from '../../core/services/auth.service';
import { Student } from '../../core/models/student.models';
import { TutoringSession } from '../../core/models/tutoring.models';
import { Agreement } from '../../core/models/agreement.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';
import { TutoringModalComponent } from '../tutoring/tutoring-modal.component';
import { AgreementDrawerComponent } from '../agreements/agreement-drawer.component';

export type TabType = 'resumen' | 'semestres' | 'tutorias' | 'acuerdos' | 'tesis' | 'evidencias';

@Component({
  selector: 'nexus-student-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, PillBadgeComponent, TutoringModalComponent, AgreementDrawerComponent],
  template: `
    <div class="expediente-container">
      <!-- Loading State -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando expediente longitudinal...</p>
        </div>
      } @else if (currentStudent()) {
        <!-- Header de Resumen del Estudiante -->
        <header class="student-header-card">
          <div class="header-main-info">
            <div class="student-avatar-badge">
              {{ getInitials(currentStudent()!.nombreCompleto) }}
            </div>
            <div class="student-identity">
              <div class="identity-top">
                <h2 class="student-name">{{ currentStudent()!.nombreCompleto }}</h2>
                <nexus-pill-badge 
                  [variant]="currentStudent()!.estatusActivo ? 'ACTIVO' : 'INACTIVO'" 
                  [label]="currentStudent()!.estatusActivo ? 'Expediente Activo' : 'Inactivo'">
                </nexus-pill-badge>
              </div>
              <p class="student-program">{{ currentStudent()!.programaDoctoral }}</p>
              <div class="student-meta-badges">
                <span class="meta-item">
                  <span class="meta-label">Matrícula:</span>
                  <strong>{{ currentStudent()!.matricula }}</strong>
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <span class="meta-label">Cohorte:</span>
                  <strong>{{ currentStudent()!.cohorte }}</strong>
                </span>
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <span class="meta-label">Semestre Actual:</span>
                  <span class="semester-pill">Semestre {{ currentStudent()!.semestreActual }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions in Header -->
          <div class="header-actions">
            @if (authService.isCoordinator() || authService.isAdvisor()) {
              <button type="button" class="btn-action-primary" (click)="showTutoringModal = true">
                <span class="btn-icon">📘</span> + Registrar Tutoría
              </button>
              <button type="button" class="btn-action-secondary" (click)="openCreateAgreementDrawer()">
                <span class="btn-icon">📝</span> + Nuevo Acuerdo
              </button>
            }
          </div>
        </header>

        <!-- Tabs de Navegación Longitudinal -->
        <div class="tabs-bar">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'resumen'"
            (click)="selectTab('resumen')">
            <span class="tab-icon">📋</span>
            <span>Resumen General</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'tutorias'"
            (click)="selectTab('tutorias')">
            <span class="tab-icon">📘</span>
            <span>Sesiones de Tutoría ({{ tutoringSessions().length }})</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'acuerdos'"
            (click)="selectTab('acuerdos')">
            <span class="tab-icon">📝</span>
            <span>Acuerdos y Compromisos ({{ agreementsList().length }})</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'semestres'"
            (click)="selectTab('semestres')">
            <span class="tab-icon">📅</span>
            <span>Semestres 1 a 6</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'tesis'"
            (click)="selectTab('tesis')">
            <span class="tab-icon">📊</span>
            <span>Tesis Doctoral</span>
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'evidencias'"
            (click)="selectTab('evidencias')">
            <span class="tab-icon">📎</span>
            <span>Evidencias</span>
          </button>
        </div>

        <!-- Grid Modular 70/30 -->
        <div class="modular-grid">
          <!-- Columna Principal 70% -->
          <div class="main-column-70">
            @if (activeTab() === 'resumen') {
              <!-- Resumen Trayectoria -->
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Trayectoria y Avances del Posgrado</h3>
                  <span class="badge-tag">Semestre Activo: {{ currentStudent()!.semestreActual }}</span>
                </div>
                <div class="card-body">
                  <div class="summary-keyvalues">
                    <div class="kv-item">
                      <span class="kv-label">Asesor Principal de Tesis:</span>
                      <span class="kv-value primary-highlight">{{ currentStudent()!.asesorPrincipal }}</span>
                    </div>
                    <div class="kv-item">
                      <span class="kv-label">Coasesor Académico:</span>
                      <span class="kv-value">{{ currentStudent()!.coasesor }}</span>
                    </div>
                    <div class="kv-item">
                      <span class="kv-label">Línea de Generación y Aplicación del Conocimiento (LGAC):</span>
                      <span class="kv-value">Sistemas Inteligentes e Ingeniería de Software Avanzada</span>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Módulo de Acuerdos Activos -->
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Compromisos Recientes del Estudiante</h3>
                  <span class="card-action-link" (click)="selectTab('acuerdos')">Ver todos los acuerdos ➔</span>
                </div>
                <div class="card-body">
                  <div class="agreements-table-wrapper">
                    <table class="nexus-table">
                      <thead>
                        <tr>
                          <th>Compromiso / Tarea</th>
                          <th>Responsable</th>
                          <th>Fecha Límite</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (agr of agreementsList(); track agr.id) {
                          <tr class="clickable-tr" (click)="openEditAgreementDrawer(agr)">
                            <td><strong>{{ agr.descripcion }}</strong></td>
                            <td>{{ agr.responsableNombre }}</td>
                            <td [class.overdue-date]="agr.isOverdue">{{ agr.fechaLimite }}</td>
                            <td><nexus-pill-badge [variant]="agr.estado"></nexus-pill-badge></td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="4" class="empty-hint">No hay acuerdos registrados aún.</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            }

            @if (activeTab() === 'tutorias') {
              <!-- Listado de Tutorías -->
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Historial de Sesiones de Tutoría</h3>
                  @if (authService.isCoordinator() || authService.isAdvisor()) {
                    <button type="button" class="btn-sm-primary" (click)="showTutoringModal = true">
                      + Nueva Sesión
                    </button>
                  }
                </div>
                <div class="card-body">
                  <div class="sessions-timeline">
                    @for (s of tutoringSessions(); track s.id) {
                      <div class="session-card">
                        <div class="session-header">
                          <div class="session-badge-date">
                            <span class="session-date-icon">📅</span>
                            <strong>{{ s.fechaSesion }}</strong>
                            <span class="modalidad-pill">{{ s.modalidad }}</span>
                            <span class="sem-tag">Semestre {{ s.semesterNumero }}</span>
                          </div>
                          <span class="session-author">Registrado por: {{ s.createdByNombre || 'Asesor' }}</span>
                        </div>
                        <p class="session-summary">{{ s.resumenGeneral }}</p>

                        @if (s.observations && s.observations.length > 0) {
                          <div class="session-observations">
                            <div class="obs-title">Observaciones de Avance:</div>
                            @for (obs of s.observations; track obs.id) {
                              <div class="obs-item">
                                <span class="obs-bullet">•</span>
                                <div>
                                  <strong>{{ obs.temaRevisado }}:</strong> {{ obs.observacionesDetalladas }}
                                </div>
                              </div>
                            }
                          </div>
                        }

                        @if (s.proximaReunionFecha) {
                          <div class="next-meeting-box">
                            <span class="meeting-icon">⏰</span>
                            <span>Próxima reunión programada para el <strong>{{ s.proximaReunionFecha }}</strong> ({{ s.proximaReunionNotas || 'Sin notas' }})</span>
                          </div>
                        }
                      </div>
                    } @empty {
                      <div class="empty-state">
                        <p>No se han registrado sesiones de tutoría en el expediente.</p>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }

            @if (activeTab() === 'acuerdos') {
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Todos los Acuerdos del Expediente</h3>
                  @if (authService.isCoordinator() || authService.isAdvisor()) {
                    <button type="button" class="btn-sm-primary" (click)="openCreateAgreementDrawer()">
                      + Nuevo Acuerdo
                    </button>
                  }
                </div>
                <div class="card-body">
                  <div class="agreements-table-wrapper">
                    <table class="nexus-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Compromiso</th>
                          <th>Responsable</th>
                          <th>Fecha Límite</th>
                          <th>Estado</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (agr of agreementsList(); track agr.id) {
                          <tr class="clickable-tr" (click)="openEditAgreementDrawer(agr)">
                            <td>#{{ agr.id }}</td>
                            <td><strong>{{ agr.descripcion }}</strong></td>
                            <td>{{ agr.responsableNombre }}</td>
                            <td [class.overdue-date]="agr.isOverdue">{{ agr.fechaLimite }}</td>
                            <td><nexus-pill-badge [variant]="agr.estado"></nexus-pill-badge></td>
                            <td><button type="button" class="btn-quick-edit">Gestionar</button></td>
                          </tr>
                        } @empty {
                          <tr>
                            <td colspan="6" class="empty-hint">Sin acuerdos registrados.</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            }

            @if (activeTab() === 'semestres') {
              <!-- Selector de Semestres 1 a 6 -->
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Gestión de Semestres (1 al 6)</h3>
                  @if (authService.isCoordinator()) {
                    <button type="button" class="btn-sm-primary" (click)="openSemesterModal()">
                      + Registrar Semestre
                    </button>
                  }
                </div>
                <div class="card-body">
                  <div class="semester-stepper">
                    @for (num of [1, 2, 3, 4, 5, 6]; track num) {
                      <button 
                        type="button" 
                        class="stepper-step" 
                        [class.active]="selectedSemesterNum() === num"
                        [class.registered]="isSemesterRegistered(num)"
                        (click)="selectSemester(num)">
                        <span class="step-num">{{ num }}</span>
                        <span class="step-title">Semestre {{ num }}</span>
                        <span class="step-status">
                          {{ isSemesterRegistered(num) ? 'Registrado' : 'Pendiente' }}
                        </span>
                      </button>
                    }
                  </div>

                  <div class="semester-detail-panel">
                    @if (selectedSemesterData()) {
                      <div class="semester-meta-info">
                        <div class="meta-block">
                          <span class="meta-lbl">Periodo Lectivo:</span>
                          <span class="meta-val">{{ selectedSemesterData()!.fechaInicio }} al {{ selectedSemesterData()!.fechaFin }}</span>
                        </div>
                        <div class="meta-block">
                          <span class="meta-lbl">Estatus de Cursado:</span>
                          <nexus-pill-badge 
                            [variant]="selectedSemesterData()!.isActive ? 'ACTIVO' : 'CONCLUIDO'" 
                            [label]="selectedSemesterData()!.isActive ? 'En Curso Activo' : 'Concluido'">
                          </nexus-pill-badge>
                        </div>
                      </div>
                    } @else {
                      <div class="empty-semester-state">
                        <p>El Semestre {{ selectedSemesterNum() }} aún no ha sido dado de alta.</p>
                      </div>
                    }
                  </div>
                </div>
              </section>
            }

            @if (activeTab() === 'tesis') {
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Avance de Proyecto de Tesis Doctoral</h3>
                  <nexus-pill-badge variant="EN_PROCESO" label="En Desarrollo"></nexus-pill-badge>
                </div>
                <div class="card-body">
                  <p class="section-desc">
                    Título: <strong>"Arquitectura de Agentes Inteligentes Autónomos para la Trazabilidad Longitudinal en Posgrados de Alto Impacto"</strong>
                  </p>
                </div>
              </section>
            }

            @if (activeTab() === 'evidencias') {
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Repositorio de Evidencias</h3>
                </div>
                <div class="card-body">
                  <p class="empty-hint">El módulo especializado de evidencias se completará en el Sprint 3.</p>
                </div>
              </section>
            }
          </div>

          <!-- Columna Lateral 30% (Comité Tutoral y Widget de Acuerdos) -->
          <aside class="sidebar-column-30">
            <!-- Widget de Acuerdos con Contador y Alertas -->
            <div class="widget-card widget-agreements">
              <div class="widget-header">
                <h3 class="widget-title">Resumen de Compromisos</h3>
                @if (overdueCount() > 0) {
                  <span class="badge-alert-overdue">⚠️ {{ overdueCount() }} Vencidos</span>
                }
              </div>
              <div class="widget-stats-row">
                <div class="widget-stat">
                  <span class="w-num">{{ pendingCount() }}</span>
                  <span class="w-lbl">Pendientes</span>
                </div>
                <div class="widget-stat">
                  <span class="w-num">{{ inProgressCount() }}</span>
                  <span class="w-lbl">En Proceso</span>
                </div>
                <div class="widget-stat">
                  <span class="w-num">{{ completedCount() }}</span>
                  <span class="w-lbl">Concluidos</span>
                </div>
              </div>
              <button type="button" class="btn-widget-action" (click)="openCreateAgreementDrawer()">
                + Asignar Acuerdo Rápido
              </button>
            </div>

            <!-- Ficha del Comité Tutoral -->
            <div class="committee-card">
              <div class="committee-card-header">
                <h3 class="committee-title">Comité Tutoral y Asesores</h3>
              </div>

              <div class="committee-members-list">
                @for (member of committeeList(); track member.id) {
                  <div class="committee-member-item">
                    <div class="member-avatar">
                      {{ (member.userNombre || 'A')[0] }}
                    </div>
                    <div class="member-info">
                      <div class="member-name">{{ member.userNombre }}</div>
                      <div class="member-email">{{ member.userEmail }}</div>
                      <div class="member-badge-row">
                        <nexus-pill-badge [variant]="member.rolComite" [label]="member.rolComiteDisplay"></nexus-pill-badge>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </aside>
        </div>
      }

      <!-- Modal de Registro de Tutoría (2 Columnas) -->
      @if (showTutoringModal) {
        <nexus-tutoring-modal
          [student]="currentStudent()"
          (close)="showTutoringModal = false"
          (sessionSaved)="onTutoringSaved()">
        </nexus-tutoring-modal>
      }

      <!-- Drawer Lateral Derecho (400px) -->
      @if (showAgreementDrawer) {
        <nexus-agreement-drawer
          [student]="currentStudent()"
          [selectedAgreement]="selectedAgreementToEdit"
          (close)="showAgreementDrawer = false"
          (agreementUpdated)="onAgreementUpdated()">
        </nexus-agreement-drawer>
      }
    </div>
  `,
  styles: [`
    .expediente-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 16px;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #E4E7EC;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .student-header-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-lg);
      border: 1px solid var(--color-border);
      padding: 24px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      box-shadow: var(--shadow-sm);
    }

    .header-main-info {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .student-avatar-badge {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-emphasis));
      color: #FFFFFF;
      font-size: 1.5rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 12px rgba(99, 101, 239, 0.2);
    }

    .student-identity {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .identity-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-name {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-main);
      letter-spacing: -0.01em;
    }

    .student-program {
      font-size: 0.875rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .student-meta-badges {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      color: var(--color-text-muted);
      margin-top: 4px;
    }

    .meta-divider {
      color: var(--color-text-light);
    }

    .semester-pill {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .btn-action-primary {
      padding: 9px 16px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background-color 0.2s;
    }

    .btn-action-primary:hover {
      background-color: var(--color-primary-hover);
    }

    .btn-action-secondary {
      padding: 9px 16px;
      background-color: #FFFFFF;
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-action-secondary:hover {
      background-color: var(--color-primary-light);
    }

    /* Tabs Bar */
    .tabs-bar {
      display: flex;
      gap: 8px;
      border-bottom: 2px solid var(--color-border);
      padding-bottom: 2px;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: none;
      padding: 10px 18px;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-text-muted);
      cursor: pointer;
      border-radius: var(--radius-sm) var(--radius-sm) 0 0;
      transition: all 0.2s;
      position: relative;
    }

    .tab-btn:hover, .tab-btn.active {
      color: var(--color-primary);
      background-color: #FFFFFF;
    }

    .tab-btn.active::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      right: 0;
      height: 3px;
      background-color: var(--color-primary);
      border-radius: 3px 3px 0 0;
    }

    /* Modular Grid 70/30 */
    .modular-grid {
      display: grid;
      grid-template-columns: 7fr 3fr;
      gap: 24px;
    }

    .main-column-70 {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sidebar-column-30 {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .content-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header-row {
      padding: 16px 20px;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .badge-tag {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary);
      background-color: var(--color-primary-light);
      padding: 3px 8px;
      border-radius: 4px;
    }

    .card-action-link {
      font-size: 0.8rem;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
    }

    .card-body {
      padding: 20px;
    }

    .summary-keyvalues {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .kv-item {
      display: flex;
      justify-content: space-between;
      padding-bottom: 10px;
      border-bottom: 1px dashed var(--color-border);
    }

    .kv-label {
      font-size: 0.85rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .kv-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .primary-highlight {
      color: var(--color-primary);
    }

    /* Agreements Table */
    .nexus-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.825rem;
    }

    .nexus-table th {
      padding: 10px 12px;
      background-color: #F8F9FC;
      color: var(--color-text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
    }

    .nexus-table td {
      padding: 12px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-main);
    }

    .clickable-tr {
      cursor: pointer;
    }

    .clickable-tr:hover {
      background-color: #F8FAFC;
    }

    .overdue-date {
      color: var(--color-danger);
      font-weight: 700;
    }

    .btn-quick-edit {
      background: transparent;
      border: 1px solid var(--color-border);
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.725rem;
      color: var(--color-primary);
      font-weight: 600;
      cursor: pointer;
    }

    /* Sessions Timeline */
    .sessions-timeline {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .session-card {
      background-color: #FAFAFB;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .session-badge-date {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
    }

    .modalidad-pill {
      background-color: #F2F4F7;
      color: var(--color-text-muted);
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .sem-tag {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .session-author {
      font-size: 0.75rem;
      color: var(--color-text-light);
    }

    .session-summary {
      font-size: 0.85rem;
      color: var(--color-text-main);
      line-height: 1.4;
    }

    .session-observations {
      background-color: #FFFFFF;
      border-radius: 6px;
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      font-size: 0.8rem;
    }

    .obs-title {
      font-weight: 700;
      color: var(--color-emphasis);
      margin-bottom: 6px;
    }

    .obs-item {
      display: flex;
      gap: 6px;
      margin-bottom: 4px;
    }

    .next-meeting-box {
      display: flex;
      align-items: center;
      gap: 6px;
      background-color: #F6FCFE;
      border: 1px solid #57949D;
      color: #155E75;
      padding: 6px 10px;
      border-radius: 4px;
      font-size: 0.775rem;
    }

    /* Widget de Acuerdos Lateral */
    .widget-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: 20px;
    }

    .widget-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .widget-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .badge-alert-overdue {
      background-color: #F8F1FF;
      color: #A14D98;
      border: 1px solid #A14D98;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .widget-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }

    .widget-stat {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 10px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .w-num {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--color-emphasis);
    }

    .w-lbl {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .btn-widget-action {
      width: 100%;
      padding: 8px;
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      border: 1px solid var(--color-primary);
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-widget-action:hover {
      background-color: var(--color-primary);
      color: #FFFFFF;
    }

    /* Committee Sidebar Card */
    .committee-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      padding: 20px;
    }

    .committee-card-header {
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .committee-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .committee-members-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .committee-member-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      background-color: #F8F9FC;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .member-avatar {
      width: 38px;
      height: 38px;
      border-radius: 8px;
      background-color: var(--color-emphasis);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .member-name {
      font-size: 0.825rem;
      font-weight: 600;
      color: var(--color-text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-email {
      font-size: 0.725rem;
      color: var(--color-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .semester-stepper {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }

    .stepper-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 6px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background-color: #FAFAFB;
      cursor: pointer;
      transition: all 0.2s;
    }

    .stepper-step.active {
      border-color: var(--color-primary);
      background-color: var(--color-primary-light);
    }

    .step-num {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .stepper-step.active .step-num {
      color: var(--color-primary);
    }

    .step-title {
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .step-status {
      font-size: 0.65rem;
      color: var(--color-text-light);
      margin-top: 4px;
    }

    .semester-detail-panel {
      background-color: #F8F9FC;
      border-radius: var(--radius-sm);
      padding: 16px;
      border: 1px solid var(--color-border);
    }

    .semester-meta-info {
      display: flex;
      gap: 32px;
    }

    .meta-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-lbl {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .meta-val {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-main);
    }

    .empty-hint, .empty-state, .empty-semester-state {
      font-size: 0.825rem;
      color: var(--color-text-muted);
      text-align: center;
      padding: 20px;
    }

    .btn-sm-primary {
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class StudentOverviewComponent implements OnInit {
  private studentService = inject(StudentService);
  private tutoringService = inject(TutoringService);
  private agreementService = inject(AgreementService);
  public authService = inject(AuthService);

  public isLoading = signal<boolean>(true);
  public currentStudent = signal<Student | null>(null);
  public tutoringSessions = signal<TutoringSession[]>([]);
  public agreementsList = signal<Agreement[]>([]);
  public activeTab = signal<TabType>('resumen');
  public selectedSemesterNum = signal<number>(1);

  // Modals & Drawers State
  public showTutoringModal = false;
  public showAgreementDrawer = false;
  public selectedAgreementToEdit: Agreement | null = null;

  public committeeList = computed(() => {
    return this.currentStudent()?.academicCommittee || [];
  });

  public selectedSemesterData = computed(() => {
    const sems = this.currentStudent()?.semesters || [];
    return sems.find(s => s.numero === this.selectedSemesterNum()) || null;
  });

  public pendingCount = computed(() => this.agreementsList().filter(a => a.estado === 'PENDIENTE').length);
  public inProgressCount = computed(() => this.agreementsList().filter(a => a.estado === 'EN_PROCESO').length);
  public completedCount = computed(() => this.agreementsList().filter(a => a.estado === 'CONCLUIDO').length);
  public overdueCount = computed(() => this.agreementsList().filter(a => a.isOverdue || a.estado === 'VENCIDO').length);

  ngOnInit(): void {
    this.loadExpediente();
  }

  public loadExpediente(): void {
    this.isLoading.set(true);
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          const studentId = res.results[0].id;
          this.studentService.getStudentById(studentId).subscribe({
            next: (detailed) => {
              this.currentStudent.set(detailed);
              this.selectedSemesterNum.set(detailed.semestreActual);
              this.loadTutoringAndAgreements(studentId);
            },
            error: () => {
              this.currentStudent.set(res.results[0]);
              this.loadTutoringAndAgreements(studentId);
            }
          });
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public loadTutoringAndAgreements(studentId: number): void {
    this.tutoringService.getSessions(studentId).subscribe({
      next: (sessRes) => this.tutoringSessions.set(sessRes.results)
    });

    this.agreementService.getAgreements({ student: studentId }).subscribe({
      next: (agrRes) => {
        this.agreementsList.set(agrRes.results);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public selectTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  public selectSemester(num: number): void {
    this.selectedSemesterNum.set(num);
  }

  public isSemesterRegistered(num: number): boolean {
    const sems = this.currentStudent()?.semesters || [];
    return sems.some(s => s.numero === num);
  }

  public getInitials(name: string): string {
    if (!name) return 'EX';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  public openCreateAgreementDrawer(): void {
    this.selectedAgreementToEdit = null;
    this.showAgreementDrawer = true;
  }

  public openEditAgreementDrawer(agr: Agreement): void {
    this.selectedAgreementToEdit = agr;
    this.showAgreementDrawer = true;
  }

  public onTutoringSaved(): void {
    this.showTutoringModal = false;
    const student = this.currentStudent();
    if (student) this.loadTutoringAndAgreements(student.id);
  }

  public onAgreementUpdated(): void {
    this.showAgreementDrawer = false;
    const student = this.currentStudent();
    if (student) this.loadTutoringAndAgreements(student.id);
  }

  public openSemesterModal(): void {
    const student = this.currentStudent();
    if (!student) return;

    const nextNum = (student.semesters?.length || 0) + 1;
    if (nextNum > 6) {
      alert('El estudiante ya cuenta con los 6 semestres registrados.');
      return;
    }

    this.studentService.createSemester({
      student: student.id,
      numero: nextNum,
      fechaInicio: '2025-01-15',
      fechaFin: '2025-06-30',
      isActive: true
    }).subscribe({
      next: () => this.loadExpediente()
    });
  }
}
