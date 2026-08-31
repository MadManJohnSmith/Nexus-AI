export type AgreementState = 'PENDIENTE' | 'EN_PROCESO' | 'CONCLUIDO' | 'VENCIDO';

export interface AgreementAuditLog {
  id: number;
  agreement: number;
  estadoAnterior: string;
  estadoNuevo: string;
  cambiadoPor?: number;
  cambiadoPorNombre?: string;
  fechaCambio: string;
  comentario?: string;
}

export interface Agreement {
  id: number;
  session?: number | null;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester?: number | null;
  semesterNumero?: number | null;
  descripcion: string;
  responsable: number;
  responsableNombre?: string;
  responsableEmail?: string;
  fechaLimite: string;
  estado: AgreementState;
  estadoDisplay?: string;
  fechaCambioEstado?: string;
  modificadoPor?: number | null;
  modificadoPorNombre?: string;
  isOverdue?: boolean;
  auditLogs?: AgreementAuditLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AgreementFilterParams {
  student?: number;
  semester?: number;
  responsable?: number;
  estado?: AgreementState;
  search?: string;
  page?: number;
  pageSize?: number;
}
