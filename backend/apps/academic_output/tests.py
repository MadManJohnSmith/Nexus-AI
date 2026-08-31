from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct


class AcademicOutputTests(TestCase):
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
        self.semester = Semester.objects.create(
            student=self.student,
            numero=1,
            fecha_inicio=date(2024, 1, 15),
            fecha_fin=date(2024, 6, 30),
            is_active=True
        )

    def test_create_publication_hu_17(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('publication-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester.id,
            'titulo': 'Multi-Agent Autonomous Orchestration in Higher Education',
            'autores_texto': 'Turing, A., Church, A.',
            'tipo': 'ARTICULO_JCR',
            'revista_editorial': 'IEEE Transactions on Learning Technologies',
            'estado': 'EN_REVISION',
            'doi_url': 'https://doi.org/10.1109/TLT.2024.123456'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('publication_created_id', response.data)
        self.assertEqual(response.data['publication']['titulo'], payload['titulo'])

    def test_create_academic_event_hu_18(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('academic-event-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester.id,
            'tipo_evento': 'CONGRESO_INTERNACIONAL',
            'nombre_evento': 'IEEE International Conference on Advanced Learning Technologies (ICALT)',
            'titulo_ponencia': 'Longitudinal Tracking of Doctoral Trajectories via AI Agents',
            'fecha_presentacion': '2024-07-15',
            'sede_lugar': 'Nicosia, Chipre',
            'modalidad': 'PRESENCIAL'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('academic_event_created_id', response.data)

    def test_create_research_stay_hu_19(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('research-stay-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester.id,
            'institucion_receptora': 'Princeton University',
            'pais': 'Estados Unidos',
            'fecha_inicio': '2024-09-01',
            'fecha_fin': '2024-11-30',
            'responsable_estancia': 'Dr. Alonzo Church',
            'objetivos': 'Desarrollo de modelos formales de computación concurrente.'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('research_stay_created_id', response.data)

    def test_create_other_product_hu_20(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('other-product-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester.id,
            'tipo_producto': 'SOFTWARE',
            'titulo': 'Nexus AI Orchestration Toolkit',
            'descripcion': 'Framework de código abierto para seguimiento de tutorías.',
            'fecha_registro': '2024-10-01'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('other_product_created_id', response.data)
