from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.identity.models import CustomUser
from apps.tutoring.models import TutoringSession, TutoringParticipant, TutoringObservation
from apps.tutoring.serializers import (
    TutoringSessionSerializer,
    TutoringSessionDetailSerializer,
    TutoringSessionCreateSerializer,
    TutoringObservationSerializer
)


class TutoringSessionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = TutoringSession.objects.all().select_related(
            'student', 'semester', 'created_by'
        ).prefetch_related('participants__user', 'observations__autor')

        student_param = self.request.query_params.get('student')
        if student_param:
            queryset = queryset.filter(student_id=student_param)

        semester_param = self.request.query_params.get('semester')
        if semester_param:
            queryset = queryset.filter(semester_id=semester_param)

        # RBAC Check
        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        if user.role == CustomUser.Role.ASESOR:
            # Sesiones creadas por el asesor o de alumnos donde esté en el comité
            return queryset.filter(
                student__academic_committee__user=user,
                student__academic_committee__is_active=True
            ).distinct()

        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(student__user=user)

        return TutoringSession.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return TutoringSessionCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return TutoringSessionDetailSerializer
        return TutoringSessionSerializer

    def create(self, request, *args, **kwargs):
        # CA-02.2: Asesor o Coordinador puede registrar tutorías
        if request.user.role == CustomUser.Role.ESTUDIANTE:
            raise PermissionDenied("Los estudiantes no tienen permisos para dar de alta sesiones de tutoría.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()

        detail_serializer = TutoringSessionDetailSerializer(session)
        return Response(
            {
                'tutoring_session_created_id': session.id,
                'mensaje': 'Sesión de tutoría registrada exitosamente',
                'session': detail_serializer.data
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in [CustomUser.Role.COORDINADOR, CustomUser.Role.ASESOR] and not request.user.is_staff:
            raise PermissionDenied("Permiso denegado para eliminar sesiones de tutoría.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], url_path='observations')
    def add_observation(self, request, pk=None):
        session = self.get_object()
        payload = request.data.copy()
        payload['session'] = session.id
        payload['autor'] = request.user.id

        serializer = TutoringObservationSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        obs = serializer.save()

        return Response(
            {
                'observation_created_id': obs.id,
                'mensaje': 'Observación académica registrada exitosamente',
                'observation': serializer.data
            },
            status=status.HTTP_201_CREATED
        )
