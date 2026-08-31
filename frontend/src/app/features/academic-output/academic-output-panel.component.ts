import { Component, Input, Output, EventEmitter, inject, signal, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AcademicOutputService } from '../../core/services/academic-output.service';
import { AuthService } from '../../core/services/auth.service';
import { Student } from '../../core/models/student.models';
import { Publication, AcademicEvent, ResearchStay, OtherProduct } from '../../core/models/academic-output.models';
import { PillBadgeComponent } from '../../shared/components/pill-badge/pill-badge.component';

@Component({
  selector: 'nexus-academic-output-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, PillBadgeComponent],
  template: `
    <div class="academic-output-container">
      <!-- Sub-navegación interna de Producción Científica -->
      <div class="sub-nav-bar">
        <button 
          type="button" 
          class="sub-tab-btn" 
          [class.active]="activeSubTab === 'publicaciones'"
          (click)="activeSubTab = 'publicaciones'">
          <span class="tab-icon">🎓</span>
          <span>Publicaciones ({{ publications().length }})</span>
        </button>
        <button 
          type="button" 
          class="sub-tab-btn" 
          [class.active]="activeSubTab === 'congresos'"
          (click)="activeSubTab = 'congresos'">
          <span class="tab-icon">🏛️</span>
          <span>Congresos y Ponencias ({{ events().length }})</span>
        </button>
        <button 
          type="button" 
          class="sub-tab-btn" 
          [class.active]="activeSubTab === 'estancias'"
          (click)="activeSubTab = 'estancias'">
          <span class="tab-icon">✈️</span>
          <span>Estancias de Investigación ({{ stays().length }})</span>
        </button>
        <button 
          type="button" 
          class="sub-tab-btn" 
          [class.active]="activeSubTab === 'otros'"
          (click)="activeSubTab = 'otros'">
          <span class="tab-icon">💻</span>
          <span>Software y Patentes ({{ otherProducts().length }})</span>
        </button>
      </div>

      <!-- Contenedor 1: PUBLICACIONES CIENTÍFICAS (HU-17) -->
      @if (activeSubTab === 'publicaciones') {
        <section class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Artículos y Capítulos de Libro</h3>
              <p class="section-subtitle">Registro de productos bibliográficos en revistas indexadas JCR, Scopus o Padrón Conahcyt.</p>
            </div>
            <button type="button" class="btn-primary" (click)="showPubModal = true">
              + Registrar Publicación
            </button>
          </div>

          <div class="card-grid">
            @for (pub of publications(); track pub.id) {
              <div class="pub-card">
                <div class="pub-card-top">
                  <span class="pub-type-badge">{{ pub.tipoDisplay || pub.tipo }}</span>
                  <nexus-pill-badge [variant]="pub.estado" [label]="pub.estadoDisplay || pub.estado"></nexus-pill-badge>
                </div>
                <h4 class="pub-title">{{ pub.titulo }}</h4>
                <p class="pub-authors"><strong>Autores:</strong> {{ pub.autoresTexto }}</p>
                <div class="pub-meta">
                  <span>📖 {{ pub.revistaEditorial }}</span>
                  <span>📅 Semestre {{ pub.semesterNumero }} ({{ pub.fechaPublicacion || 'En curso' }})</span>
                </div>
                @if (pub.doiUrl) {
                  <a [href]="pub.doiUrl" target="_blank" class="pub-doi-link">🌐 {{ pub.doiUrl }}</a>
                }
              </div>
            } @empty {
              <div class="empty-box">No se han registrado publicaciones científicas para este estudiante.</div>
            }
          </div>
        </section>
      }

      <!-- Contenedor 2: CONGRESOS Y PONENCIAS (HU-18) -->
      @if (activeSubTab === 'congresos') {
        <section class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Participación en Congresos y Simposios</h3>
              <p class="section-subtitle">Presentaciones orales, ponencias magistrales y coloquios de posgrado.</p>
            </div>
            <button type="button" class="btn-primary" (click)="showEventModal = true">
              + Registrar Ponencia / Evento
            </button>
          </div>

          <div class="card-grid">
            @for (ev of events(); track ev.id) {
              <div class="event-card">
                <div class="event-type-row">
                  <span class="event-badge">{{ ev.tipoEventoDisplay || ev.tipoEvento }}</span>
                  <span class="modality-tag">{{ ev.modalidad }}</span>
                </div>
                <h4 class="event-title">{{ ev.tituloPonencia }}</h4>
                <p class="event-name"><strong>Evento:</strong> {{ ev.nombreEvento }}</p>
                <div class="event-meta">
                  <span>📍 Sede: {{ ev.sedeLugar }}</span>
                  <span>📅 Fecha: {{ ev.fechaPresentacion }}</span>
                  <span>🎓 Semestre {{ ev.semesterNumero }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-box">No hay participaciones en congresos registradas aún.</div>
            }
          </div>
        </section>
      }

      <!-- Contenedor 3: ESTANCIAS DE INVESTIGACIÓN (HU-19) -->
      @if (activeSubTab === 'estancias') {
        <section class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Estancias de Investigación Nacionales e Internacionales</h3>
              <p class="section-subtitle">Movilidad doctoral y estancias con investigadores anfitriones.</p>
            </div>
            <button type="button" class="btn-primary" (click)="showStayModal = true">
              + Registrar Estancia
            </button>
          </div>

          <div class="card-grid">
            @for (st of stays(); track st.id) {
              <div class="stay-card">
                <div class="stay-head">
                  <span class="country-pill">🌎 {{ st.pais }}</span>
                  <span class="sem-tag">Semestre {{ st.semesterNumero }}</span>
                </div>
                <h4 class="inst-title">{{ st.institucionReceptora }}</h4>
                <p class="stay-resp"><strong>Investigador Anfitrión:</strong> {{ st.responsableEstancia }}</p>
                <p class="stay-dates"><strong>Periodo:</strong> {{ st.fechaInicio }} al {{ st.fechaFin }}</p>
                <p class="stay-obj"><strong>Objetivos:</strong> {{ st.objetivos }}</p>
              </div>
            } @empty {
              <div class="empty-box">No se han registrado estancias de investigación.</div>
            }
          </div>
        </section>
      }

      <!-- Contenedor 4: SOFTWARE Y OTROS PRODUCTOS (HU-20) -->
      @if (activeSubTab === 'otros') {
        <section class="section-card">
          <div class="section-header">
            <div>
              <h3 class="section-title">Desarrollo Tecnológico, Software y Patentes</h3>
              <p class="section-subtitle">Registro de propiedad intelectual, prototipos aplicados y repositorios.</p>
            </div>
            <button type="button" class="btn-primary" (click)="showProdModal = true">
              + Registrar Producto
            </button>
          </div>

          <div class="card-grid">
            @for (pr of otherProducts(); track pr.id) {
              <div class="prod-card">
                <span class="prod-type-pill">{{ pr.tipoProductoDisplay || pr.tipoProducto }}</span>
                <h4 class="prod-title">{{ pr.titulo }}</h4>
                <p class="prod-desc">{{ pr.descripcion }}</p>
                <div class="prod-footer">
                  <span>📅 Registrado: {{ pr.fechaRegistro }}</span>
                  <span>Semestre {{ pr.semesterNumero }}</span>
                </div>
              </div>
            } @empty {
              <div class="empty-box">No hay productos tecnológicos o patentes registradas.</div>
            }
          </div>
        </section>
      }

      <!-- MODALES DE CREACIÓN -->
      @if (showPubModal) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3 class="modal-title">Registrar Publicación Científica</h3>
            <form (ngSubmit)="savePublication()" class="modal-form">
              <div class="form-group">
                <label>Título del Artículo / Capítulo *</label>
                <input type="text" [(ngModel)]="newPub.titulo" name="pubTitulo" required class="form-input" placeholder="Ej. Autonomous AI in Healthcare" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Autores (Formato APA) *</label>
                  <input type="text" [(ngModel)]="newPub.autoresTexto" name="pubAutores" required class="form-input" placeholder="Turing, A., Church, A." />
                </div>
                <div class="form-group">
                  <label>Tipo de Publicación *</label>
                  <select [(ngModel)]="newPub.tipo" name="pubTipo" class="form-select">
                    <option value="ARTICULO_JCR">Artículo Indexado JCR / Scopus</option>
                    <option value="ARTICULO_CONACYT">Artículo Padrón Conahcyt</option>
                    <option value="CAPITULO_LIBRO">Capítulo de Libro Arbitrado</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Revista / Editorial *</label>
                  <input type="text" [(ngModel)]="newPub.revistaEditorial" name="pubRevista" required class="form-input" placeholder="IEEE Software" />
                </div>
                <div class="form-group">
                  <label>Estado del Artículo *</label>
                  <select [(ngModel)]="newPub.estado" name="pubEstado" class="form-select">
                    <option value="PREPARACION">En Preparación</option>
                    <option value="ENVIADO">Enviado a Editorial</option>
                    <option value="EN_REVISION">En Revisión por Pares</option>
                    <option value="ACEPTADO">Aceptado</option>
                    <option value="PUBLICADO">Publicado Oficialmente</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Fecha de Publicación / Envío</label>
                  <input type="date" [(ngModel)]="newPub.fechaPublicacion" name="pubFecha" class="form-input" />
                </div>
                <div class="form-group">
                  <label>DOI / Enlace Web</label>
                  <input type="url" [(ngModel)]="newPub.doiUrl" name="pubDoi" class="form-input" placeholder="https://doi.org/10.1109/..." />
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showPubModal = false">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Publicación</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showEventModal) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3 class="modal-title">Registrar Participación en Congreso</h3>
            <form (ngSubmit)="saveEvent()" class="modal-form">
              <div class="form-group">
                <label>Título de la Ponencia *</label>
                <input type="text" [(ngModel)]="newEvent.tituloPonencia" name="evPonencia" required class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Nombre del Congreso / Evento *</label>
                  <input type="text" [(ngModel)]="newEvent.nombreEvento" name="evNombre" required class="form-input" />
                </div>
                <div class="form-group">
                  <label>Tipo de Evento *</label>
                  <select [(ngModel)]="newEvent.tipoEvento" name="evTipo" class="form-select">
                    <option value="CONGRESO_INTERNACIONAL">Congreso Internacional</option>
                    <option value="CONGRESO_NACIONAL">Congreso Nacional</option>
                    <option value="COLOQUIO">Coloquio / Simposio</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Fecha de Presentación *</label>
                  <input type="date" [(ngModel)]="newEvent.fechaPresentacion" name="evFecha" required class="form-input" />
                </div>
                <div class="form-group">
                  <label>Sede / Ciudad / País *</label>
                  <input type="text" [(ngModel)]="newEvent.sedeLugar" name="evSede" required class="form-input" placeholder="Valencia, España" />
                </div>
                <div class="form-group">
                  <label>Modalidad *</label>
                  <select [(ngModel)]="newEvent.modalidad" name="evModalidad" class="form-select">
                    <option value="PRESENCIAL">Presencial</option>
                    <option value="VIRTUAL">Virtual</option>
                  </select>
                </div>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showEventModal = false">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Evento</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showStayModal) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3 class="modal-title">Registrar Estancia de Investigación</h3>
            <form (ngSubmit)="saveStay()" class="modal-form">
              <div class="form-group">
                <label>Institución o Universidad Receptora *</label>
                <input type="text" [(ngModel)]="newStay.institucionReceptora" name="stayInst" required class="form-input" placeholder="Ej. MIT CSAIL" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>País *</label>
                  <input type="text" [(ngModel)]="newStay.pais" name="stayPais" required class="form-input" placeholder="Estados Unidos" />
                </div>
                <div class="form-group">
                  <label>Investigador Anfitrión / Responsable *</label>
                  <input type="text" [(ngModel)]="newStay.responsableEstancia" name="stayResp" required class="form-input" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Fecha de Inicio *</label>
                  <input type="date" [(ngModel)]="newStay.fechaInicio" name="stayInicio" required class="form-input" />
                </div>
                <div class="form-group">
                  <label>Fecha de Fin *</label>
                  <input type="date" [(ngModel)]="newStay.fechaFin" name="stayFin" required class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label>Objetivos y Resultados de la Estancia *</label>
                <textarea [(ngModel)]="newStay.objetivos" name="stayObj" required rows="3" class="form-textarea"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showStayModal = false">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Estancia</button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (showProdModal) {
        <div class="modal-backdrop">
          <div class="modal-card">
            <h3 class="modal-title">Registrar Producto de Investigación / Patente</h3>
            <form (ngSubmit)="saveProduct()" class="modal-form">
              <div class="form-row">
                <div class="form-group">
                  <label>Tipo de Producto *</label>
                  <select [(ngModel)]="newProd.tipoProducto" name="prodTipo" class="form-select">
                    <option value="SOFTWARE">Desarrollo de Software / Librería</option>
                    <option value="PROTOTIPO">Prototipo Tecnológico</option>
                    <option value="PATENTE">Registro de Patente</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Fecha de Registro *</label>
                  <input type="date" [(ngModel)]="newProd.fechaRegistro" name="prodFecha" required class="form-input" />
                </div>
              </div>
              <div class="form-group">
                <label>Título del Producto *</label>
                <input type="text" [(ngModel)]="newProd.titulo" name="prodTitulo" required class="form-input" />
              </div>
              <div class="form-group">
                <label>Descripción Técnica *</label>
                <textarea [(ngModel)]="newProd.descripcion" name="prodDesc" required rows="3" class="form-textarea"></textarea>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn-secondary" (click)="showProdModal = false">Cancelar</button>
                <button type="submit" class="btn-primary">Guardar Producto</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .academic-output-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sub-nav-bar {
      display: flex;
      gap: 8px;
      background-color: #FFFFFF;
      padding: 6px;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
    }

    .sub-tab-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      background: transparent;
      padding: 8px 12px;
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-text-muted);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .sub-tab-btn:hover {
      background-color: #F8F9FC;
      color: var(--color-primary);
    }

    .sub-tab-btn.active {
      background-color: var(--color-primary-light);
      color: var(--color-primary);
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .section-card {
      background-color: #FFFFFF;
      border-radius: var(--radius-md);
      border: 1px solid var(--color-border);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--color-border);
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--color-text-main);
    }

    .section-subtitle {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-top: 2px;
    }

    .btn-primary {
      padding: 8px 16px;
      background-color: var(--color-primary);
      color: #FFFFFF;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-primary:hover {
      background-color: var(--color-primary-hover);
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .pub-card, .event-card, .stay-card, .prod-card {
      background-color: #F8F9FC;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .pub-card-top, .event-type-row, .stay-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pub-type-badge, .event-badge, .country-pill, .prod-type-pill {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--color-primary);
      background-color: var(--color-primary-light);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .modality-tag, .sem-tag {
      font-size: 0.7rem;
      background-color: #E4E7EC;
      color: var(--color-text-muted);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .pub-title, .event-title, .inst-title, .prod-title {
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--color-text-main);
      line-height: 1.3;
    }

    .pub-authors, .event-name, .stay-resp, .stay-dates, .stay-obj, .prod-desc {
      font-size: 0.775rem;
      color: var(--color-text-muted);
      line-height: 1.4;
    }

    .pub-meta, .event-meta, .prod-footer {
      display: flex;
      justify-content: space-between;
      font-size: 0.725rem;
      color: var(--color-text-light);
      margin-top: 4px;
      border-top: 1px dashed var(--color-border);
      padding-top: 6px;
    }

    .pub-doi-link {
      font-size: 0.75rem;
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: underline;
      margin-top: 4px;
    }

    .empty-box {
      grid-column: 1 / -1;
      text-align: center;
      padding: 28px;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      background-color: #F8F9FC;
      border-radius: var(--radius-sm);
      border: 1px dashed var(--color-border);
    }

    /* Modal Styles */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-card {
      background: #FFFFFF;
      width: 560px;
      border-radius: var(--radius-md);
      padding: 24px;
      box-shadow: var(--shadow-lg);
    }

    .modal-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--color-text-main);
      margin-bottom: 16px;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-group label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-text-muted);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-input, .form-select, .form-textarea {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: 8px 12px;
      font-size: 0.825rem;
      outline: none;
      background-color: #FAFAFB;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: var(--color-primary);
      background-color: #FFFFFF;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 16px;
    }

    .btn-secondary {
      padding: 8px 16px;
      border: 1px solid var(--color-border);
      background: #FFFFFF;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }
  `]
})
export class AcademicOutputPanelComponent implements OnInit, OnChanges {
  @Input() student: Student | null = null;
  @Output() itemCreated = new EventEmitter<void>();

  private academicService = inject(AcademicOutputService);
  public authService = inject(AuthService);

  public activeSubTab: 'publicaciones' | 'congresos' | 'estancias' | 'otros' = 'publicaciones';

  public publications = signal<Publication[]>([]);
  public events = signal<AcademicEvent[]>([]);
  public stays = signal<ResearchStay[]>([]);
  public otherProducts = signal<OtherProduct[]>([]);

  // Modales
  public showPubModal = false;
  public showEventModal = false;
  public showStayModal = false;
  public showProdModal = false;

  public newPub: Partial<Publication> = {
    tipo: 'ARTICULO_JCR',
    estado: 'EN_REVISION'
  };

  public newEvent: Partial<AcademicEvent> = {
    tipoEvento: 'CONGRESO_INTERNACIONAL',
    modalidad: 'PRESENCIAL'
  };

  public newStay: Partial<ResearchStay> = {};
  public newProd: Partial<OtherProduct> = {
    tipoProducto: 'SOFTWARE'
  };

  ngOnInit(): void {
    this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['student'] && this.student) {
      this.loadData();
    }
  }

  public loadData(): void {
    if (!this.student) return;
    const stId = this.student.id;

    this.academicService.getPublications(stId).subscribe({
      next: (res) => this.publications.set(res.results)
    });

    this.academicService.getAcademicEvents(stId).subscribe({
      next: (res) => this.events.set(res.results)
    });

    this.academicService.getResearchStays(stId).subscribe({
      next: (res) => this.stays.set(res.results)
    });

    this.academicService.getOtherProducts(stId).subscribe({
      next: (res) => this.otherProducts.set(res.results)
    });
  }

  public savePublication(): void {
    if (!this.student) return;
    const semId = this.student.semesters?.[0]?.id || 1;
    this.newPub.student = this.student.id;
    this.newPub.semester = semId;

    this.academicService.createPublication(this.newPub).subscribe({
      next: () => {
        this.showPubModal = false;
        this.newPub = { tipo: 'ARTICULO_JCR', estado: 'EN_REVISION' };
        this.loadData();
        this.itemCreated.emit();
      }
    });
  }

  public saveEvent(): void {
    if (!this.student) return;
    const semId = this.student.semesters?.[0]?.id || 1;
    this.newEvent.student = this.student.id;
    this.newEvent.semester = semId;

    this.academicService.createAcademicEvent(this.newEvent).subscribe({
      next: () => {
        this.showEventModal = false;
        this.newEvent = { tipoEvento: 'CONGRESO_INTERNACIONAL', modalidad: 'PRESENCIAL' };
        this.loadData();
        this.itemCreated.emit();
      }
    });
  }

  public saveStay(): void {
    if (!this.student) return;
    const semId = this.student.semesters?.[0]?.id || 1;
    this.newStay.student = this.student.id;
    this.newStay.semester = semId;

    this.academicService.createResearchStay(this.newStay).subscribe({
      next: () => {
        this.showStayModal = false;
        this.newStay = {};
        this.loadData();
        this.itemCreated.emit();
      }
    });
  }

  public saveProduct(): void {
    if (!this.student) return;
    const semId = this.student.semesters?.[0]?.id || 1;
    this.newProd.student = this.student.id;
    this.newProd.semester = semId;

    this.academicService.createOtherProduct(this.newProd).subscribe({
      next: () => {
        this.showProdModal = false;
        this.newProd = { tipoProducto: 'SOFTWARE' };
        this.loadData();
        this.itemCreated.emit();
      }
    });
  }
}
