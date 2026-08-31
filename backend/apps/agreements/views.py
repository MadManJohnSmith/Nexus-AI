from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q

from apps.identity.models import CustomUser
from apps.agreements.models import Agreement, AgreementAuditLog
from apps.agreements.serializers import (
    AgreementSerializer,
    AgreementStatusUpdateSerializer,
    AgreementAuditLogSerializer
)


class AgreementViewSet(viewsets.ModelViewSet):
    serializer_class = AgreementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Agreement.objects.all().select_related(
            'student', 'semester', 'responsable', 'modificado_por', 'session'
        ).prefetch_related('audit_logs__cambiado_por')

        # Auto-update overdue states on query
        # (check any pending/in_progress whose deadline passed)
        for item in queryset.filter(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]):
            if item.is_overdue:
                item.check_and_update_overdue()

        # Filters
        student_param = self.request.query_params.get('student')
        if student_param:
            queryset = queryset.filter(student_id=student_param)

        semester_param = self.request.query_params.get('semester')
        if semester_param:
            queryset = queryset.filter(semester_id=semester_param)

        estado_param = self.request.query_params.get('estado')
        if estado_param:
            queryset = queryset.filter(estado=estado_param)

        responsable_param = self.request.query_params.get('responsable')
        if responsable_param:
            queryset = queryset.filter(responsable_id=responsable_param)

        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(
                Q(descripcion__icontains=search_param) |
                Q(student__nombre_completo__icontains=search_param) |
                Q(student__matricula__icontains=search_param) |
                Q(responsable__first_name__icontains=search_param) |
                Q(responsable__last_name__icontains=search_param)
            )

        # RBAC Filters
        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        if user.role == CustomUser.Role.ASESOR:
            return queryset.filter(
                Q(student__academic_committee__user=user, student__academic_committee__is_active=True) |
                Q(responsable=user)
            ).distinct()

        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(
                Q(student__user=user) |
                Q(responsable=user)
            ).distinct()

        return Agreement.objects.none()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        agreement = serializer.save(modificado_por=request.user)

        # Create Initial Audit Log
        AgreementAuditLog.objects.create(
            agreement=agreement,
            estado_anterior='N/A',
            estado_nuevo=agreement.estado,
            cambiado_por=request.user,
            comentario='Creación inicial del acuerdo / compromiso.'
        )

        return Response(
            {
                'agreement_created_id': agreement.id,
                'mensaje': 'Acuerdo registrado exitosamente',
                'agreement': AgreementSerializer(agreement).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['patch'], url_path='status')
    def update_status(self, request, pk=None):
        agreement = self.get_object()
        serializer = AgreementStatusUpdateSerializer(
            data=request.data,
            context={'request': request, 'agreement': agreement}
        )
        serializer.is_valid(raise_exception=True)

        nuevo_estado = serializer.validated_data['estado']
        comentario = serializer.validated_data.get('comentario', '')
        estado_anterior = agreement.estado

        if nuevo_estado != estado_anterior:
            agreement.estado = nuevo_estado
            agreement.modificado_por = request.user
            agreement.save(update_fields=['estado', 'modificado_por', 'fecha_cambio_estado', 'updated_at'])

            AgreementAuditLog.objects.create(
                agreement=agreement,
                estado_anterior=estado_anterior,
                estado_nuevo=nuevo_estado,
                cambiado_por=request.user,
                comentario=comentario or f'Transición de estado de {estado_anterior} a {nuevo_estado}.'
            )

        return Response(
            {
                'mensaje': 'Estado de acuerdo actualizado exitosamente',
                'agreement': AgreementSerializer(agreement).data
            },
            status=status.HTTP_200_OK
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role not in [CustomUser.Role.COORDINADOR, CustomUser.Role.ASESOR] and not request.user.is_staff:
            raise PermissionDenied("Solo un asesor o coordinador puede eliminar acuerdos.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )
