import os
from django.db import models
from django.core.exceptions import ValidationError
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester


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

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='evidences'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='evidences'
    )
    actividad_tipo = models.CharField(
        'Tipo de Actividad Vinculada',
        max_length=20,
        choices=ActividadTipo.choices,
        default=ActividadTipo.OTRO
    )
    actividad_id = models.PositiveIntegerField('ID de Actividad Específica', null=True, blank=True)
    tipo = models.CharField(
        'Tipo de Evidencia',
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.ARCHIVO_LOCAL
    )
    archivo_adjunto = models.FileField(
        'Archivo Adjunto',
        upload_to='evidences/%Y/%m/',
        null=True,
        blank=True,
        validators=[validate_evidence_file]
    )
    url_doi = models.URLField('URL / Identificador DOI', blank=True, default='')
    mime_type = models.CharField('Tipo MIME', max_length=100, blank=True, default='')
    file_size_bytes = models.BigIntegerField('Tamaño en Bytes', null=True, blank=True)
    descripcion = models.CharField('Descripción / Título del Producto', max_length=255)
    fecha_carga = models.DateTimeField('Fecha de Carga', auto_now_add=True)
    cargado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='uploaded_evidences'
    )

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
