import os
from rest_framework import serializers
from apps.evidence.models import Evidence, ALLOWED_EXTENSIONS, MAX_FILE_SIZE


class EvidenceSerializer(serializers.ModelSerializer):
    student_matricula = serializers.CharField(source='student.matricula', read_only=True)
    student_nombre = serializers.CharField(source='student.nombre_completo', read_only=True)
    semester_numero = serializers.IntegerField(source='semester.numero', read_only=True)
    cargado_por_nombre = serializers.CharField(source='cargado_por.full_name', read_only=True)
    archivo_url = serializers.SerializerMethodField()
    actividad_tipo_display = serializers.CharField(source='get_actividad_tipo_display', read_only=True)

    class Meta:
        model = Evidence
        fields = [
            'id',
            'student',
            'student_matricula',
            'student_nombre',
            'semester',
            'semester_numero',
            'actividad_tipo',
            'actividad_tipo_display',
            'actividad_id',
            'tipo',
            'archivo_adjunto',
            'archivo_url',
            'url_doi',
            'mime_type',
            'file_size_bytes',
            'descripcion',
            'fecha_carga',
            'cargado_por',
            'cargado_por_nombre'
        ]
        read_only_fields = ['id', 'file_size_bytes', 'fecha_carga']

    def get_archivo_url(self, obj):
        if obj.archivo_adjunto:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.archivo_adjunto.url)
            return obj.archivo_adjunto.url
        return None

    def validate(self, attrs):
        tipo = attrs.get('tipo', Evidence.Tipo.ARCHIVO_LOCAL)
        archivo = attrs.get('archivo_adjunto')
        url_doi = attrs.get('url_doi')
        student = attrs.get('student') or (self.instance.student if self.instance else None)
        semester = attrs.get('semester') or (self.instance.semester if self.instance else None)

        if student and semester and semester.student_id != student.id:
            raise serializers.ValidationError({'semester': 'El semestre no pertenece al estudiante indicado.'})

        if tipo == Evidence.Tipo.ARCHIVO_LOCAL:
            if not archivo and not (self.instance and self.instance.archivo_adjunto):
                raise serializers.ValidationError({'archivo_adjunto': 'Debe adjuntar un archivo local.'})
            if archivo:
                if archivo.size > MAX_FILE_SIZE:
                    raise serializers.ValidationError({'archivo_adjunto': 'El archivo supera el límite de 15 MB.'})
                ext = os.path.splitext(archivo.name)[1].lower()
                if ext not in ALLOWED_EXTENSIONS:
                    raise serializers.ValidationError({'archivo_adjunto': f'Formato "{ext}" no permitido. Use PDF, PNG, JPG, ZIP o DOCX.'})
        elif tipo == Evidence.Tipo.ENLACE_DOI:
            if not url_doi:
                raise serializers.ValidationError({'url_doi': 'Debe proporcionar una URL o identificador DOI válido.'})

        return attrs
