export type TutoringModalidad = 'PRESENCIAL' | 'VIRTUAL';

export interface TutoringParticipant {
  id?: number;
  session?: number;
  user: number;
  userNombre?: string;
  userEmail?: string;
  rolEnSesion: string;
  asistenciaConfirmada: boolean;
}

export interface TutoringObservation {
  id?: number;
  session?: number;
  autor: number;
  autorNombre?: string;
  temaRevisado: string;
  observacionesDetalladas: string;
  createdAt?: string;
}

export interface TutoringSession {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  fechaSesion: string;
  modalidad: TutoringModalidad;
  resumenGeneral: string;
  proximaReunionFecha?: string | null;
  proximaReunionNotas?: string;
  createdBy?: number;
  createdByNombre?: string;
  totalObservaciones?: number;
  totalParticipantes?: number;
  participants?: TutoringParticipant[];
  observations?: TutoringObservation[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTutoringSessionPayload {
  student: number;
  semester: number;
  fecha_sesion: string;
  modalidad: TutoringModalidad;
  resumen_general: string;
  proxima_reunion_fecha?: string | null;
  proxima_reunion_notas?: string;
  participants?: { user: number; rol_en_sesion: string; asistencia_confirmada: boolean }[];
  observations?: { autor: number; tema_revisado: string; observaciones_detalladas: string }[];
}
