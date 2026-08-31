export interface ThesisComponents {
  protocolo: number;
  estadoArte: number;
  marcoTeorico: number;
  metodologia: number;
  analisis: number;
  redaccion: number;
}

export interface SemesterThesisHistory {
  semesterNumero: number;
  semesterId: number | null;
  hasData: boolean;
  porcentajeAvance: number;
  fechaRegistro: string | null;
  observaciones: string;
  componentesJson: ThesisComponents;
  registradoPorNombre: string | null;
}

export interface ThesisHistoryResponse {
  studentId: number;
  studentNombre: string;
  studentMatricula: string;
  semestersHistory: SemesterThesisHistory[];
}

export interface ThesisProgress {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  porcentajeAvance: number;
  componentesJson?: ThesisComponents;
  observaciones: string;
  registradoPor?: number;
  registradoPorNombre?: string;
  fechaRegistro: string;
  createdAt?: string;
  updatedAt?: string;
}
