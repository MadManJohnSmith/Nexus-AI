import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MonitoringService } from '../../../core/services/monitoring.service';
import { AlertsResponse } from '../../../core/models/monitoring.models';
import { PillBadgeComponent } from '../pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, PillBadgeComponent],
  template: `
    <div class="nexus-layout">
      <!-- Sidebar Lateral Fija -->
      <aside class="nexus-sidebar">
        <div class="sidebar-header">
          <div class="brand-logo">
            <div class="logo-icon">N</div>
            <div class="brand-info">
              <h1 class="brand-title">N.E.X.U.S.</h1>
              <span class="brand-subtitle">Posgrado Superior</span>
            </div>
          </div>
        </div>

        <!-- Selector de Modo de Operación -->
        <div class="mode-selector-wrapper">
          <div class="mode-selector">
            <button 
              type="button" 
              class="mode-btn" 
              [class.active]="currentMode() === 'expediente'"
              (click)="setMode('expediente')">
              Expediente
            </button>
            @if (authService.isCoordinator()) {
              <button 
                type="button" 
                class="mode-btn" 
                [class.active]="currentMode() === 'coordinacion'"
                (click)="setMode('coordinacion')">
                Coordinación
              </button>
            }
          </div>
        </div>

        <!-- Navegación Principal -->
        <nav class="sidebar-nav">
          <div class="nav-section-title">SEGUIMIENTO DOCTORAL</div>
          <ul class="nav-list">
            <li>
              <a routerLink="/student-overview" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">👤</span>
                <span class="nav-text">Expediente General</span>
              </a>
            </li>
            <li>
              <a routerLink="/tutoring" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📘</span>
                <span class="nav-text">Sesiones de Tutoría</span>
              </a>
            </li>
            <li>
              <a routerLink="/agreements" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">📝</span>
                <span class="nav-text">Acuerdos y Compromisos</span>
              </a>
            </li>
            <li>
              <a routerLink="/timeline" routerLinkActive="active" class="nav-link">
                <span class="nav-icon">⏱️</span>
                <span class="nav-text">Línea de Tiempo Longitudinal</span>
              </a>
            </li>
          </ul>

          @if (authService.isCoordinator() || authService.isAdvisor()) {
            <div class="nav-section-title">GESTIÓN Y REPORTES</div>
            <ul class="nav-list">
              <li>
                <a routerLink="/reports" routerLinkActive="active" class="nav-link">
                  <span class="nav-icon">📄</span>
                  <span class="nav-text">Reportes Integrales</span>
                </a>
              </li>
            </ul>
          }
        </nav>

        <!-- Perfil de Usuario y Cierre de Sesión -->
        <div class="sidebar-footer">
          <div class="user-card">
            <div class="user-avatar">
              {{ (authService.currentUser()?.firstName || 'U')[0] }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ authService.currentUser()?.fullName || 'Usuario' }}</span>
              <nexus-pill-badge [variant]="authService.userRole() || 'ESTUDIANTE'"></nexus-pill-badge>
            </div>
          </div>
          <button type="button" class="btn-logout" (click)="onLogout()" title="Cerrar sesión">
            <span class="logout-icon">🚪</span>
            <span>Salir</span>
          </button>
        </div>
      </aside>

      <!-- Área Principal con Top Navbar -->
      <div class="nexus-main-wrapper">
        <!-- Top Navbar -->
        <header class="nexus-navbar">
          <div class="navbar-breadcrumbs">
            <span class="breadcrumb-root">N.E.X.U.S.</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">{{ getBreadcrumb() }}</span>
          </div>

          <div class="navbar-actions">
            <!-- Campana de Notificaciones Reactiva (HU-25) -->
            <div class="notification-wrapper">
              <button type="button" class="btn-bell" (click)="toggleAlertsDropdown()" title="Alertas de compromisos">
                <span class="bell-icon">🔔</span>
                @if (alertsData() && alertsData()!.totalAlertas > 0) {
                  <span class="bell-counter">{{ alertsData()!.totalAlertas }}</span>
                }
              </button>

              @if (showAlertsDropdown()) {
                <div class="alerts-dropdown">
                  <div class="dropdown-header">
                    <h4>Alertas de Compromisos</h4>
                    <span class="alert-sub">{{ alertsData()?.totalAlertas || 0 }} requieren atención</span>
                  </div>
                  <div class="alerts-list">
                    @for (item of alertsData()?.alertasVencidas || []; track item.id) {
                      <div class="alert-item alert-vencido" (click)="goToAgreements()">
                        <span class="alert-dot red"></span>
                        <div class="alert-info">
                          <strong>{{ item.descripcion }}</strong>
                          <span>Venció el {{ item.fechaLimite }} • {{ item.studentNombre }}</span>
                        </div>
                      </div>
                    }
                    @for (item of alertsData()?.alertasPorVencer || []; track item.id) {
                      <div class="alert-item alert-por-vencer" (click)="goToAgreements()">
                        <span class="alert-dot amber"></span>
                        <div class="alert-info">
                          <strong>{{ item.descripcion }}</strong>
                          <span>Vence en {{ item.diasRestantes }} días ({{ item.fechaLimite }})</span>
                        </div>
                      </div>
                    }
                    @if (!alertsData() || alertsData()!.totalAlertas === 0) {
                      <div class="empty-alerts">
                        <span>✅ No hay acuerdos en riesgo ni vencidos.</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Buscar estudiante, matrícula o acuerdo..." 
                class="search-input"
              />
            </div>
            <div class="system-status">
              <span class="status-indicator"></span>
              <span class="status-text">MVP Longitudinal Activo</span>
            </div>
          </div>
        </header>

        <!-- Contenido de la Vista -->
        <main class="nexus-content-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nexus-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--color-bg-app);
    }

    .nexus-sidebar {
      width: 280px;
      min-width: 280px;
      background-color: #FFFFFF;
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      height: 100vh;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .sidebar-header {
      padding: 24px 20px 16px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-emphasis));
      color: #FFFFFF;
      font-weight: 800;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(99, 101, 239, 0.3);
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--color-emphasis);
      letter-spacing: -0.02em;
    }

    .brand-subtitle {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      font-weight: 500;
    }

    .mode-selector-wrapper {
      padding: 0 20px 16px;
    }

    .mode-selector {
      display: flex;
      background-color: #F2F4F7;
      border-radius: var(--radius-sm);
      padding: 3px;
      gap: 2px;
    }

    .mode-btn {
      flex: 1;
      border: none;
      background: transparent;
      padding: 6px 10px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .mode-btn.active {
      background-color: #FFFFFF;
      color: var(--color-primary);
      box-shadow: var(--shadow-sm);
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 8px 16px;
    }

    .nav-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-text-light);
      letter-spacing: 0.05em;
      margin: 16px 0 8px 8px;
    }

    .nav-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      color: var(--color-text-main);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.15s ease;
    }

    .nav-link:hover {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
    }

    .nav-link.active {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      font-weight: 600;
      border-left: 3px solid var(--color-primary);
    }

    .nav-icon {
      font-size: 1.1rem;
    }

    .sidebar-footer {
      padding: 16px;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 10px;
      overflow: hidden;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: var(--color-primary);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--color-text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .btn-logout {
      border: 1px solid var(--color-border);
      background: #FFFFFF;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .btn-logout:hover {
      background-color: var(--color-danger-bg);
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .nexus-main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .nexus-navbar {
      height: 64px;
      background-color: #FFFFFF;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      position: sticky;
      top: 0;
      z-index: 90;
    }

    .navbar-breadcrumbs {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
    }

    .breadcrumb-root {
      font-weight: 600;
      color: var(--color-primary);
    }

    .breadcrumb-separator {
      color: var(--color-text-light);
    }

    .breadcrumb-current {
      font-weight: 500;
      color: var(--color-text-main);
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    /* Notification Bell */
    .notification-wrapper {
      position: relative;
    }

    .btn-bell {
      background: #FAFAFB;
      border: 1px solid var(--color-border);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }

    .btn-bell:hover {
      background-color: var(--color-primary-light);
      border-color: var(--color-primary);
    }

    .bell-icon {
      font-size: 1rem;
    }

    .bell-counter {
      position: absolute;
      top: -4px;
      right: -4px;
      background-color: var(--color-danger);
      color: #FFFFFF;
      font-size: 0.65rem;
      font-weight: 800;
      border-radius: 9999px;
      padding: 1px 5px;
      border: 2px solid #FFFFFF;
    }

    .alerts-dropdown {
      position: absolute;
      top: 46px;
      right: 0;
      width: 320px;
      background-color: #FFFFFF;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 200;
      animation: dropFade 0.15s ease-out;
    }

    @keyframes dropFade {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
      background-color: #F8F9FC;
    }

    .dropdown-header h4 {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .alert-sub {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .alerts-list {
      max-height: 280px;
      overflow-y: auto;
    }

    .alert-item {
      padding: 10px 14px;
      border-bottom: 1px solid #F2F4F7;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .alert-item:hover {
      background-color: #F8F9FC;
    }

    .alert-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 4px;
    }

    .alert-dot.red { background-color: var(--color-danger); }
    .alert-dot.amber { background-color: #F59E0B; }

    .alert-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 0.75rem;
    }

    .alert-info strong {
      color: var(--color-text-main);
    }

    .alert-info span {
      color: var(--color-text-muted);
    }

    .empty-alerts {
      padding: 16px;
      text-align: center;
      font-size: 0.75rem;
      color: var(--color-text-muted);
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: #F9FAFB;
      border: 1px solid var(--color-border);
      padding: 6px 12px;
      border-radius: var(--radius-md);
      width: 320px;
    }

    .search-input {
      border: none;
      background: transparent;
      outline: none;
      font-size: 0.825rem;
      width: 100%;
      color: var(--color-text-main);
    }

    .system-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--color-success);
      box-shadow: 0 0 0 2px var(--color-success-bg);
    }

    .nexus-content-body {
      padding: 32px;
      flex: 1;
    }
  `]
})
export class AppShellComponent implements OnInit {
  public authService = inject(AuthService);
  private monitoringService = inject(MonitoringService);
  private router = inject(Router);

  public currentMode = signal<'expediente' | 'coordinacion'>('expediente');
  public alertsData = signal<AlertsResponse | null>(null);
  public showAlertsDropdown = signal<boolean>(false);

  ngOnInit(): void {
    this.monitoringService.getAlerts().subscribe({
      next: (res) => this.alertsData.set(res)
    });
  }

  public setMode(mode: 'expediente' | 'coordinacion') {
    this.currentMode.set(mode);
  }

  public toggleAlertsDropdown(): void {
    this.showAlertsDropdown.set(!this.showAlertsDropdown());
  }

  public goToAgreements(): void {
    this.showAlertsDropdown.set(false);
    this.router.navigate(['/agreements']);
  }

  public getBreadcrumb(): string {
    const url = this.router.url;
    if (url.includes('student-overview')) return 'Expediente Longitudinal del Doctorando';
    if (url.includes('tutoring')) return 'Módulo de Tutorías y Asesorías';
    if (url.includes('agreements')) return 'Seguimiento de Acuerdos';
    if (url.includes('timeline')) return 'Línea de Tiempo Longitudinal (MVP)';
    if (url.includes('reports')) return 'Reportes Integrales de Posgrado';
    return 'Panel Principal';
  }

  public onLogout() {
    this.authService.logout();
  }
}
