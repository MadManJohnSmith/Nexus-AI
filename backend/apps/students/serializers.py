from rest_framework import serializers
from apps.identity.models import CustomUser
from apps.identity.serializers import CustomUserSerializer
from apps.students.models import Student, Semester, AcademicCommittee


class AcademicCommitteeSerializer(serializers.ModelSerializer):
    user_nombre = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    user_role = serializers.SerializerMethodField()
    rol_comite_display = serializers.CharField(source='get_rol_comite_display', read_only=True)
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)

    class Meta:
        model = AcademicCommittee
        fields = [
            'id',
            'student',
            'student_matricula',
            'user',
            'user_nombre',
            'user_email',
            'user_role',
            'rol_comite',
            'rol_comite_display',
            'fecha_asignacion',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_user_nombre(self, obj):
        return obj.user.full_name if obj.user else ""

    def get_user_email(self, obj):
        return obj.user.email if obj.user else ""

    def get_user_role(self, obj):
        return obj.user.role if obj.user else ""

    def validate(self, attrs):
        user = attrs.get('user')
        if user and user.role not in [CustomUser.Role.ASESOR, CustomUser.Role.COORDINADOR]:
            raise serializers.ValidationError({
                'user': 'Solo usuarios con rol de Tutor / Asesor o Coordinador pueden asignarse al comité académico.'
            })
        return attrs


class SemesterSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)

    class Meta:
        model = Semester
        fields = [
            'id',
            'student',
            'student_matricula',
            'numero',
            'fecha_inicio',
            'fecha_fin',
            'is_active',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        numero = attrs.get('numero')
        fecha_inicio = attrs.get('fecha_inicio')
        fecha_fin = attrs.get('fecha_fin')

        if numero is not None and (numero < 1 or numero > 6):
            raise serializers.ValidationError({
                'numero': 'El número de semestre debe estar comprendido entre 1 y 6.'
            })

        if fecha_inicio and fecha_fin and fecha_inicio > fecha_fin:
            raise serializers.ValidationError({
                'fecha_fin': 'La fecha de fin no puede ser anterior a la fecha de inicio.'
            })

        return attrs


class StudentSerializer(serializers.ModelSerializer):
    semestre_actual = serializers.ReadOnlyField()
    asesor_principal = serializers.ReadOnlyField()
    coasesor = serializers.ReadOnlyField()
    email = serializers.ReadOnlyField()
    total_semestres = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id',
            'user',
            'matricula',
            'nombre_completo',
            'email',
            'programa_doctoral',
            'fecha_ingreso',
            'cohorte',
            'estatus_activo',
            'semestre_actual',
            'asesor_principal',
            'coasesor',
            'total_semestres',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_total_semestres(self, obj):
        return obj.semesters.count()

    def validate_matricula(self, value):
        instance = self.instance
        if Student.objects.filter(matricula__iexact=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError('Ya existe un estudiante registrado con esta matrícula institucional.')
        return value


class StudentDetailSerializer(StudentSerializer):
    semesters = SemesterSerializer(many=True, read_only=True)
    academic_committee = AcademicCommitteeSerializer(many=True, read_only=True)

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['semesters', 'academic_committee']
