from django.db import models
from django.utils import timezone
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.tutoring.models import TutoringSession


class Agreement(models.Model):
    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        EN_PROCESO = 'EN_PROCESO', 'En Proceso'
        CONCLUIDO = 'CONCLUIDO', 'Concluido'
        VENCIDO = 'VENCIDO', 'Vencido'

    session = models.ForeignKey(
        TutoringSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agreements'
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='agreements'
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agreements'
    )
    descripcion = models.TextField('Descripción del Compromiso / Acuerdo')
    responsable = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='assigned_agreements'
    )
    fecha_limite = models.DateField('Fecha Límite de Cumplimiento')
    estado = models.CharField(
        'Estado del Acuerdo',
        max_length=20,
        choices=Estado.choices,
        default=Estado.PENDIENTE
    )
    fecha_cambio_estado = models.DateTimeField('Fecha de Último Cambio de Estado', auto_now=True)
    modificado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_agreements'
    )
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

    def check_and_update_overdue(self):
        if self.is_overdue and self.estado != self.Estado.VENCIDO:
            prev = self.estado
            self.estado = self.Estado.VENCIDO
            self.save(update_fields=['estado', 'fecha_cambio_estado', 'updated_at'])
            AgreementAuditLog.objects.create(
                agreement=self,
                estado_anterior=prev,
                estado_nuevo=self.Estado.VENCIDO,
                cambiado_por=None,
                comentario='Vencimiento automático detectado por fecha límite superada.'
            )


class AgreementAuditLog(models.Model):
    agreement = models.ForeignKey(
        Agreement,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    estado_anterior = models.CharField('Estado Anterior', max_length=20)
    estado_nuevo = models.CharField('Estado Nuevo', max_length=20)
    cambiado_por = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='agreement_state_changes'
    )
    fecha_cambio = models.DateTimeField('Fecha del Cambio', auto_now_add=True)
    comentario = models.TextField('Comentario o Motivo del Cambio', blank=True, default='')

    class Meta:
        verbose_name = 'Bitácora de Acuerdo'
        verbose_name_plural = 'Bitácoras de Acuerdos'
        ordering = ['-fecha_cambio']

    def __str__(self):
        return f"Acuerdo #{self.agreement_id}: {self.estado_anterior} -> {self.estado_nuevo}"
