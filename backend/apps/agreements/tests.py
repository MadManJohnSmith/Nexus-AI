from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from datetime import date, timedelta
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.agreements.models import Agreement, AgreementAuditLog


class AgreementWorkflowTests(TestCase):
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
            is_active=True
        )
        AcademicCommittee.objects.create(
            student=self.student,
            user=self.advisor,
            rol_comite=AcademicCommittee.RolComite.ASESOR_PRINCIPAL
        )

    def test_create_agreement_hu_11_hu_12(self):
        self.client.force_authenticate(user=self.advisor)
        url = reverse('agreement-list')
        future_date = (date.today() + timedelta(days=30)).isoformat()
        payload = {
            'student': self.student.id,
            'semester': self.semester_1.id,
            'descripcion': 'Completar sección de experimentos con benchmark de red neuronal.',
            'responsable': self.student_user.id,
            'fecha_limite': future_date,
            'estado': 'PENDIENTE'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('agreement_created_id', response.data)
        agreement_id = response.data['agreement_created_id']

        # Verificar log de auditoría
        agreement = Agreement.objects.get(id=agreement_id)
        self.assertEqual(agreement.audit_logs.count(), 1)
        self.assertEqual(agreement.audit_logs.first().estado_nuevo, 'PENDIENTE')

    def test_status_transitions_and_rbac_restrictions_hu_13(self):
        # Crear acuerdo
        agreement = Agreement.objects.create(
            student=self.student,
            semester=self.semester_1,
            descripcion='Enviar borrador para congreso IEEE.',
            responsable=self.student_user,
            fecha_limite=date.today() + timedelta(days=15),
            estado=Agreement.Estado.PENDIENTE
        )
        status_url = reverse('agreement-update-status', kwargs={'pk': agreement.id})

        # Estudiante puede mover a EN_PROCESO
        self.client.force_authenticate(user=self.student_user)
        resp_prog = self.client.patch(status_url, {'estado': 'EN_PROCESO', 'comentario': 'Inicié redacción'}, format='json')
        self.assertEqual(resp_prog.status_code, status.HTTP_200_OK)
        agreement.refresh_from_db()
        self.assertEqual(agreement.estado, 'EN_PROCESO')

        # Estudiante NO puede auto-aprobar a CONCLUIDO
        resp_conc_err = self.client.patch(status_url, {'estado': 'CONCLUIDO', 'comentario': 'Ya lo terminé'}, format='json')
        self.assertEqual(resp_conc_err.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('estado', resp_conc_err.data)

        # Asesor SÍ puede marcar como CONCLUIDO
        self.client.force_authenticate(user=self.advisor)
        resp_conc_ok = self.client.patch(status_url, {'estado': 'CONCLUIDO', 'comentario': 'Revisado y validado satisfactoriamente'}, format='json')
        self.assertEqual(resp_conc_ok.status_code, status.HTTP_200_OK)
        agreement.refresh_from_db()
        self.assertEqual(agreement.estado, 'CONCLUIDO')
        self.assertEqual(agreement.audit_logs.count(), 2)

    def test_agreement_filtering_hu_14(self):
        Agreement.objects.create(
            student=self.student,
            descripcion='Tarea 1',
            responsable=self.student_user,
            fecha_limite=date.today() + timedelta(days=10),
            estado=Agreement.Estado.PENDIENTE
        )
        Agreement.objects.create(
            student=self.student,
            descripcion='Tarea 2',
            responsable=self.student_user,
            fecha_limite=date.today() + timedelta(days=20),
            estado=Agreement.Estado.CONCLUIDO
        )

        self.client.force_authenticate(user=self.advisor)
        url = reverse('agreement-list') + '?estado=PENDIENTE'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['estado'], 'PENDIENTE')
