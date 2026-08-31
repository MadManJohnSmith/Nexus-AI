from rest_framework import serializers
from apps.thesis.models import ThesisProgress


class ThesisProgressSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    registrado_por_nombre = serializers.CharField(source='registrado_por.full_name', read_only=True)

    class Meta:
        model = ThesisProgress
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'porcentaje_avance',
            'componentes_json',
            'observaciones',
            'fecha_registro',
            'registrado_por',
            'registrado_por_nombre',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'fecha_registro', 'created_at', 'updated_at']

    def validate_porcentaje_avance(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError('El porcentaje de avance de tesis debe estar comprendido entre 0 y 100.')
        return value

    def validate(self, attrs):
        student = attrs.get('student') or (self.instance.student if self.instance else None)
        semester = attrs.get('semester') or (self.instance.semester if self.instance else None)

        if student and semester and semester.student_id != student.id:
            raise serializers.ValidationError({
                'semester': 'El semestre no pertenece al expediente del estudiante especificado.'
            })
        return attrs
