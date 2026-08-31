export type TimelineNodeType = 'TUTORIA' | 'ACUERDO' | 'TESIS' | 'EVIDENCIA';

export interface TimelineEvent {
  id: string;
  rawId: number;
  tipo: TimelineNodeType;
  tipoLabel: string;
  titulo: string;
  fecha: string;
  resumen: string;
  semesterNumero?: number | null;
  autorNombre?: string;
  metadata: {
    modalidad?: string;
    proxima_reunion_fecha?: string | null;
    proxima_reunion_notas?: string;
    participantes?: string[];
    observaciones?: { tema: string; obs: string }[];
    estado?: string;
    is_overdue?: boolean;
    responsable?: string;
    porcentaje_avance?: number;
    componentes?: Record<string, number>;
    tipo?: string;
    archivo_url?: string | null;
    url_doi?: string;
    file_size_bytes?: number | null;
    actividad_tipo?: string;
  };
}

export interface TimelineResponse {
  studentId: number;
  studentNombre: string;
  studentMatricula: string;
  totalEventos: number;
  events: TimelineEvent[];
}

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
