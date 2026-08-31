from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee


class StudentAndCommitteeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.coordinator = CustomUser.objects.create_user(
            email='coord@posgrado.edu',
            password='Password123!',
            first_name='Laura',
            last_name='Coordinadora',
            role=CustomUser.Role.COORDINADOR
        )
        self.advisor_1 = CustomUser.objects.create_user(
            email='asesor1@posgrado.edu',
            password='Password123!',
            first_name='Dr. Martin',
            last_name='Fowler',
            role=CustomUser.Role.ASESOR
        )
        self.advisor_2 = CustomUser.objects.create_user(
            email='asesor2@posgrado.edu',
            password='Password123!',
            first_name='Dra. Barbara',
            last_name='Liskov',
            role=CustomUser.Role.ASESOR
        )
        self.student_user_1 = CustomUser.objects.create_user(
            email='alumno1@posgrado.edu',
            password='Password123!',
            first_name='Alan',
            last_name='Turing',
            role=CustomUser.Role.ESTUDIANTE
        )
        self.student_user_2 = CustomUser.objects.create_user(
            email='alumno2@posgrado.edu',
            password='Password123!',
            first_name='Ada',
            last_name='Lovelace',
            role=CustomUser.Role.ESTUDIANTE
        )

        self.student_1 = Student.objects.create(
            user=self.student_user_1,
            matricula='DOC-2024-001',
            nombre_completo='Alan Turing',
            programa_doctoral='Doctorado en Computación',
            fecha_ingreso=date(2024, 1, 15),
            cohorte='2024-A'
        )

    def test_student_registration_hu_03(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('student-list')
        payload = {
            'matricula': 'DOC-2024-002',
            'nombre_completo': 'Ada Lovelace',
            'programa_doctoral': 'Doctorado en Computación',
            'fecha_ingreso': '2024-08-01',
            'cohorte': '2024-B'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('student_created_id', response.data)
        self.assertEqual(response.data['mensaje'], 'Estudiante registrado exitosamente')

        # CA-03.2: Evitar duplicación de matrícula
        dup_response = self.client.post(url, payload, format='json')
        self.assertEqual(dup_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('matricula', dup_response.data)

    def test_semester_management_hu_05(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('semester-list')
        payload = {
            'student': self.student_1.id,
            'numero': 2,
            'fecha_inicio': '2024-08-01',
            'fecha_fin': '2024-12-15',
            'is_active': True
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('semester_created_id', response.data)

        # CA-05.1: Validar que no permita semestre fuera del rango 1 a 6
        invalid_payload = {
            'student': self.student_1.id,
            'numero': 7,
            'fecha_inicio': '2027-01-01',
            'fecha_fin': '2027-06-30'
        }
        invalid_response = self.client.post(url, invalid_payload, format='json')
        self.assertEqual(invalid_response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_committee_assignment_hu_04_ca_04_1(self):
        self.client.force_authenticate(user=self.coordinator)
        url = reverse('student-committee', kwargs={'pk': self.student_1.id})
        payload = {
            'user': self.advisor_1.id,
            'rol_comite': AcademicCommittee.RolComite.ASESOR_PRINCIPAL
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('committee_member_created_id', response.data)

        # Validar rechazo de rol no compatible (un estudiante no puede ser miembro de comité)
        invalid_payload = {
            'user': self.student_user_2.id,
            'rol_comite': AcademicCommittee.RolComite.COASESOR
        }
        inv_response = self.client.post(url, invalid_payload, format='json')
        self.assertEqual(inv_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('user', inv_response.data)

    def test_rbac_access_hu_02_ca_02_1_and_ca_02_2(self):
        # Asignar asesor 1 a student 1
        AcademicCommittee.objects.create(
            student=self.student_1,
            user=self.advisor_1,
            rol_comite=AcademicCommittee.RolComite.ASESOR_PRINCIPAL
        )

        # Estudiante 1 solo consulta su expediente
        self.client.force_authenticate(user=self.student_user_1)
        res_stud = self.client.get(reverse('student-list'))
        self.assertEqual(res_stud.status_code, status.HTTP_200_OK)
        self.assertEqual(res_stud.data['count'], 1)
        self.assertEqual(res_stud.data['results'][0]['matricula'], 'DOC-2024-001')

        # Asesor 1 consulta expedientes asignados
        self.client.force_authenticate(user=self.advisor_1)
        res_adv1 = self.client.get(reverse('student-list'))
        self.assertEqual(res_adv1.status_code, status.HTTP_200_OK)
        self.assertEqual(res_adv1.data['count'], 1)

        # Asesor 2 no tiene expedientes asignados
        self.client.force_authenticate(user=self.advisor_2)
        res_adv2 = self.client.get(reverse('student-list'))
        self.assertEqual(res_adv2.status_code, status.HTTP_200_OK)
        self.assertEqual(res_adv2.data['count'], 0)
