from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.tutoring.models import TutoringSession, TutoringParticipant, TutoringObservation


class TutoringSessionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.coordinator = CustomUser.objects.create_user(
            email='coord@posgrado.edu',
            password='Pass123!Password',
            first_name='Laura',
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

    def test_create_tutoring_session_hu_07_hu_08_hu_10(self):
        self.client.force_authenticate(user=self.advisor)
        url = reverse('tutoring-session-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester_2.id,
            'fecha_sesion': '2024-09-10',
            'modalidad': 'PRESENCIAL',
            'resumen_general': 'Revisión formal del marco teórico y diseño de experimentos.',
            'proxima_reunion_fecha': '2024-10-15',
            'proxima_reunion_notas': 'Presentación de resultados del benchmark preliminar.',
            'participants': [
                {'user': self.advisor.id, 'rol_en_sesion': 'Asesor Principal', 'asistencia_confirmada': True},
                {'user': self.student_user.id, 'rol_en_sesion': 'Doctorando', 'asistencia_confirmada': True}
            ],
            'observations': [
                {'autor': self.advisor.id, 'tema_revisado': 'Capítulo 2: Estado del Arte', 'observaciones_detalladas': 'Incluir artículos recientes de 2024.'}
            ]
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tutoring_session_created_id', response.data)
        session_id = response.data['tutoring_session_created_id']

        # Verificar detalle
        detail_url = reverse('tutoring-session-detail', kwargs={'pk': session_id})
        detail_resp = self.client.get(detail_url)
        self.assertEqual(detail_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail_resp.data['participants']), 2)
        self.assertEqual(len(detail_resp.data['observations']), 1)

    def test_student_cannot_create_session(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('tutoring-session-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester_2.id,
            'fecha_sesion': '2024-09-10',
            'resumen_general': 'Intento no autorizado'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
