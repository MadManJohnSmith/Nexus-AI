import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Publication, AcademicEvent, ResearchStay, OtherProduct } from '../models/academic-output.models';

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

@Injectable({
  providedIn: 'root'
})
export class AcademicOutputService {
  private http = inject(HttpClient);
  private pubUrl = '/api/v2/publications/';
  private eventUrl = '/api/v2/academic-events/';
  private stayUrl = '/api/v2/research-stays/';
  private prodUrl = '/api/v2/other-products/';

  // Publicaciones
  public getPublications(studentId?: number, semesterId?: number): Observable<PaginatedResponse<Publication>> {
    let params: any = {};
    if (studentId) params.student = studentId;
    if (semesterId) params.semester = semesterId;
    return this.http.get<any>(this.pubUrl, { params }).pipe(
      map(res => ({
        ...res,
        results: (res.results || []).map((p: any) => this.mapPublication(p))
      }))
    );
  }

  public createPublication(data: Partial<Publication>): Observable<any> {
    const payload = {
      student: data.student,
      semester: data.semester,
      titulo: data.titulo,
      autores_texto: data.autoresTexto,
      tipo: data.tipo,
      revista_editorial: data.revistaEditorial,
      estado: data.estado,
      fecha_publicacion: data.fechaPublicacion || null,
      doi_url: data.doiUrl || '',
      evidencia: data.evidencia || null
    };
    return this.http.post<any>(this.pubUrl, payload);
  }

  // Eventos Académicos
  public getAcademicEvents(studentId?: number, semesterId?: number): Observable<PaginatedResponse<AcademicEvent>> {
    let params: any = {};
    if (studentId) params.student = studentId;
    if (semesterId) params.semester = semesterId;
    return this.http.get<any>(this.eventUrl, { params }).pipe(
      map(res => ({
        ...res,
        results: (res.results || []).map((e: any) => this.mapAcademicEvent(e))
      }))
    );
  }

  public createAcademicEvent(data: Partial<AcademicEvent>): Observable<any> {
    const payload = {
      student: data.student,
      semester: data.semester,
      tipo_evento: data.tipoEvento,
      nombre_evento: data.nombreEvento,
      titulo_ponencia: data.tituloPonencia,
      fecha_presentacion: data.fechaPresentacion,
      sede_lugar: data.sedeLugar,
      modalidad: data.modalidad,
      evidencia: data.evidencia || null
    };
    return this.http.post<any>(this.eventUrl, payload);
  }

  // Estancias
  public getResearchStays(studentId?: number): Observable<PaginatedResponse<ResearchStay>> {
    let params: any = {};
    if (studentId) params.student = studentId;
    return this.http.get<any>(this.stayUrl, { params }).pipe(
      map(res => ({
        ...res,
        results: (res.results || []).map((s: any) => this.mapResearchStay(s))
      }))
    );
  }

  public createResearchStay(data: Partial<ResearchStay>): Observable<any> {
    const payload = {
      student: data.student,
      semester: data.semester,
      institucion_receptora: data.institucionReceptora,
      pais: data.pais,
      fecha_inicio: data.fechaInicio,
      fecha_fin: data.fechaFin,
      responsable_estancia: data.responsableEstancia,
      objetivos: data.objetivos,
      evidencia: data.evidencia || null
    };
    return this.http.post<any>(this.stayUrl, payload);
  }

  // Otros Productos
  public getOtherProducts(studentId?: number): Observable<PaginatedResponse<OtherProduct>> {
    let params: any = {};
    if (studentId) params.student = studentId;
    return this.http.get<any>(this.prodUrl, { params }).pipe(
      map(res => ({
        ...res,
        results: (res.results || []).map((pr: any) => this.mapOtherProduct(pr))
      }))
    );
  }

  public createOtherProduct(data: Partial<OtherProduct>): Observable<any> {
    const payload = {
      student: data.student,
      semester: data.semester,
      tipo_producto: data.tipoProducto,
      titulo: data.titulo,
      descripcion: data.descripcion,
      fecha_registro: data.fechaRegistro,
      evidencia: data.evidencia || null
    };
    return this.http.post<any>(this.prodUrl, payload);
  }

  // Mappers
  private mapPublication(raw: any): Publication {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      titulo: raw.titulo,
      autoresTexto: raw.autores_texto,
      tipo: raw.tipo,
      tipoDisplay: raw.tipo_display,
      revistaEditorial: raw.revista_editorial,
      estado: raw.estado,
      estadoDisplay: raw.estado_display,
      fechaPublicacion: raw.fecha_publicacion,
      doiUrl: raw.doi_url,
      evidencia: raw.evidencia,
      evidenciaDescripcion: raw.evidencia_descripcion,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }

  private mapAcademicEvent(raw: any): AcademicEvent {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      tipoEvento: raw.tipo_evento,
      tipoEventoDisplay: raw.tipo_evento_display,
      nombreEvento: raw.nombre_evento,
      tituloPonencia: raw.titulo_ponencia,
      fechaPresentacion: raw.fecha_presentacion,
      sedeLugar: raw.sede_lugar,
      modalidad: raw.modalidad,
      evidencia: raw.evidencia,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }

  private mapResearchStay(raw: any): ResearchStay {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      institucionReceptora: raw.institucion_receptora,
      pais: raw.pais,
      fechaInicio: raw.fecha_inicio,
      fechaFin: raw.fecha_fin,
      responsableEstancia: raw.responsable_estancia,
      objetivos: raw.objetivos,
      evidencia: raw.evidencia,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }

  private mapOtherProduct(raw: any): OtherProduct {
    return {
      id: raw.id,
      student: raw.student,
      studentMatricula: raw.student_matricula,
      studentNombre: raw.student_nombre,
      semester: raw.semester,
      semesterNumero: raw.semester_numero,
      tipoProducto: raw.tipo_producto,
      tipoProductoDisplay: raw.tipo_producto_display,
      titulo: raw.titulo,
      descripcion: raw.descripcion,
      fechaRegistro: raw.fecha_registro,
      evidencia: raw.evidencia,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at
    };
  }
}
