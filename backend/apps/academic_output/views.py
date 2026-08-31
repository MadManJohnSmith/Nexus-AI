from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.identity.models import CustomUser
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct
from apps.academic_output.serializers import (
    PublicationSerializer,
    AcademicEventSerializer,
    ResearchStaySerializer,
    OtherProductSerializer
)


class BaseAcademicOutputViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def filter_by_user_rbac(self, queryset):
        user = self.request.user
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

        return queryset.none()


class PublicationViewSet(BaseAcademicOutputViewSet):
    serializer_class = PublicationSerializer

    def get_queryset(self):
        qs = Publication.objects.all().select_related('student', 'semester', 'evidencia')
        return self.filter_by_user_rbac(qs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        pub = serializer.save()
        return Response(
            {
                'publication_created_id': pub.id,
                'mensaje': 'Publicación registrada exitosamente',
                'publication': PublicationSerializer(pub).data
            },
            status=status.HTTP_201_CREATED
        )


class AcademicEventViewSet(BaseAcademicOutputViewSet):
    serializer_class = AcademicEventSerializer

    def get_queryset(self):
        qs = AcademicEvent.objects.all().select_related('student', 'semester', 'evidencia')
        return self.filter_by_user_rbac(qs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        return Response(
            {
                'academic_event_created_id': event.id,
                'mensaje': 'Evento académico registrado exitosamente',
                'academic_event': AcademicEventSerializer(event).data
            },
            status=status.HTTP_201_CREATED
        )


class ResearchStayViewSet(BaseAcademicOutputViewSet):
    serializer_class = ResearchStaySerializer

    def get_queryset(self):
        qs = ResearchStay.objects.all().select_related('student', 'semester', 'evidencia')
        return self.filter_by_user_rbac(qs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        stay = serializer.save()
        return Response(
            {
                'research_stay_created_id': stay.id,
                'mensaje': 'Estancia de investigación registrada exitosamente',
                'research_stay': ResearchStaySerializer(stay).data
            },
            status=status.HTTP_201_CREATED
        )


class OtherProductViewSet(BaseAcademicOutputViewSet):
    serializer_class = OtherProductSerializer

    def get_queryset(self):
        qs = OtherProduct.objects.all().select_related('student', 'semester', 'evidencia')
        return self.filter_by_user_rbac(qs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prod = serializer.save()
        return Response(
            {
                'other_product_created_id': prod.id,
                'mensaje': 'Producto de investigación registrado exitosamente',
                'other_product': OtherProductSerializer(prod).data
            },
            status=status.HTTP_201_CREATED
        )
