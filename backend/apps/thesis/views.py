from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from apps.identity.models import CustomUser
from apps.thesis.models import ThesisProgress
from apps.thesis.serializers import ThesisProgressSerializer


class ThesisProgressViewSet(viewsets.ModelViewSet):
    serializer_class = ThesisProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ThesisProgress.objects.all().select_related(
            'student', 'semester', 'registrado_por'
        )

        student_param = self.request.query_params.get('student')
        if student_param:
            queryset = queryset.filter(student_id=student_param)

        semester_param = self.request.query_params.get('semester')
        if semester_param:
            queryset = queryset.filter(semester_id=semester_param)

        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        if user.role == CustomUser.Role.ASESOR:
            return queryset.filter(
                student__academic_committee__user=user,
                student__academic_committee__is_active=True
            ).distinct()

        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(student__user=user)

        return ThesisProgress.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        progress = serializer.save(registrado_por=request.user)

        return Response(
            {
                'thesis_progress_created_id': progress.id,
                'mensaje': 'Avance de tesis registrado exitosamente',
                'thesis_progress': ThesisProgressSerializer(progress).data
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in [CustomUser.Role.COORDINADOR, CustomUser.Role.ASESOR] and not request.user.is_staff:
            raise PermissionDenied("Solo un asesor o coordinador puede eliminar registros de avance de tesis.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )
