export interface AlertItem {
  id: number;
  tipoAlerta: 'VENCIDO' | 'POR_VENCER';
  descripcion: string;
  studentId: number;
  studentNombre: string;
  studentMatricula: string;
  responsableNombre: string;
  fechaLimite: string;
  diasRestantes: number;
  estado: string;
}

export interface AlertsResponse {
  totalAlertas: number;
  totalVencidos: number;
  totalPorVencer: number;
  alertasVencidas: AlertItem[];
  alertasPorVencer: AlertItem[];
}

export interface TimelineEvent {
  id: string;
  rawId: number;
  tipo: 'TUTORIA' | 'ACUERDO' | 'TESIS' | 'EVIDENCIA' | 'PUBLICACION' | 'EVENTO' | 'ESTANCIA' | 'PRODUCTO';
  tipoLabel: string;
  titulo: string;
  fecha: string;
  resumen: string;
  semesterNumero?: number;
  autorNombre: string;
  metadata?: any;
}

export interface TimelineResponse {
  studentId: number;
  studentNombre: string;
  studentMatricula: string;
  totalEventos: number;
  events: TimelineEvent[];
}

export interface CoordinatorKPIs {
  totalEstudiantesActivos: number;
  totalTutorias: number;
  totalAcuerdosPendientes: number;
  totalAcuerdosVencidos: number;
  totalPublicaciones: number;
  totalEventos: number;
  totalEstancias: number;
}

export interface CasoAtencion {
  studentId: number;
  matricula: string;
  nombreCompleto: string;
  cohorte: string;
  semestreActual: number;
  asesorPrincipal: string;
  fechaUltimaTutoria: string;
  diasSinTutoria: number;
  acuerdosVencidosCount: number;
  porcentajeTesis: number;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  motivosRiesgo: string[];
}

export interface CohorteDistribucionTesis {
  cohorte: string;
  totalEstudiantes: number;
  promedioAvanceTesis: number;
}

export interface CoordinatorDashboardResponse {
  kpis: CoordinatorKPIs;
  casosAtencion: CasoAtencion[];
  distribucionTesisCohorte: CohorteDistribucionTesis[];
}
