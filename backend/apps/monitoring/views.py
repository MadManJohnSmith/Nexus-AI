from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

from apps.identity.models import CustomUser
from apps.students.models import Student
from apps.tutoring.models import TutoringSession
from apps.agreements.models import Agreement
from apps.thesis.models import ThesisProgress
from apps.evidence.models import Evidence


class MonitoringAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()
        five_days_ahead = today + timedelta(days=5)

        agreements_qs = Agreement.objects.all().select_related('student', 'responsable')

        # RBAC Filtering
        if user.role == CustomUser.Role.COORDINADOR or user.is_staff:
            pass
        elif user.role == CustomUser.Role.ASESOR:
            agreements_qs = agreements_qs.filter(
                Q(student__academic_committee__user=user, student__academic_committee__is_active=True) |
                Q(responsable=user)
            ).distinct()
        elif user.role == CustomUser.Role.ESTUDIANTE:
            agreements_qs = agreements_qs.filter(
                Q(student__user=user) | Q(responsable=user)
            ).distinct()
        else:
            agreements_qs = Agreement.objects.none()

        # Acuerdos vencidos
        vencidos_qs = agreements_qs.filter(
            Q(estado=Agreement.Estado.VENCIDO) |
            (Q(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]) & Q(fecha_limite__lt=today))
        )

        # Acuerdos próximos a vencer (en los próximos 5 días)
        por_vencer_qs = agreements_qs.filter(
            estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO],
            fecha_limite__gte=today,
            fecha_limite__lte=five_days_ahead
        )

        def serialize_alert_item(agr, tipo_alerta):
            dias_restantes = (agr.fecha_limite - today).days
            return {
                'id': agr.id,
                'tipo_alerta': tipo_alerta,
                'descripcion': agr.descripcion,
                'student_id': agr.student_id,
                'student_nombre': agr.student.nombre_completo,
                'student_matricula': agr.student.matricula,
                'responsable_nombre': agr.responsable.full_name,
                'fecha_limite': str(agr.fecha_limite),
                'dias_restantes': dias_restantes,
                'estado': agr.estado
            }

        vencidos_data = [serialize_alert_item(a, 'VENCIDO') for a in vencidos_qs]
        por_vencer_data = [serialize_alert_item(a, 'POR_VENCER') for a in por_vencer_qs]

        return Response({
            'total_alertas': len(vencidos_data) + len(por_vencer_data),
            'total_vencidos': len(vencidos_data),
            'total_por_vencer': len(por_vencer_data),
            'alertas_vencidas': vencidos_data,
            'alertas_por_vencer': por_vencer_data
        }, status=status.HTTP_200_OK)


class MonitoringTimelineView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student_id = request.query_params.get('student')
        if not student_id:
            # Obtener el primer estudiante accesible si no se provee parámetro
            first_st = Student.objects.first()
            if not first_st:
                return Response({'student': None, 'events': []}, status=status.HTTP_200_OK)
            student_id = first_st.id

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # RBAC Check
        user = request.user
        if user.role == CustomUser.Role.ESTUDIANTE and student.user != user:
            return Response({'error': 'Acceso no autorizado al timeline de este estudiante.'}, status=status.HTTP_403_FORBIDDEN)
        if user.role == CustomUser.Role.ASESOR:
            if not student.academic_committee.filter(user=user, is_active=True).exists():
                return Response({'error': 'Acceso no autorizado al expediente de este doctorando.'}, status=status.HTTP_403_FORBIDDEN)

        events = []

        # 1. Tutorías
        tutoring_qs = TutoringSession.objects.filter(student=student).select_related(
            'semester', 'created_by'
        ).prefetch_related('participants__user', 'observations__autor')

        for t in tutoring_qs:
            events.append({
                'id': f"tutoria-{t.id}",
                'raw_id': t.id,
                'tipo': 'TUTORIA',
                'tipo_label': 'Sesión de Tutoría',
                'titulo': f"Tutoría Semestre {t.semester.numero} ({t.modalidad})",
                'fecha': str(t.fecha_sesion),
                'resumen': t.resumen_general,
                'semester_numero': t.semester.numero,
                'autor_nombre': t.created_by.full_name if t.created_by else 'Asesor',
                'metadata': {
                    'modalidad': t.modalidad,
                    'proxima_reunion_fecha': str(t.proxima_reunion_fecha) if t.proxima_reunion_fecha else None,
                    'proxima_reunion_notas': t.proxima_reunion_notas,
                    'participantes': [p.user.full_name for p in t.participants.all()],
                    'observaciones': [{'tema': o.tema_revisado, 'obs': o.observaciones_detalladas} for o in t.observations.all()]
                }
            })

        # 2. Acuerdos
        agreements_qs = Agreement.objects.filter(student=student).select_related(
            'semester', 'responsable'
        )

        for a in agreements_qs:
            events.append({
                'id': f"acuerdo-{a.id}",
                'raw_id': a.id,
                'tipo': 'ACUERDO',
                'tipo_label': f"Acuerdo ({a.get_estado_display()})",
                'titulo': a.descripcion[:60],
                'fecha': str(a.fecha_limite),
                'resumen': a.descripcion,
                'semester_numero': a.semester.numero if a.semester else None,
                'autor_nombre': a.responsable.full_name,
                'metadata': {
                    'estado': a.estado,
                    'is_overdue': a.is_overdue,
                    'responsable': a.responsable.full_name
                }
            })

        # 3. Avances de Tesis
        thesis_qs = ThesisProgress.objects.filter(student=student).select_related(
            'semester', 'registrado_por'
        )

        for th in thesis_qs:
            events.append({
                'id': f"tesis-{th.id}",
                'raw_id': th.id,
                'tipo': 'TESIS',
                'tipo_label': f"Avance de Tesis ({th.porcentaje_avance}%)",
                'titulo': f"Evaluación de Tesis Semestre {th.semester.numero}",
                'fecha': str(th.fecha_registro),
                'resumen': th.observaciones or f"Avance global registrado al {th.porcentaje_avance}%.",
                'semester_numero': th.semester.numero,
                'autor_nombre': th.registrado_por.full_name if th.registrado_por else 'Asesor',
                'metadata': {
                    'porcentaje_avance': th.porcentaje_avance,
                    'componentes': th.componentes_json
                }
            })

        # 4. Evidencias
        evidence_qs = Evidence.objects.filter(student=student).select_related(
            'semester', 'cargado_por'
        )

        for e in evidence_qs:
            events.append({
                'id': f"evidencia-{e.id}",
                'raw_id': e.id,
                'tipo': 'EVIDENCIA',
                'tipo_label': f"Evidencia ({e.get_tipo_display()})",
                'titulo': e.descripcion,
                'fecha': str(e.fecha_carga.date()),
                'resumen': e.descripcion,
                'semester_numero': e.semester.numero,
                'autor_nombre': e.cargado_por.full_name if e.cargado_por else 'Estudiante',
                'metadata': {
                    'tipo': e.tipo,
                    'archivo_url': e.archivo_adjunto.url if e.archivo_adjunto else None,
                    'url_doi': e.url_doi,
                    'file_size_bytes': e.file_size_bytes,
                    'actividad_tipo': e.actividad_tipo
                }
            })

        # Orden cronológico descendente (más reciente primero)
        events.sort(key=lambda x: x['fecha'], reverse=True)

        return Response({
            'student_id': student.id,
            'student_nombre': student.nombre_completo,
            'student_matricula': student.matricula,
            'total_eventos': len(events),
            'events': events
        }, status=status.HTTP_200_OK)
