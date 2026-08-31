from rest_framework import viewsets, status, parsers
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.identity.models import CustomUser
from apps.evidence.models import Evidence
from apps.evidence.serializers import EvidenceSerializer


class EvidenceViewSet(viewsets.ModelViewSet):
    serializer_class = EvidenceSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def get_queryset(self):
        user = self.request.user
        queryset = Evidence.objects.all().select_related(
            'student', 'semester', 'cargado_por'
        )

        student_param = self.request.query_params.get('student')
        if student_param:
            queryset = queryset.filter(student_id=student_param)

        semester_param = self.request.query_params.get('semester')
        if semester_param:
            queryset = queryset.filter(semester_id=semester_param)

        actividad_tipo_param = self.request.query_params.get('actividad_tipo')
        if actividad_tipo_param:
            queryset = queryset.filter(actividad_tipo=actividad_tipo_param)

        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        if user.role == CustomUser.Role.ASESOR:
            return queryset.filter(
                student__academic_committee__user=user,
                student__academic_committee__is_active=True
            ).distinct()

        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(student__user=user)

        return Evidence.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        evidence = serializer.save(cargado_por=request.user)

        return Response(
            {
                'evidence_created_id': evidence.id,
                'mensaje': 'Evidencia documental registrada exitosamente',
                'evidence': EvidenceSerializer(evidence, context={'request': request}).data
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )
