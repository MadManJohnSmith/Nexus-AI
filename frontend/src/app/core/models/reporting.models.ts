export interface StudentDemographics {
  id: number;
  matricula: string;
  nombreCompleto: string;
  email: string | null;
  programaDoctoral: string;
  fechaIngreso: string;
  cohorte: string;
  semestreActual: number;
  asesorPrincipal: string;
  coasesor: string | null;
  estatusActivo: boolean;
}

export interface CommitteeMemberDossier {
  id: number;
  userId: number;
  nombre: string;
  email: string;
  rolComite: string;
  rolComiteDisplay: string;
  fechaAsignacion: string;
  isActive: boolean;
}

export interface SemesterDossier {
  id: number;
  numero: number;
  fechaInicio: string;
  fechaFin: string;
  isActive: boolean;
}

export interface TutoringDossier {
  id: number;
  semesterNumero: number;
  fechaSesion: string;
  modalidad: string;
  resumenGeneral: string;
  proximaReunionFecha: string | null;
  proximaReunionNotas: string | null;
  createdBy: string;
  participantes: string[];
  observaciones: {
    tema: string;
    detalle: string;
    autor: string;
  }[];
}

export interface AgreementDossier {
  id: number;
  semesterNumero: number | null;
  descripcion: string;
  responsableNombre: string;
  fechaLimite: string;
  estado: string;
  isOverdue: boolean;
}

export interface ThesisHistoryDossier {
  id: number;
  semesterNumero: number;
  porcentajeAvance: number;
  fechaRegistro: string;
  componentesJson: any;
  observaciones: string;
  registradoPor: string;
}

export interface PublicationDossier {
  id: number;
  semesterNumero: number;
  titulo: string;
  autores: string;
  tipo: string;
  revistaEditorial: string;
  estado: string;
  fechaPublicacion: string | null;
  doiUrl: string;
}

export interface AcademicEventDossier {
  id: number;
  semesterNumero: number;
  tipoEvento: string;
  nombreEvento: string;
  tituloPonencia: string;
  fechaPresentacion: string;
  sedeLugar: string;
  modalidad: string;
}

export interface ResearchStayDossier {
  id: number;
  semesterNumero: number;
  institucionReceptora: string;
  pais: string;
  fechaInicio: string;
  fechaFin: string;
  responsableEstancia: string;
  objetivos: string;
}

export interface EvidenceDossier {
  id: number;
  semesterNumero: number;
  tipo: string;
  descripcion: string;
  fechaCarga: string;
  cargadoPor: string;
  archivoUrl: string | null;
  urlDoi: string;
  actividadTipo: string;
}

export interface FullDossierResponse {
  demographics: StudentDemographics;
  academicCommittee: CommitteeMemberDossier[];
  semesters: SemesterDossier[];
  tutorings: TutoringDossier[];
  agreements: AgreementDossier[];
  thesisHistory: ThesisHistoryDossier[];
  publications: PublicationDossier[];
  academicEvents: AcademicEventDossier[];
  researchStays: ResearchStayDossier[];
  evidences: EvidenceDossier[];
  generatedAt: string;
}
