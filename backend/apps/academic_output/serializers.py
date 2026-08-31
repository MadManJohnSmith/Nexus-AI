from rest_framework import serializers
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct


class PublicationSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    evidencia_descripcion = serializers.CharField(source='evidencia.descripcion', read_only=True, allow_null=True)

    class Meta:
        model = Publication
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'titulo',
            'autores_texto',
            'tipo',
            'tipo_display',
            'revista_editorial',
            'estado',
            'estado_display',
            'fecha_publicacion',
            'doi_url',
            'evidencia',
            'evidencia_descripcion',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AcademicEventSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    tipo_evento_display = serializers.CharField(source='get_tipo_evento_display', read_only=True)

    class Meta:
        model = AcademicEvent
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'tipo_evento',
            'tipo_evento_display',
            'nombre_evento',
            'titulo_ponencia',
            'fecha_presentacion',
            'sede_lugar',
            'modalidad',
            'evidencia',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResearchStaySerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)

    class Meta:
        model = ResearchStay
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'institucion_receptora',
            'pais',
            'fecha_inicio',
            'fecha_fin',
            'responsable_estancia',
            'objetivos',
            'evidencia',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OtherProductSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    tipo_producto_display = serializers.CharField(source='get_tipo_producto_display', read_only=True)

    class Meta:
        model = OtherProduct
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'tipo_producto',
            'tipo_producto_display',
            'titulo',
            'descripcion',
            'fecha_registro',
            'evidencia',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
