export interface ThesisComponents {
  protocolo: number;
  estado_arte: number;
  marco_teorico: number;
  metodologia: number;
  analisis: number;
  redaccion: number;
}

export interface ThesisProgress {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  porcentajeAvance: number;
  componentesJson: ThesisComponents;
  observaciones: string;
  fechaRegistro: string;
  registradoPor?: number | null;
  registradoPorNombre?: string;
  createdAt?: string;
  updatedAt?: string;
}
