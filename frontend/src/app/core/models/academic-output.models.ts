export interface Publication {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  titulo: string;
  autoresTexto: string;
  tipo: 'ARTICULO_JCR' | 'ARTICULO_CONACYT' | 'CAPITULO_LIBRO';
  tipoDisplay?: string;
  revistaEditorial: string;
  estado: 'PREPARACION' | 'ENVIADO' | 'EN_REVISION' | 'ACEPTADO' | 'PUBLICADO';
  estadoDisplay?: string;
  fechaPublicacion?: string;
  doiUrl?: string;
  evidencia?: number;
  evidenciaDescripcion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AcademicEvent {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  tipoEvento: 'CONGRESO_NACIONAL' | 'CONGRESO_INTERNACIONAL' | 'COLOQUIO';
  tipoEventoDisplay?: string;
  nombreEvento: string;
  tituloPonencia: string;
  fechaPresentacion: string;
  sedeLugar: string;
  modalidad: 'PRESENCIAL' | 'VIRTUAL';
  evidencia?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchStay {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  institucionReceptora: string;
  pais: string;
  fechaInicio: string;
  fechaFin: string;
  responsableEstancia: string;
  objetivos: string;
  evidencia?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OtherProduct {
  id: number;
  student: number;
  studentMatricula?: string;
  studentNombre?: string;
  semester: number;
  semesterNumero?: number;
  tipoProducto: 'SOFTWARE' | 'PROTOTIPO' | 'PATENTE';
  tipoProductoDisplay?: string;
  titulo: string;
  descripcion: string;
  fechaRegistro: string;
  evidencia?: number;
  createdAt?: string;
  updatedAt?: string;
}
