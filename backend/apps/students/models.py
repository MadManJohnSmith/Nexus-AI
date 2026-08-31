from django.db import models
from django.utils import timezone
from apps.identity.models import CustomUser


class Student(models.Model):
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='student_profile'
    )
    matricula = models.CharField(
        'Matrícula Institucional',
        max_length=30,
        unique=True,
        db_index=True
    )
    nombre_completo = models.CharField(
        'Nombre Completo',
        max_length=255
    )
    programa_doctoral = models.CharField(
        'Programa Doctoral',
        max_length=255,
        default='Doctorado en Ciencias de la Computación'
    )
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
    SEMESTER_CHOICES = [
        (1, 'Semestre 1'),
        (2, 'Semestre 2'),
        (3, 'Semestre 3'),
        (4, 'Semestre 4'),
        (5, 'Semestre 5'),
        (6, 'Semestre 6'),
    ]

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='semesters'
    )
    numero = models.PositiveSmallIntegerField(
        'Número de Semestre',
        choices=SEMESTER_CHOICES
    )
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
        from django.core.exceptions import ValidationError
        if self.numero < 1 or self.numero > 6:
            raise ValidationError({'numero': 'El número de semestre debe estar comprendido entre 1 y 6.'})
        if self.fecha_inicio and self.fecha_fin and self.fecha_inicio > self.fecha_fin:
            raise ValidationError({'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'})

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.is_active:
            # Desactivar otros semestres activos del mismo estudiante
            Semester.objects.filter(student=self.student, is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class AcademicCommittee(models.Model):
    class RolComite(models.TextChoices):
        ASESOR_PRINCIPAL = 'ASESOR_PRINCIPAL', 'Asesor Principal'
        COASESOR = 'COASESOR', 'Coasesor'
        MIEMBRO_COMITE = 'MIEMBRO_COMITE', 'Miembro del Comité'

    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='academic_committee'
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='committee_assignments'
    )
    rol_comite = models.CharField(
        'Rol en Comité',
        max_length=30,
        choices=RolComite.choices
    )
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
