from django.test import TestCase
from django.test import Client
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.tutoring.models import TutoringSession
from apps.agreements.models import Agreement
from apps.academic_output.models import Publication


class ReportingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.django_client = Client()
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
        TutoringSession.objects.create(
            student=self.student,
            semester=self.semester,
            fecha_sesion=date.today(),
            resumen_general='Revisión de avance integral.'
        )
        Agreement.objects.create(
            student=self.student,
            semester=self.semester,
            descripcion='Borrador capítulo 1',
            responsable=self.student_user,
            fecha_limite=date.today() + timedelta(days=10),
            estado=Agreement.Estado.PENDIENTE
        )
        Publication.objects.create(
            student=self.student,
            semester=self.semester,
            titulo='Artificial Intelligence in Education',
            autores_texto='Turing, A.',
            tipo='ARTICULO_JCR',
            revista_editorial='IEEE TLT',
            estado='PUBLICADO'
        )

    def test_full_dossier_endpoint_hu_27(self):
        self.client.force_authenticate(user=self.coordinator)
        url = f"/api/v2/reporting/students/{self.student.id}/full-dossier/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('demographics', response.data)
        self.assertIn('tutorings', response.data)
        self.assertIn('agreements', response.data)
        self.assertIn('publications', response.data)
        self.assertEqual(response.data['demographics']['matricula'], 'DOC-2024-001')

    def test_export_pdf_hu_28(self):
        self.django_client.force_login(self.coordinator)
        url = f"/api/v2/reporting/students/{self.student.id}/export/?format=pdf"
        response = self.django_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.has_header('Content-Disposition'))

    def test_export_excel_hu_28(self):
        self.django_client.force_login(self.coordinator)
        url = f"/api/v2/reporting/students/{self.student.id}/export/?format=xlsx"
        response = self.django_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertTrue(response.has_header('Content-Disposition'))
