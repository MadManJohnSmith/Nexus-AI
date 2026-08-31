from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.agreements.models import Agreement
from apps.tutoring.models import TutoringSession
from apps.thesis.models import ThesisProgress


class MonitoringAlertsAndTimelineTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.coordinator = CustomUser.objects.create_user(
            email='coord@posgrado.edu',
            password='Pass123!Password',
            first_name='Elena',
            last_name='Coordinadora',
            role=CustomUser.Role.COORDINADOR
        )
        self.student_user = CustomUser.objects.create_user(
            email='alumno@posgrado.edu',
            password='Pass123!Password',
            first_name='Alan',
            last_name='Turing',
            role=CustomUser.Role.ESTUDIANTE
        )
        self.student = Student.objects.create(
            user=self.student_user,
            matricula='DOC-2024-001',
            nombre_completo='Alan Turing',
            programa_doctoral='Doctorado en Computación',
            fecha_ingreso=date(2024, 1, 15),
            cohorte='2024-A'
        )
        self.semester = Semester.objects.create(
            student=self.student,
            numero=1,
            fecha_inicio=date(2024, 1, 15),
            fecha_fin=date(2024, 6, 30),
            is_active=True
        )

        # Crear acuerdo por vencer (en 3 días)
        Agreement.objects.create(
            student=self.student,
            semester=self.semester,
            descripcion='Entrega borrador artículo',
            responsable=self.student_user,
            fecha_limite=date.today() + timedelta(days=3),
            estado=Agreement.Estado.PENDIENTE
        )

        # Crear acuerdo vencido (hace 5 días)
        Agreement.objects.create(
            student=self.student,
            semester=self.semester,
            descripcion='Entrega protocolo formal',
            responsable=self.student_user,
            fecha_limite=date.today() - timedelta(days=5),
            estado=Agreement.Estado.VENCIDO
        )

        # Crear tutoría
        TutoringSession.objects.create(
            student=self.student,
            semester=self.semester,
            fecha_sesion=date.today(),
            resumen_general='Revisión general del semestre 1.'
        )

        # Crear avance tesis
        ThesisProgress.objects.create(
            student=self.student,
            semester=self.semester,
            porcentaje_avance=40,
            observaciones='40% completado.'
        )

    def test_monitoring_alerts_hu_25(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('monitoring-alerts')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_alertas'], 2)
        self.assertEqual(response.data['total_vencidos'], 1)
        self.assertEqual(response.data['total_por_vencer'], 1)

    def test_monitoring_timeline_hu_23(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('monitoring-timeline') + f"?student={self.student.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('events', response.data)
        self.assertEqual(response.data['total_eventos'], 4)
        types = [e['tipo'] for e in response.data['events']]
        self.assertIn('TUTORIA', types)
        self.assertIn('ACUERDO', types)
        self.assertIn('TESIS', types)

    def test_coordinator_dashboard_hu_24(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('coordinator-dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('kpis', response.data)
        self.assertIn('casos_atencion', response.data)
        self.assertIn('distribucion_tesis_cohorte', response.data)
        self.assertEqual(response.data['kpis']['total_estudiantes_activos'], 1)
