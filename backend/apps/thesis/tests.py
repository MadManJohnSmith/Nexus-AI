from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.thesis.models import ThesisProgress


class ThesisProgressTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.advisor = CustomUser.objects.create_user(
            email='asesor@posgrado.edu',
            password='Pass123!Password',
            first_name='Dr. Alonzo',
            last_name='Church',
            role=CustomUser.Role.ASESOR
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
        self.semester_1 = Semester.objects.create(
            student=self.student,
            numero=1,
            fecha_inicio=date(2024, 1, 15),
            fecha_fin=date(2024, 6, 30),
            is_active=True
        )
        AcademicCommittee.objects.create(
            student=self.student,
            user=self.advisor,
            rol_comite=AcademicCommittee.RolComite.ASESOR_PRINCIPAL
        )

    def test_register_thesis_progress_hu_15(self):
        self.client.force_authenticate(user=self.advisor)
        url = reverse('thesis-progress-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'porcentaje_avance': 45,
            'componentes_json': {
                'protocolo': 100,
                'estado_arte': 80,
                'marco_teorico': 50,
                'metodologia': 30,
                'analisis': 10,
                'redaccion': 0
            },
            'observaciones': 'Avance conforme a cronograma establecido.'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('thesis_progress_created_id', response.data)
        self.assertEqual(response.data['thesis_progress']['porcentaje_avance'], 45)

    def test_invalid_percentage_rejected(self):
        self.client.force_authenticate(user=self.advisor)
        url = reverse('thesis-progress-list')
        invalid_payload = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'porcentaje_avance': 120
        }
        response = self.client.post(url, invalid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('porcentaje_avance', response.data)
