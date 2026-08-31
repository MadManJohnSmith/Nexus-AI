import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Student, Semester, AcademicCommitteeMember } from '../../core/models/student.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';

export type TabType = 'resumen' | 'semestres' | 'tesis' | 'evidencias';

@Component({
  selector: 'nexus-student-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, PillBadgeComponent],
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
                <span class="meta-divider">•</span>
                <span class="meta-item">
                  <span class="meta-label">Ingreso:</span>
                  <span>{{ currentStudent()!.fechaIngreso }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats Cards in Header -->
          <div class="header-stats">
            <div class="stat-box">
              <span class="stat-number">{{ currentStudent()!.totalSemestres }} / 6</span>
              <span class="stat-label">Semestres Registrados</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">{{ committeeList().length }}</span>
              <span class="stat-label">Miembros en Comité</span>
            </div>
            <div class="stat-box">
              <span class="stat-number">100%</span>
              <span class="stat-label">Seguimiento Regular</span>
            </div>
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
            <span>Evidencias y Productos</span>
          </button>
        </div>

        <!-- Grid Modular 70/30 -->
        <div class="modular-grid">
          <!-- Columna Principal 70% -->
          <div class="main-column-70">
            @if (activeTab() === 'resumen') {
              <!-- Sección de Resumen General -->
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

              <!-- Módulo de Acuerdos y Compromisos Recientes -->
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Compromisos y Acuerdos de Tutoría</h3>
                  <span class="card-action-link">Ver todos los acuerdos (Sprint 2)</span>
                </div>
                <div class="card-body">
                  <div class="agreements-table-wrapper">
                    <table class="nexus-table">
                      <thead>
                        <tr>
                          <th>Compromiso / Tarea</th>
                          <th>Semestre</th>
                          <th>Fecha Límite</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Entrega de Estado del Arte y Protocolo de Tesis</td>
                          <td>Semestre 1</td>
                          <td>2024-06-30</td>
                          <td><nexus-pill-badge variant="CONCLUIDO" label="Concluido"></nexus-pill-badge></td>
                        </tr>
                        <tr>
                          <td>Borrador de Artículo para Revista Indexada JCR</td>
                          <td>Semestre 2</td>
                          <td>2024-11-20</td>
                          <td><nexus-pill-badge variant="EN_PROCESO" label="En Proceso"></nexus-pill-badge></td>
                        </tr>
                        <tr>
                          <td>Revisión de Avance Capítulo 3 con Comité Tutoral</td>
                          <td>Semestre 2</td>
                          <td>2024-12-10</td>
                          <td><nexus-pill-badge variant="PENDIENTE" label="Pendiente"></nexus-pill-badge></td>
                        </tr>
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
                      <div class="activities-placeholder">
                        <p class="placeholder-text">
                          📘 Las tutorías, compromisos y bitácoras asociadas a este semestre se gestionarán en los módulos especializados.
                        </p>
                      </div>
                    } @else {
                      <div class="empty-semester-state">
                        <p>El Semestre {{ selectedSemesterNum() }} aún no ha sido dado de alta en la trayectoria del estudiante.</p>
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
                    Título Tentativo: <strong>"Arquitectura de Agentes Inteligentes Autónomos para la Trazabilidad Longitudinal en Posgrados de Alto Impacto"</strong>
                  </p>
                  <div class="thesis-milestones">
                    <div class="milestone-item completed">
                      <span class="milestone-icon">✓</span>
                      <div>
                        <strong>Definición del Problema y Justificación</strong>
                        <p>Validado por Asesor Principal en Semestre 1</p>
                      </div>
                    </div>
                    <div class="milestone-item current">
                      <span class="milestone-icon">⚡</span>
                      <div>
                        <strong>Desarrollo del Marco Teórico y Algoritmos Base</strong>
                        <p>En revisión continua en Semestre 2</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            }

            @if (activeTab() === 'evidencias') {
              <section class="content-card">
                <div class="card-header-row">
                  <h3 class="card-title">Repositorio de Evidencias y Difusión Científica</h3>
                </div>
                <div class="card-body">
                  <div class="evidence-list">
                    <div class="evidence-item">
                      <span class="evidence-icon">📄</span>
                      <div class="evidence-info">
                        <strong>Protocolo_Doctoral_Aprobado_2024.pdf</strong>
                        <span class="evidence-sub">Cargado el 2024-02-10 • Semestre 1</span>
                      </div>
                      <nexus-pill-badge variant="CONCLUIDO" label="Validado"></nexus-pill-badge>
                    </div>
                  </div>
                </div>
              </section>
            }
          </div>

          <!-- Columna Lateral 30% (Ficha del Comité Tutoral) -->
          <aside class="sidebar-column-30">
            <div class="committee-card">
              <div class="committee-card-header">
                <h3 class="committee-title">Comité Tutoral y Asesores</h3>
                @if (authService.isCoordinator()) {
                  <button type="button" class="btn-icon-add" (click)="showAddMemberModal = true" title="Asignar Asesor">+ Asignar</button>
                }
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
                    @if (authService.isCoordinator()) {
                      <button 
                        type="button" 
                        class="btn-remove-member" 
                        (click)="removeMember(member.id)" 
                        title="Remover miembro">
                        ✕
                      </button>
                    }
                  </div>
                } @empty {
                  <div class="empty-committee">
                    <p>No se han asignado miembros al comité académico aún.</p>
                  </div>
                }
              </div>

              <div class="committee-footer-info">
                <span class="info-icon">ℹ️</span>
                <span class="info-text">Los asesores asignados tienen permisos de registro de tutorías y seguimiento.</span>
              </div>
            </div>
          </aside>
        </div>
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

    /* Student Header Card */
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

    .header-stats {
      display: flex;
      gap: 16px;
    }

    .stat-box {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 12px 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 130px;
    }

    .stat-number {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--color-emphasis);
    }

    .stat-label {
      font-size: 0.7rem;
      color: var(--color-text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
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

    .tab-btn:hover {
      color: var(--color-primary);
      background-color: #FFFFFF;
    }

    .tab-btn.active {
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

    /* Grid 70/30 */
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

    .kv-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
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

    .kv-value.primary-highlight {
      color: var(--color-primary);
    }

    /* Agreements Table */
    .agreements-table-wrapper {
      overflow-x: auto;
    }

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

    /* Stepper Semestres */
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
      margin-bottom: 12px;
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

    .placeholder-text {
      font-size: 0.825rem;
      color: var(--color-text-muted);
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
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--color-border);
    }

    .committee-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .btn-icon-add {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
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

    .btn-remove-member {
      background: transparent;
      border: none;
      color: var(--color-text-light);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 4px 8px;
    }

    .btn-remove-member:hover {
      color: var(--color-danger);
    }

    .committee-footer-info {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px dashed var(--color-border);
      font-size: 0.725rem;
      color: var(--color-text-muted);
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
  public authService = inject(AuthService);

  public isLoading = signal<boolean>(true);
  public currentStudent = signal<Student | null>(null);
  public activeTab = signal<TabType>('resumen');
  public selectedSemesterNum = signal<number>(1);
  public showAddMemberModal = false;

  public committeeList = computed(() => {
    return this.currentStudent()?.academicCommittee || [];
  });

  public selectedSemesterData = computed(() => {
    const sems = this.currentStudent()?.semesters || [];
    return sems.find(s => s.numero === this.selectedSemesterNum()) || null;
  });

  ngOnInit(): void {
    this.loadExpediente();
  }

  public loadExpediente(): void {
    this.isLoading.set(true);
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          const firstStudent = res.results[0];
          // Cargar detalle completo
          this.studentService.getStudentById(firstStudent.id).subscribe({
            next: (detailed) => {
              this.currentStudent.set(detailed);
              this.selectedSemesterNum.set(detailed.semestreActual);
              this.isLoading.set(false);
            },
            error: () => {
              this.currentStudent.set(firstStudent);
              this.isLoading.set(false);
            }
          });
        } else {
          // Fallback dummy for fresh installation demo
          this.currentStudent.set({
            id: 1,
            matricula: 'DOC-2024-001',
            nombreCompleto: 'Alan Turing',
            email: 'alan.turing@posgrado.edu',
            programaDoctoral: 'Doctorado en Ciencias de la Computación',
            fechaIngreso: '2024-01-15',
            cohorte: '2024-A',
            estatusActivo: true,
            semestreActual: 2,
            asesorPrincipal: 'Dr. Alonzo Church',
            coasesor: 'Dra. Ada Lovelace',
            totalSemestres: 2,
            semesters: [
              { id: 1, student: 1, numero: 1, fechaInicio: '2024-01-15', fechaFin: '2024-06-30', isActive: false },
              { id: 2, student: 1, numero: 2, fechaInicio: '2024-08-01', fechaFin: '2024-12-15', isActive: true }
            ],
            academicCommittee: [
              {
                id: 1,
                student: 1,
                user: 2,
                userNombre: 'Dr. Alonzo Church',
                userEmail: 'church@posgrado.edu',
                userRole: 'ASESOR',
                rolComite: 'ASESOR_PRINCIPAL',
                rolComiteDisplay: 'Asesor Principal',
                fechaAsignacion: '2024-01-15',
                isActive: true
              },
              {
                id: 2,
                student: 1,
                user: 3,
                userNombre: 'Dra. Ada Lovelace',
                userEmail: 'ada@posgrado.edu',
                userRole: 'ASESOR',
                rolComite: 'COASESOR',
                rolComiteDisplay: 'Coasesor',
                fechaAsignacion: '2024-01-20',
                isActive: true
              }
            ]
          });
          this.selectedSemesterNum.set(2);
          this.isLoading.set(false);
        }
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

  public removeMember(memberId: number): void {
    const student = this.currentStudent();
    if (!student) return;

    if (confirm('¿Está seguro de remover este miembro del comité tutoral?')) {
      this.studentService.removeCommitteeMember(student.id, memberId).subscribe({
        next: () => {
          this.loadExpediente();
        }
      });
    }
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
      next: () => {
        this.loadExpediente();
      }
    });
  }
}
