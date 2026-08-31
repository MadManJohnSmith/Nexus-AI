"""
================================================================================
N.E.X.U.S. - MODELOS ORM CONSOLIDADOS DEL SISTEMA COMPLETO
================================================================================
Módulos integrados:
  1. apps.identity (CustomUser)
  2. apps.students (Student, Semester, AcademicCommittee)
  3. apps.tutoring (TutoringSession, TutoringParticipant, TutoringObservation)
  4. apps.agreements (Agreement, AgreementAuditLog)
  5. apps.thesis (ThesisProgress)
  6. apps.evidence (Evidence)
  7. apps.academic_output (Publication, AcademicEvent, ResearchStay, OtherProduct)
  8. apps.monitoring (Servicios analíticos / agregación sin tablas directas)
  9. apps.reporting (Servicios documentales y exportación sin tablas directas)
================================================================================
"""

import os
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

# ==============================================================================
# 1. APP: IDENTITY (Autenticación y RBAC)
# ==============================================================================

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('El correo electrónico institucional es obligatorio.')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', CustomUser.Role.COORDINADOR)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('El superusuario debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('El superusuario debe tener is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        COORDINADOR = 'COORDINADOR', 'Coordinador de Posgrado'
        ASESOR = 'ASESOR', 'Tutor / Asesor Académico'
        ESTUDIANTE = 'ESTUDIANTE', 'Estudiante de Doctorado'

    email = models.EmailField('Correo Electrónico', unique=True, max_length=255, db_index=True)
    first_name = models.CharField('Nombre(s)', max_length=150)
    last_name = models.CharField('Apellido(s)', max_length=150)
    role = models.CharField('Rol Institucional', max_length=20, choices=Role.choices, default=Role.ESTUDIANTE)
    is_active = models.BooleanField('Activo', default=True)
    is_staff = models.BooleanField('Acceso a Staff', default=False)
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-created_at']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        return f"{self.email} ({self.get_role_display()})"


# ==============================================================================
# 2. APP: STUDENTS (Ficha, Semestres y Comité Tutoral)
# ==============================================================================

class Student(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='student_profile')
    matricula = models.CharField('Matrícula Institucional', max_length=30, unique=True, db_index=True)
    nombre_completo = models.CharField('Nombre Completo', max_length=255)
    programa_doctoral = models.CharField('Programa Doctoral', max_length=255, default='Doctorado en Ciencias de la Computación')
    fecha_ingreso = models.DateField('Fecha de Ingreso')
    cohorte = models.CharField('Cohorte', max_length=30)
    estatus_activo = models.BooleanField('Estatus Activo', default=True)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Estudiante'
        verbose_name_plural = 'Estudiantes'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.matricula} - {self.nombre_completo}"

    @property
    def email(self):
        return self.user.email if self.user else ""

    @property
    def semestre_actual(self):
        active_semester = self.semesters.filter(is_active=True).first()
        if active_semester:
            return active_semester.numero
        latest = self.semesters.order_by('-numero').first()
        return latest.numero if latest else 1

    @property
    def asesor_principal(self):
        member = self.academic_committee.filter(
            rol_comite=AcademicCommittee.RolComite.ASESOR_PRINCIPAL,
            is_active=True
        ).select_related('user').first()
        return member.user.full_name if member and member.user else "Sin Asignar"

    @property
    def coasesor(self):
        member = self.academic_committee.filter(
            rol_comite=AcademicCommittee.RolComite.COASESOR,
            is_active=True
        ).select_related('user').first()
        return member.user.full_name if member and member.user else "Sin Asignar"


class Semester(models.Model):
    SEMESTER_CHOICES = [(i, f'Semestre {i}') for i in range(1, 7)]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='semesters')
    numero = models.PositiveSmallIntegerField('Número de Semestre', choices=SEMESTER_CHOICES)
    fecha_inicio = models.DateField('Fecha de Inicio')
    fecha_fin = models.DateField('Fecha de Fin')
    is_active = models.BooleanField('Semestre en Curso', default=False)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Semestre'
        verbose_name_plural = 'Semestres'
        unique_together = ('student', 'numero')
        ordering = ['student', 'numero']

    def __str__(self):
        return f"Estudiante {self.student.matricula} - Semestre {self.numero}"

    def clean(self):
        if self.numero < 1 or self.numero > 6:
            raise ValidationError({'numero': 'El número de semestre debe estar comprendido entre 1 y 6.'})
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio > self.fecha_fin:
            raise ValidationError({'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.is_active:
            Semester.objects.filter(student=self.student, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class AcademicCommittee(models.Model):
    class RolComite(models.TextChoices):
        ASESOR_PRINCIPAL = 'ASESOR_PRINCIPAL', 'Asesor Principal'
        COASESOR = 'COASESOR', 'Coasesor'
        MIEMBRO_COMITE = 'MIEMBRO_COMITE', 'Miembro del Comité'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_committee')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='committee_assignments')
    rol_comite = models.CharField('Rol en Comité', max_length=30, choices=RolComite.choices)
    fecha_asignacion = models.DateField('Fecha de Asignación', default=timezone.localdate)
    is_active = models.BooleanField('Activo en Comité', default=True)
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Comité Académico'
        verbose_name_plural = 'Comités Académicos'
        unique_together = ('student', 'user', 'rol_comite')
        ordering = ['student', 'rol_comite']

    def __str__(self):
        return f"{self.get_rol_comite_display()}: {self.user.full_name} ({self.student.matricula})"


# ==============================================================================
# 3. APP: TUTORING (Sesiones, Participantes y Observaciones)
# ==============================================================================

class TutoringSession(models.Model):
    class Modalidad(models.TextChoices):
        PRESENCIAL = 'PRESENCIAL', 'Presencial'
        VIRTUAL = 'VIRTUAL', 'Virtual'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='tutoring_sessions')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='tutoring_sessions')
    fecha_sesion = models.DateField('Fecha de la Sesión')
    modalidad = models.CharField('Modalidad', max_length=20, choices=Modalidad.choices, default=Modalidad.PRESENCIAL)
    resumen_general = models.TextField('Resumen General de la Sesión')
    proxima_reunion_fecha = models.DateField('Fecha de Próxima Reunión Compromiso', null=True, blank=True)
    proxima_reunion_notas = models.TextField('Notas y Objetivos de la Próxima Reunión', blank=True, default='')
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_tutoring_sessions')
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Modificación', auto_now=True)

    class Meta:
        verbose_name = 'Sesión de Tutoría'
        verbose_name_plural = 'Sesiones de Tutoría'
        ordering = ['-fecha_sesion', '-created_at']

    def __str__(self):
        return f"Tutoría {self.student.matricula} - Semestre {self.semester.numero} ({self.fecha_sesion})"

    def clean(self):
        if self.semester_id and self.student_id:
            if self.semester.student_id != self.student_id:
                raise ValidationError({'semester': 'El semestre seleccionado no pertenece al expediente del estudiante especificado.'})


class TutoringParticipant(models.Model):
    session = models.ForeignKey(TutoringSession, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tutoring_participations')
    rol_en_sesion = models.CharField('Rol en la Sesión', max_length=60, default='Asesor')
    asistencia_confirmada = models.BooleanField('Asistencia Confirmada', default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Participante de Tutoría'
        verbose_name_plural = 'Participantes de Tutoría'
        unique_together = ('session', 'user')

    def __str__(self):
        return f"{self.user.full_name} ({self.rol_en_sesion}) - Sesión #{self.session_id}"


class TutoringObservation(models.Model):
    session = models.ForeignKey(TutoringSession, on_delete=models.CASCADE, related_name='observations')
    autor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='tutoring_observations')
    tema_revisado = models.CharField('Tema o Avance Revisado', max_length=255)
    observaciones_detalladas = models.TextField('Observaciones y Comentarios Académicos')
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Modificación', auto_now=True)

    class Meta:
        verbose_name = 'Observación de Tutoría'
        verbose_name_plural = 'Observaciones de Tutoría'
        ordering = ['created_at']

    def __str__(self):
        return f"Observación por {self.autor.full_name}: {self.tema_revisado}"


# ==============================================================================
# 4. APP: AGREEMENTS (Acuerdos y Bitácora de Auditoría)
# ==============================================================================

class Agreement(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROCESO = 'EN_PROCESO', 'En Proceso'
        CONCLUIDO = 'CONCLUIDO', 'Concluido'
        VENCIDO = 'VENCIDO', 'Vencido'

    session = models.ForeignKey(TutoringSession, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreements')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='agreements')
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreements')
    descripcion = models.TextField('Descripción del Compromiso / Acuerdo')
    responsable = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='assigned_agreements')
    fecha_limite = models.DateField('Fecha Límite de Cumplimiento')
    estado = models.CharField('Estado del Acuerdo', max_length=20, choices=Estado.choices, default=Estado.PENDIENTE)
    fecha_cambio_estado = models.DateTimeField('Fecha de Último Cambio de Estado', auto_now=True)
    modificado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='modified_agreements')
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Acuerdo de Tutoría'
        verbose_name_plural = 'Acuerdos de Tutoría'
        ordering = ['fecha_limite', '-created_at']

    def __str__(self):
        return f"Acuerdo #{self.id} [{self.get_estado_display()}]: {self.descripcion[:40]}"

    @property
    def is_overdue(self):
        if self.estado in [self.Estado.PENDIENTE, self.Estado.EN_PROCESO]:
            return self.fecha_limite < timezone.localdate()
        return self.estado == self.Estado.VENCIDO


class AgreementAuditLog(models.Model):
    agreement = models.ForeignKey(Agreement, on_delete=models.CASCADE, related_name='audit_logs')
    estado_anterior = models.CharField('Estado Anterior', max_length=20)
    estado_nuevo = models.CharField('Estado Nuevo', max_length=20)
    cambiado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='agreement_state_changes')
    fecha_cambio = models.DateTimeField('Fecha del Cambio', auto_now_add=True)
    comentario = models.TextField('Comentario o Motivo del Cambio', blank=True, default='')

    class Meta:
        verbose_name = 'Bitácora de Acuerdo'
        verbose_name_plural = 'Bitácoras de Acuerdos'
        ordering = ['-fecha_cambio']

    def __str__(self):
        return f"Acuerdo #{self.agreement_id}: {self.estado_anterior} -> {self.estado_nuevo}"


# ==============================================================================
# 5. APP: THESIS (Avances de Tesis y Desglose JSON)
# ==============================================================================

def default_thesis_components():
    return {
        'protocolo': 100,
        'estado_arte': 80,
        'marco_teorico': 60,
        'metodologia': 40,
        'analisis': 20,
        'redaccion': 10
    }

class ThesisProgress(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='thesis_progress_records')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='thesis_progress_records')
    porcentaje_avance = models.PositiveSmallIntegerField(
        'Porcentaje Global de Avance de Tesis',
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text='Porcentaje de 0 a 100 del avance longitudinal de investigación.'
    )
    componentes_json = models.JSONField(
        'Desglose de Componentes de Tesis',
        default=default_thesis_components,
        help_text='JSON con el estado de avance por áreas temáticas.'
    )
    observaciones = models.TextField('Observaciones Académicas del Avance', blank=True, default='')
    fecha_registro = models.DateField('Fecha del Registro', auto_now_add=True)
    registrado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='registered_thesis_progress')
    created_at = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última Actualización', auto_now=True)

    class Meta:
        verbose_name = 'Avance de Tesis Doctoral'
        verbose_name_plural = 'Avances de Tesis Doctoral'
        ordering = ['-fecha_registro', '-created_at']

    def __str__(self):
        return f"Tesis {self.student.matricula} - Semestre {self.semester.numero}: {self.porcentaje_avance}%"

    def clean(self):
        if self.semester_id and self.student_id:
            if self.semester.student_id != self.student_id:
                raise ValidationError({'semester': 'El semestre seleccionado no corresponde al expediente del estudiante especificado.'})
        if self.porcentaje_avance < 0 or self.porcentaje_avance > 100:
            raise ValidationError({'porcentaje_avance': 'El porcentaje de avance debe estar estrictamente entre 0 y 100.'})


# ==============================================================================
# 6. APP: EVIDENCE (Repositorio Documental y Enlaces DOI)
# ==============================================================================

ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.zip', '.docx', '.doc']
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB

def validate_evidence_file(file_obj):
    if not file_obj:
        return
    if file_obj.size > MAX_FILE_SIZE:
        raise ValidationError(f'El archivo excede el tamaño máximo permitido de 15 MB ({file_obj.size / (1024*1024):.1f} MB subidos).')
    ext = os.path.splitext(file_obj.name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f'Extensión de archivo "{ext}" no autorizada. Formatos permitidos: PDF, PNG, JPG, ZIP, DOCX.')

class Evidence(models.Model):
    class ActividadTipo(models.TextChoices):
        TUTORIA = 'TUTORIA', 'Sesión de Tutoría'
        ACUERDO = 'ACUERDO', 'Compromiso / Acuerdo'
        TESIS = 'TESIS', 'Avance de Tesis'
        OTRO = 'OTRO', 'Otro Producto'

    class Tipo(models.TextChoices):
        ARCHIVO_LOCAL = 'ARCHIVO_LOCAL', 'Archivo Local (PDF/Imagen/Documento)'
        ENLACE_DOI = 'ENLACE_DOI', 'Enlace Digital / DOI Indexado'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='evidences')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='evidences')
    actividad_tipo = models.CharField('Tipo de Actividad Vinculada', max_length=20, choices=ActividadTipo.choices, default=ActividadTipo.OTRO)
    actividad_id = models.PositiveIntegerField('ID de Actividad Específica', null=True, blank=True)
    tipo = models.CharField('Tipo de Evidencia', max_length=20, choices=Tipo.choices, default=Tipo.ARCHIVO_LOCAL)
    archivo_adjunto = models.FileField('Archivo Adjunto', upload_to='evidences/%Y/%m/', null=True, blank=True, validators=[validate_evidence_file])
    url_doi = models.URLField('URL / Identificador DOI', blank=True, default='')
    mime_type = models.CharField('Tipo MIME', max_length=100, blank=True, default='')
    file_size_bytes = models.BigIntegerField('Tamaño en Bytes', null=True, blank=True)
    descripcion = models.CharField('Descripción / Título del Producto', max_length=255)
    fecha_carga = models.DateTimeField('Fecha de Carga', auto_now_add=True)
    cargado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_evidences')

    class Meta:
        verbose_name = 'Evidencia Documental'
        verbose_name_plural = 'Evidencias Documentales'
        ordering = ['-fecha_carga']

    def __str__(self):
        return f"Evidencia #{self.id} [{self.tipo}]: {self.descripcion} ({self.student.matricula})"

    def clean(self):
        if self.tipo == self.Tipo.ARCHIVO_LOCAL and not self.archivo_adjunto:
            raise ValidationError({'archivo_adjunto': 'Debe adjuntar un archivo local válido.'})
        if self.tipo == self.Tipo.ENLACE_DOI and not self.url_doi:
            raise ValidationError({'url_doi': 'Debe proveer una URL o enlace DOI válido.'})
        if self.semester_id and self.student_id and self.semester.student_id != self.student_id:
            raise ValidationError({'semester': 'El semestre no coincide con el estudiante.'})

    def save(self, *args, **kwargs):
        if self.archivo_adjunto and hasattr(self.archivo_adjunto, 'size'):
            self.file_size_bytes = self.archivo_adjunto.size
        super().save(*args, **kwargs)


# ==============================================================================
# 7. APP: ACADEMIC_OUTPUT (Publicaciones, Congresos, Estancias y Productos)
# ==============================================================================

class Publication(models.Model):
    class TipoPublicacion(models.TextChoices):
        ARTICULO_JCR = 'ARTICULO_JCR', 'Artículo Indexado JCR / Scopus'
        ARTICULO_CONACYT = 'ARTICULO_CONACYT', 'Artículo Revista Padrón Conahcyt'
        CAPITULO_LIBRO = 'CAPITULO_LIBRO', 'Capítulo de Libro Arbitrado'

    class Estado(models.TextChoices):
        PREPARACION = 'PREPARACION', 'En Preparación'
        ENVIADO = 'ENVIADO', 'Enviado a Editorial'
        EN_REVISION = 'EN_REVISION', 'En Revisión por Pares'
        ACEPTADO = 'ACEPTADO', 'Aceptado para Publicación'
        PUBLICADO = 'PUBLICADO', 'Publicado Oficialmente'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='publications')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='publications')
    titulo = models.CharField('Título de la Publicación', max_length=255)
    autores_texto = models.CharField('Autores (Formato APA)', max_length=255)
    tipo = models.CharField('Tipo de Publicación', max_length=30, choices=TipoPublicacion.choices, default=TipoPublicacion.ARTICULO_JCR)
    revista_editorial = models.CharField('Revista o Editorial', max_length=255)
    estado = models.CharField('Estado del Artículo', max_length=20, choices=Estado.choices, default=Estado.PREPARACION)
    fecha_publicacion = models.DateField('Fecha de Publicación / Envío', null=True, blank=True)
    doi_url = models.URLField('DOI o Enlace Web', blank=True, default='')
    evidencia = models.ForeignKey(Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name='publications')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Publicación Científica'
        verbose_name_plural = 'Publicaciones Científicas'
        ordering = ['-fecha_publicacion', '-created_at']

    def __str__(self):
        return f"{self.titulo} [{self.get_estado_display()}]"


class AcademicEvent(models.Model):
    class TipoEvento(models.TextChoices):
        CONGRESO_NACIONAL = 'CONGRESO_NACIONAL', 'Congreso Nacional'
        CONGRESO_INTERNACIONAL = 'CONGRESO_INTERNACIONAL', 'Congreso Internacional'
        COLOQUIO = 'COLOQUIO', 'Coloquio / Simposio de Posgrado'

    class Modalidad(models.TextChoices):
        PRESENCIAL = 'PRESENCIAL', 'Presencial'
        VIRTUAL = 'VIRTUAL', 'Virtual'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='academic_events')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='academic_events')
    tipo_evento = models.CharField('Tipo de Evento Académico', max_length=30, choices=TipoEvento.choices, default=TipoEvento.CONGRESO_INTERNACIONAL)
    nombre_evento = models.CharField('Nombre del Evento / Conferencia', max_length=255)
    titulo_ponencia = models.CharField('Título de la Ponencia o Presentación', max_length=255)
    fecha_presentacion = models.DateField('Fecha de Presentación')
    sede_lugar = models.CharField('Sede / Ciudad / País', max_length=255)
    modalidad = models.CharField('Modalidad', max_length=20, choices=Modalidad.choices, default=Modalidad.PRESENCIAL)
    evidencia = models.ForeignKey(Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name='academic_events')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Evento Académico y Congreso'
        verbose_name_plural = 'Eventos Académicos y Congresos'
        ordering = ['-fecha_presentacion']

    def __str__(self):
        return f"{self.titulo_ponencia} ({self.nombre_evento})"


class ResearchStay(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='research_stays')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='research_stays')
    institucion_receptora = models.CharField('Institución o Universidad Receptora', max_length=255)
    pais = models.CharField('País', max_length=100)
    fecha_inicio = models.DateField('Fecha de Inicio')
    fecha_fin = models.DateField('Fecha de Fin')
    responsable_estancia = models.CharField('Investigador Anfitrión / Responsable', max_length=255)
    objetivos = models.TextField('Objetivos y Resultados de la Estancia')
    evidencia = models.ForeignKey(Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name='research_stays')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Estancia de Investigación Doctoral'
        verbose_name_plural = 'Estancias de Investigación Doctoral'
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"Estancia en {self.institucion_receptora} ({self.student.matricula})"


class OtherProduct(models.Model):
    class TipoProducto(models.TextChoices):
        SOFTWARE = 'SOFTWARE', 'Desarrollo de Software / Librería'
        PROTOTIPO = 'PROTOTIPO', 'Prototipo Tecnológico'
        PATENTE = 'PATENTE', 'Registro de Patente o Modelo de Utilidad'

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='other_products')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='other_products')
    tipo_producto = models.CharField('Tipo de Producto', max_length=30, choices=TipoProducto.choices, default=TipoProducto.SOFTWARE)
    titulo = models.CharField('Título del Producto', max_length=255)
    descripcion = models.TextField('Descripción Técnica y Resultados')
    fecha_registro = models.DateField('Fecha de Registro')
    evidencia = models.ForeignKey(Evidence, on_delete=models.SET_NULL, null=True, blank=True, related_name='other_products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Otro Producto de Investigación'
        verbose_name_plural = 'Otros Productos de Investigación'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"{self.get_tipo_producto_display()}: {self.titulo}"
