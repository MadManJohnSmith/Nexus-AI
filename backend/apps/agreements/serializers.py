from rest_framework import serializers
from apps.identity.models import CustomUser
from apps.agreements.models import Agreement, AgreementAuditLog
from apps.students.models import Student, Semester


class AgreementAuditLogSerializer(serializers.ModelSerializer):
    cambiado_por_nombre = serializers.SerializerMethodField()

    class Meta:
        model = AgreementAuditLog
        fields = [
            'id',
            'agreement',
            'estado_anterior',
            'estado_nuevo',
            'cambiado_por',
            'cambiado_por_nombre',
            'fecha_cambio',
            'comentario'
        ]
        read_only_fields = ['id', 'fecha_cambio']

    def get_cambiado_por_nombre(self, obj):
        return obj.cambiado_por.full_name if obj.cambiado_por else "Sistema (Automático)"


class AgreementSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True, allow_null=True)
    responsable_nombre = serializers.CharField(source='responsable.full_name', read_only=True)
    responsable_email = serializers.CharField(source='responsable.email', read_only=True)
    modificado_por_nombre = serializers.CharField(source='modificado_por.full_name', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    is_overdue = serializers.ReadOnlyField()
    audit_logs = AgreementAuditLogSerializer(many=True, read_only=True)

    class Meta:
        model = Agreement
        fields = [
            'id',
            'session',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'descripcion',
            'responsable',
            'responsable_nombre',
            'responsable_email',
            'fecha_limite',
            'estado',
            'estado_display',
            'fecha_cambio_estado',
            'modificado_por',
            'modificado_por_nombre',
            'is_overdue',
            'audit_logs',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'fecha_cambio_estado', 'created_at', 'updated_at']

    def validate(self, attrs):
        session = attrs.get('session')
        student = attrs.get('student')
        if session and student and session.student_id != student.id:
            raise serializers.ValidationError({
                'session': 'La sesión de tutoría indicada no corresponde al estudiante seleccionado.'
            })
        return attrs


class AgreementStatusUpdateSerializer(serializers.Serializer):
    estado = serializers.ChoiceField(choices=Agreement.Estado.choices)
    comentario = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_estado(self, value):
        agreement = self.context.get('agreement')
        user = self.context.get('request').user

        if not agreement:
            return value

        current_state = agreement.estado

        # Regla de Negocio: Un estudiante NO puede auto-aprobarse un acuerdo a 'CONCLUIDO'
        if value == Agreement.Estado.CONCLUIDO and user.role == CustomUser.Role.ESTUDIANTE:
            raise serializers.ValidationError(
                "Los estudiantes no pueden marcar compromisos como CONCLUIDO. Requiere validación del Asesor o Coordinador."
            )

        # Validaciones de transiciones
        if current_state == Agreement.Estado.CONCLUIDO and value != Agreement.Estado.CONCLUIDO:
            if user.role not in [CustomUser.Role.COORDINADOR, CustomUser.Role.ASESOR] and not user.is_staff:
                raise serializers.ValidationError("Solo un asesor o coordinador puede reabrir un acuerdo previamente concluido.")

        return value
