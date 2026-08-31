export type EvidenceActivityType = 'TUTORIA' | 'ACUERDO' | 'TESIS' | 'OTRO';
export type EvidenceType = 'ARCHIVO_LOCAL' | 'ENLACE_DOI';

export interface Evidence {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  actividadTipo: EvidenceActivityType;
  actividadTipoDisplay?: string;
  actividadId?: number | null;
  tipo: EvidenceType;
  archivoAdjunto?: string | null;
  archivoUrl?: string | null;
  urlDoi?: string;
  mimeType?: string;
  fileSizeBytes?: number | null;
  descripcion: string;
  fechaCarga: string;
  cargadoPor?: number | null;
  cargadoPorNombre?: string;
}
