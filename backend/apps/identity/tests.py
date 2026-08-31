from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.identity.models import CustomUser


class IdentityAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.coord_password = 'CoordSecurePass123!'
        self.coordinator = CustomUser.objects.create_user(
            email='coordinador@posgrado.edu',
            password=self.coord_password,
            first_name='Laura',
            last_name='Coordinadora',
            role=CustomUser.Role.COORDINADOR
        )
        self.advisor_password = 'AdvisorSecurePass123!'
        self.advisor = CustomUser.objects.create_user(
            email='asesor@posgrado.edu',
            password=self.advisor_password,
            first_name='Roberto',
            last_name='Tutor',
            role=CustomUser.Role.ASESOR
        )
        self.student_password = 'StudentSecurePass123!'
        self.student_user = CustomUser.objects.create_user(
            email='estudiante@posgrado.edu',
            password=self.student_password,
            first_name='Carlos',
            last_name='Doctorando',
            role=CustomUser.Role.ESTUDIANTE
        )

    def test_custom_user_creation_and_hashing(self):
        self.assertEqual(self.coordinator.email, 'coordinador@posgrado.edu')
        self.assertTrue(self.coordinator.check_password(self.coord_password))
        self.assertTrue(self.coordinator.password.startswith('pbkdf2_'))
        self.assertEqual(self.coordinator.full_name, 'Laura Coordinadora')

    def test_login_success_hu_01_ca_01_1(self):
        url = reverse('token_obtain_pair')
        payload = {
            'email': 'coordinador@posgrado.edu',
            'password': self.coord_password
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'coordinador@posgrado.edu')
        self.assertEqual(response.data['user']['role'], 'COORDINADOR')

    def test_login_invalid_credentials_hu_01_ca_01_2(self):
        url = reverse('token_obtain_pair')
        payload = {
            'email': 'coordinador@posgrado.edu',
            'password': 'WrongPassword123'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('non_field_errors', response.data)

    def test_token_refresh(self):
        login_url = reverse('token_obtain_pair')
        response = self.client.post(login_url, {'email': 'asesor@posgrado.edu', 'password': self.advisor_password}, format='json')
        refresh_token = response.data['refresh']

        refresh_url = reverse('token_refresh')
        ref_response = self.client.post(refresh_url, {'refresh': refresh_token}, format='json')
        self.assertEqual(ref_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', ref_response.data)
