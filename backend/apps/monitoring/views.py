from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Q

from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.tutoring.models import TutoringSession
from apps.agreements.models import Agreement
from apps.thesis.models import ThesisProgress
from apps.evidence.models import Evidence
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct
from apps.monitoring.supervision_service import SupervisionRulesEngine


class SupervisionAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != CustomUser.Role.COORDINADOR and not user.is_staff:
            raise PermissionDenied("Acceso exclusivo para la Coordinación de Posgrado.")

        alerts_report = SupervisionRulesEngine.evaluate_rules()
        return Response(alerts_report, status=status.HTTP_200_OK)


class CoordinatorDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != CustomUser.Role.COORDINADOR and not user.is_staff:
            raise PermissionDenied("Acceso exclusivo para Coordinadores de Posgrado.")

        today = timezone.localdate()

        # 1. KPIs Globales
        total_estudiantes_activos = Student.objects.filter(estatus_activo=True).count()
        total_tutorias = TutoringSession.objects.count()
        total_acuerdos_pendientes = Agreement.objects.filter(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]).count()
        total_acuerdos_vencidos = Agreement.objects.filter(
            Q(estado=Agreement.Estado.VENCIDO) |
            (Q(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]) & Q(fecha_limite__lt=today))
        ).count()
        total_publicaciones = Publication.objects.count()
        total_eventos = AcademicEvent.objects.count()
        total_estancias = ResearchStay.objects.count()

        # 2. Casos de Atención y Semáforo de Riesgo
        students = Student.objects.filter(estatus_activo=True).prefetch_related(
            'tutoring_sessions', 'agreements', 'thesis_progress_records'
        )

        casos_atencion = []
        for s in students:
            latest_tutoria = s.tutoring_sessions.order_by('-fecha_sesion').first()
            if latest_tutoria:
                dias_sin_tutoria = (today - latest_tutoria.fecha_sesion).days
                fecha_ult_tutoria = str(latest_tutoria.fecha_sesion)
            else:
                dias_sin_tutoria = (today - s.fecha_ingreso).days
                fecha_ult_tutoria = "Sin tutorías previas"

            acuerdos_vencidos = s.agreements.filter(
                Q(estado=Agreement.Estado.VENCIDO) |
                (Q(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]) & Q(fecha_limite__lt=today))
            ).count()

            latest_thesis = s.thesis_progress_records.order_by('-fecha_registro', '-created_at').first()
            pct_tesis = latest_thesis.porcentaje_avance if latest_thesis else 0

            nivel_riesgo = 'BAJO'
            motivos = []

            if dias_sin_tutoria > 45:
                nivel_riesgo = 'ALTO'
                motivos.append(f"> 45 días sin tutoría ({dias_sin_tutoria} días)")
            elif dias_sin_tutoria > 30:
                nivel_riesgo = 'MEDIO'
                motivos.append(f"> 30 días sin tutoría ({dias_sin_tutoria} días)")

            if acuerdos_vencidos > 0:
                nivel_riesgo = 'ALTO'
                motivos.append(f"{acuerdos_vencidos} acuerdo(s) vencido(s)")

            if pct_tesis < 20 and s.semestre_actual >= 3:
                nivel_riesgo = 'ALTO'
                motivos.append(f"Avance de tesis bajo ({pct_tesis}%) para Semestre {s.semestre_actual}")

            casos_atencion.append({
                'student_id': s.id,
                'matricula': s.matricula,
                'nombre_completo': s.nombre_completo,
                'cohorte': s.cohorte,
                'semestre_actual': s.semestre_actual,
                'asesor_principal': s.asesor_principal,
                'fecha_ultima_tutoria': fecha_ult_tutoria,
                'dias_sin_tutoria': dias_sin_tutoria,
                'acuerdos_vencidos_count': acuerdos_vencidos,
                'porcentaje_tesis': pct_tesis,
                'nivel_riesgo': nivel_riesgo,
                'motivos_riesgo': motivos
            })

        risk_priority = {'ALTO': 1, 'MEDIO': 2, 'BAJO': 3}
        casos_atencion.sort(key=lambda x: (risk_priority.get(x['nivel_riesgo'], 4), -x['dias_sin_tutoria']))

        # 3. Distribución de Avance de Tesis por Cohorte
        cohortes = Student.objects.values_list('cohorte', flat=True).distinct()
        distribucion_tesis = []
        for c in cohortes:
            st_in_cohorte = Student.objects.filter(cohorte=c)
            avg_adv = 0
            count_st = st_in_cohorte.count()
            if count_st > 0:
                total_adv = 0
                for st in st_in_cohorte:
                    l_th = st.thesis_progress_records.order_by('-fecha_registro').first()
                    total_adv += l_th.porcentaje_avance if l_th else 0
                avg_adv = round(total_adv / count_st, 1)

            distribucion_tesis.append({
                'cohorte': c,
                'total_estudiantes': count_st,
                'promedio_avance_tesis': avg_adv
            })

        return Response({
            'kpis': {
                'total_estudiantes_activos': total_estudiantes_activos,
                'total_tutorias': total_tutorias,
                'total_acuerdos_pendientes': total_acuerdos_pendientes,
                'total_acuerdos_vencidos': total_acuerdos_vencidos,
                'total_publicaciones': total_publicaciones,
                'total_eventos': total_eventos,
                'total_estancias': total_estancias
            },
            'casos_atencion': casos_atencion,
            'distribucion_tesis_cohorte': distribucion_tesis
        }, status=status.HTTP_200_OK)


class MonitoringAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.localdate()
        five_days_ahead = today + timedelta(days=5)

        agreements_qs = Agreement.objects.all().select_related('student', 'responsable')

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

        vencidos_qs = agreements_qs.filter(
            Q(estado=Agreement.Estado.VENCIDO) |
            (Q(estado__in=[Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO]) & Q(fecha_limite__lt=today))
        )

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
            first_st = Student.objects.first()
            if not first_st:
                return Response({'student': None, 'events': []}, status=status.HTTP_200_OK)
            student_id = first_st.id

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

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

        # 5. Publicaciones
        publications_qs = Publication.objects.filter(student=student).select_related('semester')
        for p in publications_qs:
            events.append({
                'id': f"publicacion-{p.id}",
                'raw_id': p.id,
                'tipo': 'PUBLICACION',
                'tipo_label': f"Publicación Científica 🎓 ({p.get_estado_display()})",
                'titulo': p.titulo,
                'fecha': str(p.fecha_publicacion or p.created_at.date()),
                'resumen': f"Revista: {p.revista_editorial} | Autores: {p.autores_texto}",
                'semester_numero': p.semester.numero,
                'autor_nombre': p.autores_texto,
                'metadata': {
                    'tipo': p.tipo,
                    'revista_editorial': p.revista_editorial,
                    'estado': p.estado,
                    'doi_url': p.doi_url
                }
            })

        # 6. Eventos y Congresos
        events_qs = AcademicEvent.objects.filter(student=student).select_related('semester')
        for ev in events_qs:
            events.append({
                'id': f"evento-{ev.id}",
                'raw_id': ev.id,
                'tipo': 'EVENTO',
                'tipo_label': f"Congreso ({ev.get_tipo_evento_display()})",
                'titulo': ev.titulo_ponencia,
                'fecha': str(ev.fecha_presentacion),
                'resumen': f"Evento: {ev.nombre_evento} | Sede: {ev.sede_lugar} ({ev.modalidad})",
                'semester_numero': ev.semester.numero,
                'autor_nombre': student.nombre_completo,
                'metadata': {
                    'tipo_evento': ev.tipo_evento,
                    'nombre_evento': ev.nombre_evento,
                    'sede_lugar': ev.sede_lugar,
                    'modalidad': ev.modalidad
                }
            })

        # 7. Estancias
        stays_qs = ResearchStay.objects.filter(student=student).select_related('semester')
        for st in stays_qs:
            events.append({
                'id': f"estancia-{st.id}",
                'raw_id': st.id,
                'tipo': 'ESTANCIA',
                'tipo_label': 'Estancia de Investigación',
                'titulo': f"Estancia en {st.institucion_receptora} ({st.pais})",
                'fecha': str(st.fecha_inicio),
                'resumen': f"Periodo: {st.fecha_inicio} al {st.fecha_fin} | Anfitrión: {st.responsable_estancia} | Objetivos: {st.objetivos}",
                'semester_numero': st.semester.numero,
                'autor_nombre': student.nombre_completo,
                'metadata': {
                    'institucion': st.institucion_receptora,
                    'pais': st.pais,
                    'fecha_inicio': str(st.fecha_inicio),
                    'fecha_fin': str(st.fecha_fin),
                    'responsable': st.responsable_estancia
                }
            })

        # 8. Otros Productos
        products_qs = OtherProduct.objects.filter(student=student).select_related('semester')
        for pr in products_qs:
            events.append({
                'id': f"producto-{pr.id}",
                'raw_id': pr.id,
                'tipo': 'PRODUCTO',
                'tipo_label': f"Producto ({pr.get_tipo_producto_display()})",
                'titulo': pr.titulo,
                'fecha': str(pr.fecha_registro),
                'resumen': pr.descripcion,
                'semester_numero': pr.semester.numero,
                'autor_nombre': student.nombre_completo,
                'metadata': {
                    'tipo_producto': pr.tipo_producto
                }
            })

        events.sort(key=lambda x: x['fecha'], reverse=True)

        return Response({
            'student_id': student.id,
            'student_nombre': student.nombre_completo,
            'student_matricula': student.matricula,
            'total_eventos': len(events),
            'events': events
        }, status=status.HTTP_200_OK)
