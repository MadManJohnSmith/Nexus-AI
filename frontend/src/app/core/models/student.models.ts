import { UserRole } from './auth.models';

export type CommitteeRole = 'ASESOR_PRINCIPAL' | 'COASESOR' | 'MIEMBRO_COMITE';

export type AgreementStatus = 'PENDIENTE' | 'EN_PROCESO' | 'CONCLUIDO' | 'VENCIDO';

export interface AcademicCommitteeMember {
  id: number;
  student: number;
  studentMatricula?: string;
  user: number;
  userNombre: string;
  userEmail: string;
  userRole: UserRole;
  rolComite: CommitteeRole;
  rolComiteDisplay: string;
  fechaAsignacion: string;
  isActive: boolean;
}

export interface Semester {
  id: number;
  student: number;
  studentMatricula?: string;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  isActive: boolean;
}

export interface Student {
  id: number;
  user?: number | null;
  matricula: string;
  nombreCompleto: string;
  email?: string;
  programaDoctoral: string;
  fechaIngreso: string;
  cohorte: string;
  estatusActivo: boolean;
  semestreActual: number;
  asesorPrincipal: string;
  coasesor: string;
  totalSemestres: number;
  semesters?: Semester[];
  academicCommittee?: AcademicCommitteeMember[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
