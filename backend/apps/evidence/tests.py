from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.evidence.models import Evidence


class EvidenceTests(TestCase):
    def setUp(self):
        self.client = APIClient()
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

    def test_upload_file_evidence_hu_21(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('evidence-list')
        pdf_file = SimpleUploadedFile("protocolo_final.pdf", b"%PDF-1.4 dummy content", content_type="application/pdf")
        
        data = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'actividad_tipo': 'TESIS',
            'tipo': 'ARCHIVO_LOCAL',
            'archivo_adjunto': pdf_file,
            'descripcion': 'Protocolo de Tesis Doctoral Aprobado'
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('evidence_created_id', response.data)
        self.assertEqual(response.data['evidence']['descripcion'], 'Protocolo de Tesis Doctoral Aprobado')

    def test_register_doi_link_evidence_hu_22(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('evidence-list')
        payload = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'actividad_tipo': 'OTRO',
            'tipo': 'ENLACE_DOI',
            'url_doi': 'https://doi.org/10.1145/3372278.3390678',
            'descripcion': 'Artículo Indexado en ACM Digital Library'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('evidence_created_id', response.data)
        self.assertEqual(response.data['evidence']['url_doi'], 'https://doi.org/10.1145/3372278.3390678')

    def test_unauthorized_extension_rejected(self):
        self.client.force_authenticate(user=self.student_user)
        url = reverse('evidence-list')
        bad_file = SimpleUploadedFile("malicious.exe", b"binary content", content_type="application/x-msdownload")
        data = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'tipo': 'ARCHIVO_LOCAL',
            'archivo_adjunto': bad_file,
            'descripcion': 'Archivo no permitido'
        }
        response = self.client.post(url, data, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
