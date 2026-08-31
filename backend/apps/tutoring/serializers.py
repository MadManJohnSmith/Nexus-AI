from rest_framework import serializers
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.tutoring.models import TutoringSession, TutoringParticipant, TutoringObservation


class TutoringParticipantSerializer(serializers.ModelSerializer):
    user_nombre = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()

    class Meta:
        model = TutoringParticipant
        fields = [
            'id',
            'session',
            'user',
            'user_nombre',
            'user_email',
            'rol_en_sesion',
            'asistencia_confirmada',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {'session': {'required': False}}

    def get_user_nombre(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_user_email(self, obj):
        return obj.user.email if obj.user else ""


class TutoringObservationSerializer(serializers.ModelSerializer):
    autor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = TutoringObservation
        fields = [
            'id',
            'session',
            'autor',
            'autor_nombre',
            'tema_revisado',
            'observaciones_detalladas',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {'session': {'required': False}}

    def get_autor_nombre(self, obj):
        return obj.autor.full_name if obj.autor else ""


class TutoringSessionSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    created_by_nombre = serializers.CharField(source='created_by.full_name', read_only=True)
    total_observaciones = serializers.SerializerMethodField()
    total_participantes = serializers.SerializerMethodField()

    class Meta:
        model = TutoringSession
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'fecha_sesion',
            'modalidad',
            'resumen_general',
            'proxima_reunion_fecha',
            'proxima_reunion_notas',
            'created_by',
            'created_by_nombre',
            'total_observaciones',
            'total_participantes',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_observaciones(self, obj):
        return obj.observations.count()

    def get_total_participantes(self, obj):
        return obj.participants.count()

    def validate(self, attrs):
        student = attrs.get('student') or (self.instance.student if self.instance else None)
        semester = attrs.get('semester') or (self.instance.semester if self.instance else None)

        if student and semester and semester.student_id != student.id:
            raise serializers.ValidationError({
                'semester': 'El semestre seleccionado no pertenece al estudiante especificado.'
            })
        return attrs


class TutoringSessionDetailSerializer(TutoringSessionSerializer):
    participants = TutoringParticipantSerializer(many=True, read_only=True)
    observations = TutoringObservationSerializer(many=True, read_only=True)

    class Meta(TutoringSessionSerializer.Meta):
        fields = TutoringSessionSerializer.Meta.fields + ['participants', 'observations']


class TutoringSessionCreateSerializer(serializers.ModelSerializer):
    participants = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )
    observations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True
    )

    class Meta:
        model = TutoringSession
        fields = [
            'id',
            'student',
            'semester',
            'fecha_sesion',
            'modalidad',
            'resumen_general',
            'proxima_reunion_fecha',
            'proxima_reunion_notas',
            'participants',
            'observations'
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        student = attrs.get('student')
        semester = attrs.get('semester')

        if student and semester and semester.student_id != student.id:
            raise serializers.ValidationError({
                'semester': 'El semestre seleccionado no pertenece al expediente del estudiante.'
            })
        return attrs

    def create(self, validated_data):
        participants_data = validated_data.pop('participants', [])
        observations_data = validated_data.pop('observations', [])
        request = self.context.get('request')

        session = TutoringSession.objects.create(
            created_by=request.user if request and request.user.is_authenticated else None,
            **validated_data
        )

        for p in participants_data:
            user_id = p.get('user')
            if user_id:
                TutoringParticipant.objects.create(
                    session=session,
                    user_id=user_id,
                    rol_en_sesion=p.get('rol_en_sesion', 'Asesor'),
                    asistencia_confirmada=p.get('asistencia_confirmada', True)
                )

        for obs in observations_data:
            autor_id = obs.get('autor') or (request.user.id if request else None)
            if autor_id and obs.get('tema_revisado'):
                TutoringObservation.objects.create(
                    session=session,
                    autor_id=autor_id,
                    tema_revisado=obs.get('tema_revisado'),
                    observaciones_detalladas=obs.get('observaciones_detalladas', '')
                )

        return session
