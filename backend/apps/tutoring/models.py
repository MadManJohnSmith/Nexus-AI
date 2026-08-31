from django.db import models
from django.core.exceptions import ValidationError
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester


class TutoringSession(models.Model):
    class Modalidad(models.TextChoices):
        PRESENCIAL = 'PRESENCIAL', 'Presencial'
        VIRTUAL = 'VIRTUAL', 'Virtual'

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='tutoring_sessions'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='tutoring_sessions'
    )
    fecha_sesion = models.DateField('Fecha de la Sesión')
    modalidad = models.CharField(
        'Modalidad',
        max_length=20,
        choices=Modalidad.choices,
        default=Modalidad.PRESENCIAL
    )
    resumen_general = models.TextField('Resumen General de la Sesión')
    proxima_reunion_fecha = models.DateField(
        'Fecha de Próxima Reunión Compromiso',
        null=True,
        blank=True
    )
    proxima_reunion_notas = models.TextField(
        'Notas y Objetivos de la Próxima Reunión',
        blank=True,
        default=''
    )
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tutoring_sessions'
    )
    created_at = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    updated_at = models.DateTimeField('Última Modificación', auto_now=True)

    class Meta:
        verbose_name = 'Sesión de Tutoría'
        verbose_name_plural = 'Sesiones de Tutoría'
        ordering = ['-fecha_sesion', '-created_at']

    def __str__(self):
        return f"Tutoría {self.student.matricula} - Semestre {self.semester.numero} ({self.fecha_sesion})"

    def clean(self):
        # CA-05.3: El sistema no permitirá asociar una actividad a un semestre inexistente o de otro estudiante
        if self.semester_id and self.student_id:
            if self.semester.student_id != self.student_id:
                raise ValidationError({
                    'semester': 'El semestre seleccionado no pertenece al expediente del estudiante especificado.'
                })


class TutoringParticipant(models.Model):
    session = models.ForeignKey(
        TutoringSession,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='tutoring_participations'
    )
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
    session = models.ForeignKey(
        TutoringSession,
        on_delete=models.CASCADE,
        related_name='observations'
    )
    autor = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='tutoring_observations'
    )
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
