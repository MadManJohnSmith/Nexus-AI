from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
from apps.students.models import Student
from apps.agreements.models import Agreement
from apps.tutoring.models import TutoringSession
from apps.evidence.models import Evidence


class SupervisionRulesEngine:
    @staticmethod
    def evaluate_rules():
        today = timezone.localdate()
        seven_days_ahead = today + timedelta(days=7)

        alertas_sin_tutoria = []
        alertas_acuerdos_sin_evidencia = []
        alertas_proximas_tutorias = []

        # 1. Alumnos en semestre activo con > 45 días sin sesión de tutoría registrada
        active_students = Student.objects.filter(estatus_activo=True).prefetch_related('tutoring_sessions')
        for st in active_students:
            latest_tutoria = st.tutoring_sessions.order_by('-fecha_sesion').first()
            if latest_tutoria:
                dias_sin_sesion = (today - latest_tutoria.fecha_sesion).days
                ult_fecha = str(latest_tutoria.fecha_sesion)
            else:
                dias_sin_sesion = (today - st.fecha_ingreso).days
                ult_fecha = "Sin registros previos"

            if dias_sin_sesion > 45:
                alertas_sin_tutoria.append({
                    'student_id': st.id,
                    'matricula': st.matricula,
                    'nombre_completo': st.nombre_completo,
                    'semestre_actual': st.semestre_actual,
                    'asesor_principal': st.asesor_principal,
                    'dias_sin_tutoria': dias_sin_sesion,
                    'fecha_ultima_tutoria': ult_fecha,
                    'mensaje': f"El estudiante acumula {dias_sin_sesion} días sin sesión de tutoría registrada."
                })

        # 2. Acuerdos en estado CONCLUIDO sin evidencia adjunta vinculada en apps.evidence
        concluidos = Agreement.objects.filter(estado=Agreement.Estado.CONCLUIDO).select_related('student', 'responsable')
        for agr in concluidos:
            tiene_evidencia = Evidence.objects.filter(
                actividad_tipo='ACUERDO',
                actividad_id=agr.id
            ).exists()

            if not tiene_evidencia:
                alertas_acuerdos_sin_evidencia.append({
                    'agreement_id': agr.id,
                    'descripcion': agr.descripcion,
                    'student_id': agr.student_id,
                    'student_matricula': agr.student.matricula,
                    'student_nombre': agr.student.nombre_completo,
                    'responsable_nombre': agr.responsable.full_name,
                    'fecha_limite': str(agr.fecha_limite),
                    'mensaje': f"Acuerdo #{agr.id} marcado como CONCLUIDO carece de evidencia probatoria adjunta."
                })

        # 3. Próximas tutorías calendarizadas dentro de los siguientes 7 días
        proximas_sesiones = TutoringSession.objects.filter(
            proxima_reunion_fecha__isnull=False,
            proxima_reunion_fecha__gte=today,
            proxima_reunion_fecha__lte=seven_days_ahead
        ).select_related('student', 'semester')

        for ses in proximas_sesiones:
            dias_para_reunion = (ses.proxima_reunion_fecha - today).days
            alertas_proximas_tutorias.append({
                'session_id': ses.id,
                'student_id': ses.student_id,
                'student_matricula': ses.student.matricula,
                'student_nombre': ses.student.nombre_completo,
                'semester_numero': ses.semester.numero,
                'proxima_reunion_fecha': str(ses.proxima_reunion_fecha),
                'dias_restantes': dias_para_reunion,
                'notas': ses.proxima_reunion_notas,
                'mensaje': f"Tutoría programada en {dias_para_reunion} días ({ses.proxima_reunion_fecha})."
            })

        return {
            'total_alertas_supervision': len(alertas_sin_tutoria) + len(alertas_acuerdos_sin_evidencia) + len(alertas_proximas_tutorias),
            'alumnos_sin_tutoria_45dias': {
                'total': len(alertas_sin_tutoria),
                'items': alertas_sin_tutoria
            },
            'acuerdos_concluidos_sin_evidencia': {
                'total': len(alertas_acuerdos_sin_evidencia),
                'items': alertas_acuerdos_sin_evidencia
            },
            'proximas_tutorias_7dias': {
                'total': len(alertas_proximas_tutorias),
                'items': alertas_proximas_tutorias
            }
        }
