from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester


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
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='thesis_progress_records'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.CASCADE,
        related_name='thesis_progress_records'
    )
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
    registrado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registered_thesis_progress'
    )
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
                raise ValidationError({
                    'semester': 'El semestre seleccionado no corresponde al expediente del estudiante especificado.'
                })
        if self.porcentaje_avance < 0 or self.porcentaje_avance > 100:
            raise ValidationError({
                'porcentaje_avance': 'El porcentaje de avance debe estar estrictamente entre 0 y 100.'
            })
