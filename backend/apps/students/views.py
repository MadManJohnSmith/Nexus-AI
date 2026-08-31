from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound

from apps.identity.models import CustomUser
from apps.identity.permissions import IsCoordinator
from apps.students.models import Student, Semester, AcademicCommittee
from apps.students.serializers import (
    StudentSerializer,
    StudentDetailSerializer,
    SemesterSerializer,
    AcademicCommitteeSerializer
)


class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Student.objects.all().prefetch_related('semesters', 'academic_committee__user')

        # CA-02.3 & Coordinador: acceso global
        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        # CA-02.2: Asesor solo consulta alumnos asociados en comite
        if user.role == CustomUser.Role.ASESOR:
            return queryset.filter(academic_committee__user=user, academic_committee__is_active=True).distinct()

        # CA-02.1: Estudiante solo consulta su propio expediente
        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(user=user)

        return Student.objects.none()

    def get_serializer_class(self):
        if self.action in ['retrieve', 'update', 'partial_update']:
            return StudentDetailSerializer
        return StudentSerializer

    def create(self, request, *args, **kwargs):
        # Solo coordinador puede crear expedientes
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede registrar nuevos expedientes de doctorado.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()

        # Auto-crear semestre 1 por defecto al registrar estudiante si se solicita o de manera estándar
        if not student.semesters.exists():
            Semester.objects.create(
                student=student,
                numero=1,
                fecha_inicio=student.fecha_ingreso,
                fecha_fin=student.fecha_ingreso.replace(month=(student.fecha_ingreso.month + 5) if student.fecha_ingreso.month <= 7 else 12),
                is_active=True
            )

        return Response(
            {
                'student_created_id': student.id,
                'mensaje': 'Estudiante registrado exitosamente',
                'student': StudentDetailSerializer(student).data
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede eliminar expedientes.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['get', 'post'], url_path='committee')
    def committee(self, request, pk=None):
        student = self.get_object()

        if request.method == 'GET':
            committee = student.academic_committee.all().select_related('user')
            serializer = AcademicCommitteeSerializer(committee, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # POST
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede asignar miembros al comité académico.")

        payload = request.data.copy()
        payload['student'] = student.id
        serializer = AcademicCommitteeSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        member = serializer.save()

        return Response(
            {
                'committee_member_created_id': member.id,
                'mensaje': 'Miembro de comité asignado exitosamente',
                'member': AcademicCommitteeSerializer(member).data
            },
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['delete'], url_path=r'committee/(?P<member_id>\d+)')
    def remove_committee_member(self, request, pk=None, member_id=None):
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede remover miembros del comité.")

        student = self.get_object()
        try:
            member = student.academic_committee.get(pk=member_id)
            member.delete()
            return Response(
                {'details': 'Recurso eliminado correctamente', 'success': True},
                status=status.HTTP_200_OK
            )
        except AcademicCommittee.DoesNotExist:
            raise NotFound("El miembro de comité especificado no existe para este estudiante.")


class SemesterViewSet(viewsets.ModelViewSet):
    serializer_class = SemesterSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Semester.objects.all().select_related('student')
        student_param = self.request.query_params.get('student')

        if student_param:
            queryset = queryset.filter(student_id=student_param)

        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            return queryset

        if user.role == CustomUser.Role.ASESOR:
            return queryset.filter(
                student__academic_committee__user=user,
                student__academic_committee__is_active=True
            ).distinct()

        if user.role == CustomUser.Role.ESTUDIANTE:
            return queryset.filter(student__user=user)

        return Semester.objects.none()

    def create(self, request, *args, **kwargs):
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede registrar semestres.")

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        semester = serializer.save()

        return Response(
            {
                'semester_created_id': semester.id,
                'mensaje': 'Semestre registrado exitosamente',
                'semester': SemesterSerializer(semester).data
            },
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, *args, **kwargs):
        if request.user.role != CustomUser.Role.COORDINADOR and not request.user.is_staff:
            raise PermissionDenied("Solo la coordinación puede eliminar semestres.")
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {'details': 'Recurso eliminado correctamente', 'success': True},
            status=status.HTTP_200_OK
        )
