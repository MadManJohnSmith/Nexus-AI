from django.db import models
from apps.students.models import Student, Semester
from apps.evidence.models import Evidence


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

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='publications'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='publications'
    )
    titulo = models.CharField('Título de la Publicación', max_length=255)
    autores_texto = models.CharField('Autores (Formato APA)', max_length=255)
    tipo = models.CharField(
        'Tipo de Publicación',
        max_length=30,
        choices=TipoPublicacion.choices,
        default=TipoPublicacion.ARTICULO_JCR
    )
    revista_editorial = models.CharField('Revista o Editorial', max_length=255)
    estado = models.CharField(
        'Estado del Artículo',
        max_length=20,
        choices=Estado.choices,
        default=Estado.PREPARACION
    )
    fecha_publicacion = models.DateField('Fecha de Publicación / Envío', null=True, blank=True)
    doi_url = models.URLField('DOI o Enlace Web', blank=True, default='')
    evidencia = models.ForeignKey(
        Evidence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='publications'
    )
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

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='academic_events'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='academic_events'
    )
    tipo_evento = models.CharField(
        'Tipo de Evento Académico',
        max_length=30,
        choices=TipoEvento.choices,
        default=TipoEvento.CONGRESO_INTERNACIONAL
    )
    nombre_evento = models.CharField('Nombre del Evento / Conferencia', max_length=255)
    titulo_ponencia = models.CharField('Título de la Ponencia o Presentación', max_length=255)
    fecha_presentacion = models.DateField('Fecha de Presentación')
    sede_lugar = models.CharField('Sede / Ciudad / País', max_length=255)
    modalidad = models.CharField(
        'Modalidad',
        max_length=20,
        choices=Modalidad.choices,
        default=Modalidad.PRESENCIAL
    )
    evidencia = models.ForeignKey(
        Evidence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='academic_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Evento Académico y Congreso'
        verbose_name_plural = 'Eventos Académicos y Congresos'
        ordering = ['-fecha_presentacion']

    def __str__(self):
        return f"{self.titulo_ponencia} ({self.nombre_evento})"


class ResearchStay(models.Model):
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='research_stays'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='research_stays'
    )
    institucion_receptora = models.CharField('Institución o Universidad Receptora', max_length=255)
    pais = models.CharField('País', max_length=100)
    fecha_inicio = models.DateField('Fecha de Inicio')
    fecha_fin = models.DateField('Fecha de Fin')
    responsable_estancia = models.CharField('Investigador Anfitrión / Responsable', max_length=255)
    objetivos = models.TextField('Objetivos y Resultados de la Estancia')
    evidencia = models.ForeignKey(
        Evidence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='research_stays'
    )
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

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='other_products'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='other_products'
    )
    tipo_producto = models.CharField(
        'Tipo de Producto',
        max_length=30,
        choices=TipoProducto.choices,
        default=TipoProducto.SOFTWARE
    )
    titulo = models.CharField('Título del Producto', max_length=255)
    descripcion = models.TextField('Descripción Técnica y Resultados')
    fecha_registro = models.DateField('Fecha de Registro')
    evidencia = models.ForeignKey(
        Evidence,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='other_products'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Otro Producto de Investigación'
        verbose_name_plural = 'Otros Productos de Investigación'
        ordering = ['-fecha_registro']

    def __str__(self):
        return f"{self.get_tipo_producto_display()}: {self.titulo}"
