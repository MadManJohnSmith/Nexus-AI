from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.thesis.models import ThesisProgress, default_thesis_components
from apps.thesis.serializers import ThesisProgressSerializer


class ThesisProgressViewSet(viewsets.ModelViewSet):
    serializer_class = ThesisProgressSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = ThesisProgress.objects.all().select_related(
            'student', 'semester', 'registrado_por'
        )

        student_param = self.request.query_params.get('student') or self.request.query_params.get('student_id')
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

    @action(detail=False, methods=['get'], url_path='history')
    def history(self, request):
        student_id = request.query_params.get('student_id') or request.query_params.get('student')
        if not student_id:
            first_st = Student.objects.first()
            if not first_st:
                return Response({'student_id': None, 'semesters_history': []})
            student_id = first_st.id

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            raise NotFound("Estudiante no encontrado.")

        # RBAC Check
        user = request.user
        if user.role == CustomUser.Role.ESTUDIANTE and student.user != user:
            raise PermissionDenied("No tiene autorización para consultar el historial de este estudiante.")
        if user.role == CustomUser.Role.ASESOR:
            if not student.academic_committee.filter(user=user, is_active=True).exists():
                raise PermissionDenied("No tiene autorización para consultar este expediente.")

        # Obtener evaluaciones de tesis del estudiante agrupadas por semestre
        progress_records = ThesisProgress.objects.filter(student=student).select_related('semester', 'registrado_por').order_by('semester__numero', '-fecha_registro')

        history_by_sem = {}
        for rec in progress_records:
            sem_num = rec.semester.numero
            if sem_num not in history_by_sem:
                history_by_sem[sem_num] = rec

        semesters_history = []
        for sem_num in range(1, 7):
            rec = history_by_sem.get(sem_num)
            if rec:
                semesters_history.append({
                    'semester_numero': sem_num,
                    'semester_id': rec.semester_id,
                    'has_data': True,
                    'porcentaje_avance': rec.porcentaje_avance,
                    'fecha_registro': str(rec.fecha_registro),
                    'observaciones': rec.observaciones,
                    'componentes_json': rec.componentes_json,
                    'registrado_por_nombre': rec.registrado_por.full_name if rec.registrado_por else 'Asesor'
                })
            else:
                semesters_history.append({
                    'semester_numero': sem_num,
                    'semester_id': None,
                    'has_data': False,
                    'porcentaje_avance': 0,
                    'fecha_registro': None,
                    'observaciones': 'Sin registro de evaluación para este semestre.',
                    'componentes_json': default_thesis_components(),
                    'registrado_por_nombre': None
                })

        return Response({
            'student_id': student.id,
            'student_nombre': student.nombre_completo,
            'student_matricula': student.matricula,
            'semesters_history': semesters_history
        }, status=status.HTTP_200_OK)
