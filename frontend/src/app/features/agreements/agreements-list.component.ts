import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgreementService } from '../../core/services/agreement.service';
import { StudentService } from '../../core/services/student.service';
import { AuthService } from '../../core/services/auth.service';
import { Agreement, AgreementState, AgreementFilterParams } from '../../core/models/agreement.models';
import { Student } from '../../core/models/student.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';
import { AgreementDrawerComponent } from './agreement-drawer.component';

@Component({
  selector: 'nexus-agreements-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PillBadgeComponent, AgreementDrawerComponent],
  template: `
    <div class="agreements-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h2 class="page-title">Bandeja de Acuerdos y Compromisos</h2>
          <p class="page-subtitle">Seguimiento longitudinal y semaforización de compromisos doctorales</p>
        </div>
        <button type="button" class="btn-create-agreement" (click)="openCreateDrawer()">
          + Nuevo Compromiso
        </button>
      </div>

      <!-- Toolbar Superior de Filtros y Búsqueda -->
      <div class="toolbar-card">
        <div class="toolbar-row">
          <!-- Search Input -->
          <div class="search-field">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="onFilterChange()"
              placeholder="Buscar por descripción, alumno, matrícula o responsable..." 
              class="toolbar-input"
            />
          </div>

          <!-- Select Semestre -->
          <div class="filter-field">
            <select [(ngModel)]="selectedSemester" (ngModelChange)="onFilterChange()" class="toolbar-select">
              <option [value]="null">Todos los Semestres</option>
              <option [value]="1">Semestre 1</option>
              <option [value]="2">Semestre 2</option>
              <option [value]="3">Semestre 3</option>
              <option [value]="4">Semestre 4</option>
              <option [value]="5">Semestre 5</option>
              <option [value]="6">Semestre 6</option>
            </select>
          </div>

          <!-- Select Estado -->
          <div class="filter-field">
            <select [(ngModel)]="selectedEstado" (ngModelChange)="onFilterChange()" class="toolbar-select">
              <option [value]="null">Todos los Estados</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="CONCLUIDO">Concluido</option>
              <option value="VENCIDO">Vencido</option>
            </select>
          </div>
        </div>

        <!-- Chips Activos Removibles -->
        @if (hasActiveFilters()) {
          <div class="active-chips-row">
            <span class="chips-label">Filtros Activos:</span>
            @if (searchQuery) {
              <span class="filter-chip" (click)="searchQuery = ''; onFilterChange()">
                Búsqueda: "{{ searchQuery }}" <span class="chip-close">✖</span>
              </span>
            }
            @if (selectedSemester) {
              <span class="filter-chip" (click)="selectedSemester = null; onFilterChange()">
                Semestre: {{ selectedSemester }} <span class="chip-close">✖</span>
              </span>
            }
            @if (selectedEstado) {
              <span class="filter-chip" (click)="selectedEstado = null; onFilterChange()">
                Estado: {{ selectedEstado }} <span class="chip-close">✖</span>
              </span>
            }
            <button type="button" class="btn-clear-all" (click)="clearAllFilters()">Limpiar filtros</button>
          </div>
        }
      </div>

      <!-- Tabla de Acuerdos con Semáforo -->
      <div class="table-container">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Cargando compromisos y acuerdos...</p>
          </div>
        } @else {
          <table class="nexus-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Compromiso / Descripción</th>
                <th>Estudiante</th>
                <th>Semestre</th>
                <th>Responsable</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of agreementsList(); track item.id) {
                <tr class="table-row" (click)="openEditDrawer(item)">
                  <td class="col-id">#{{ item.id }}</td>
                  <td class="col-desc">
                    <strong>{{ item.descripcion }}</strong>
                  </td>
                  <td>{{ item.studentNombre }} ({{ item.studentMatricula }})</td>
                  <td>
                    @if (item.semesterNumero) {
                      <span class="sem-badge">Sem {{ item.semesterNumero }}</span>
                    } @else {
                      <span class="sem-badge">-</span>
                    }
                  </td>
                  <td>{{ item.responsableNombre }}</td>
                  <td [class.overdue-date]="item.isOverdue">
                    {{ item.fechaLimite }}
                  </td>
                  <td>
                    <nexus-pill-badge [variant]="item.estado"></nexus-pill-badge>
                  </td>
                  <td>
                    <button type="button" class="btn-table-action" (click)="$event.stopPropagation(); openEditDrawer(item)">
                      Gestionar ➔
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-row">
                    No se encontraron acuerdos con los filtros especificados.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Drawer Lateral Derecho (400px) -->
      @if (showDrawer()) {
        <nexus-agreement-drawer
          [student]="currentStudent()"
          [selectedAgreement]="selectedAgreement()"
          (close)="closeDrawer()"
          (agreementUpdated)="onAgreementUpdated()">
        </nexus-agreement-drawer>
      }
    </div>
  `,
  styles: [`
    .agreements-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .page-subtitle {
      font-size: 0.825rem;
      color: var(--color-text-muted);
    }

    .btn-create-agreement {
      padding: 9px 18px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(99, 101, 239, 0.2);
      transition: background-color 0.2s;
    }

    .btn-create-agreement:hover {
      background-color: var(--color-primary-hover);
    }

    /* Toolbar */
    .toolbar-card {
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 16px 20px;
      box-shadow: var(--shadow-sm);
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toolbar-row {
      display: flex;
      gap: 16px;
      align-items: center;
    }

    .search-field {
      flex: 2;
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #FAFAFB;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
    }

    .toolbar-input {
      border: none;
      background: transparent;
      outline: none;
      width: 100%;
      font-size: 0.85rem;
      color: var(--color-text-main);
    }

    .filter-field {
      flex: 1;
    }

    .toolbar-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      color: var(--color-text-main);
      background-color: #FAFAFB;
      outline: none;
    }

    .active-chips-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px dashed var(--color-border);
    }

    .chips-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      padding: 3px 8px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-chip:hover {
      background-color: #E0E3FF;
    }

    .chip-close {
      font-size: 0.65rem;
    }

    .btn-clear-all {
      background: transparent;
      border: none;
      color: var(--color-danger);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
    }

    /* Table */
    .table-container {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      overflow-x: auto;
    }

    .nexus-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      text-align: left;
    }

    .nexus-table th {
      background-color: #F8F9FC;
      color: var(--color-text-muted);
      font-weight: 600;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .table-row {
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .table-row:hover {
      background-color: #F8FAFC;
    }

    .nexus-table td {
      padding: 14px 16px;
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-main);
    }

    .col-id {
      font-weight: 700;
      color: var(--color-text-light);
      font-size: 0.75rem;
    }

    .col-desc {
      max-width: 320px;
    }

    .sem-badge {
      background-color: #F2F4F7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .overdue-date {
      color: var(--color-danger);
      font-weight: 700;
    }

    .btn-table-action {
      background: transparent;
      border: 1px solid var(--color-border);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-primary);
      cursor: pointer;
    }

    .btn-table-action:hover {
      background-color: var(--color-primary-light);
    }

    .empty-row {
      text-align: center;
      padding: 40px;
      color: var(--color-text-muted);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      gap: 12px;
      color: var(--color-text-muted);
    }

    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid #E4E7EC;
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class AgreementsListComponent implements OnInit {
  private agreementService = inject(AgreementService);
  private studentService = inject(StudentService);
  public authService = inject(AuthService);

  public isLoading = signal<boolean>(true);
  public agreementsList = signal<Agreement[]>([]);
  public currentStudent = signal<Student | null>(null);
  public selectedAgreement = signal<Agreement | null>(null);
  public showDrawer = signal<boolean>(false);

  // Filters
  public searchQuery: string = '';
  public selectedSemester: number | null = null;
  public selectedEstado: AgreementState | null = null;

  ngOnInit(): void {
    this.loadInitialData();
  }

  public loadInitialData(): void {
    this.studentService.getStudents(1, 1).subscribe({
      next: (res) => {
        if (res.results.length > 0) {
          this.studentService.getStudentById(res.results[0].id).subscribe({
            next: (s) => this.currentStudent.set(s)
          });
        }
      }
    });
    this.loadAgreements();
  }

  public loadAgreements(): void {
    this.isLoading.set(true);
    const filters: AgreementFilterParams = {};
    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedSemester) filters.semester = this.selectedSemester;
    if (this.selectedEstado) filters.estado = this.selectedEstado;

    this.agreementService.getAgreements(filters).subscribe({
      next: (res) => {
        this.agreementsList.set(res.results);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  public onFilterChange(): void {
    this.loadAgreements();
  }

  public hasActiveFilters(): boolean {
    return !!this.searchQuery || !!this.selectedSemester || !!this.selectedEstado;
  }

  public clearAllFilters(): void {
    this.searchQuery = '';
    this.selectedSemester = null;
    this.selectedEstado = null;
    this.loadAgreements();
  }

  public openCreateDrawer(): void {
    this.selectedAgreement.set(null);
    this.showDrawer.set(true);
  }

  public openEditDrawer(agreement: Agreement): void {
    this.selectedAgreement.set(agreement);
    this.showDrawer.set(true);
  }

  public closeDrawer(): void {
    this.showDrawer.set(false);
    this.selectedAgreement.set(null);
  }

  public onAgreementUpdated(): void {
    this.closeDrawer();
    this.loadAgreements();
  }
}
