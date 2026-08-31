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
        self.coordinator = CustomUser.objects.create_user(
            email='coord@posgrado.edu',
            password='Pass123!Password',
            first_name='Elena',
            last_name='Coordinadora',
            role=CustomUser.Role.COORDINADOR
        )
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
            is_active=False
        )
        self.semester_2 = Semester.objects.create(
            student=self.student,
            numero=2,
            fecha_inicio=date(2024, 8, 1),
            fecha_fin=date(2024, 12, 15),
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

    def test_thesis_history_hu_16(self):
        ThesisProgress.objects.create(
            student=self.student,
            semester=self.semester_1,
            porcentaje_avance=25,
            observaciones='Evaluación Semestre 1'
        )
        ThesisProgress.objects.create(
            student=self.student,
            semester=self.semester_2,
            porcentaje_avance=50,
            observaciones='Evaluación Semestre 2'
        )

        self.client.force_authenticate(user=self.coordinator)
        url = reverse('thesis-progress-history') + f"?student_id={self.student.id}"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['semesters_history']), 6)
        
        # Verificar semestre 1 y 2
        sem1 = response.data['semesters_history'][0]
        self.assertTrue(sem1['has_data'])
        self.assertEqual(sem1['porcentaje_avance'], 25)

        sem2 = response.data['semesters_history'][1]
        self.assertTrue(sem2['has_data'])
        self.assertEqual(sem2['porcentaje_avance'], 50)

        # Verificar semestre 3 sin datos
        sem3 = response.data['semesters_history'][2]
        self.assertFalse(sem3['has_data'])
        self.assertEqual(sem3['porcentaje_avance'], 0)
