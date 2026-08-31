import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.test import Client
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.agreements.models import Agreement
from apps.tutoring.models import TutoringSession

def run_sprint5_integration_test():
    print("=================================================================")
    print("EJECUTANDO PRUEBA DE INTEGRACIÓN SPRINT 5 (SUPERVISIÓN & REPORTES)")
    print("=================================================================")
    client = APIClient()
    django_client = Client()

    # 1. Login Coordinador
    print("\n[Paso 1] Autenticación como Coordinadora...")
    coord_login = client.post('/api/v2/auth/login/', {
        'email': 'coordinador@posgrado.edu',
        'password': 'NexusCoord2025!'
    }, format='json')
    assert coord_login.status_code == 200, f"Fallo login: {coord_login.data}"
    coord_token = coord_login.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {coord_token}')
    coord_user = CustomUser.objects.get(email='coordinador@posgrado.edu')
    django_client.force_login(coord_user)
    print("-> Token JWT y sesión Django obtenidos exitosamente.")

    # 2. Probar Motor de Reglas de Supervisión Activa (HU-26)
    print("\n[Paso 2] Ejecutar Motor de Reglas de Supervisión Activa (HU-26)...")
    supervision_resp = client.get('/api/v2/monitoring/supervision-alerts/')
    assert supervision_resp.status_code == 200, f"Fallo supervision: {supervision_resp.data}"
    sup_data = supervision_resp.data
    print(f"-> Total alertas de supervisión detectadas: {sup_data['total_alertas_supervision']}")
    print(f"   * Alumnos > 45 días sin tutoría: {sup_data['alumnos_sin_tutoria_45dias']['total']}")
    print(f"   * Acuerdos concluidos sin evidencia: {sup_data['acuerdos_concluidos_sin_evidencia']['total']}")
    print(f"   * Próximas tutorías (7 días): {sup_data['proximas_tutorias_7dias']['total']}")

    # 3. Consultar Reporte Integral del Doctorando Full Dossier (HU-27)
    student = Student.objects.get(matricula='DOC-2024-001')
    print(f"\n[Paso 3] Consulta de Full Dossier DTO para {student.nombre_completo} (HU-27)...")
    dossier_resp = client.get(f'/api/v2/reporting/students/{student.id}/full-dossier/')
    assert dossier_resp.status_code == 200, f"Fallo dossier: {dossier_resp.data}"
    d = dossier_resp.data
    print(f"-> Dossier consolidado:")
    print(f"   * Matrícula: {d['demographics']['matricula']} ({d['demographics']['programa_doctoral']})")
    print(f"   * Semestres: {len(d['semesters'])}")
    print(f"   * Tutorías registradas: {len(d['tutorings'])}")
    print(f"   * Acuerdos: {len(d['agreements'])}")
    print(f"   * Publicaciones: {len(d['publications'])}")
    print(f"   * Eventos / Congresos: {len(d['academic_events'])}")

    # 4. Probar Exportación de Reporte en PDF (HU-28)
    print("\n[Paso 4] Generación y descarga de Reporte Oficial en PDF (HU-28)...")
    pdf_resp = django_client.get(f'/api/v2/reporting/students/{student.id}/export/?format=pdf')
    assert pdf_resp.status_code == 200, f"Fallo export PDF: {pdf_resp.status_code}"
    assert pdf_resp['Content-Type'] == 'application/pdf'
    assert 'attachment' in pdf_resp['Content-Disposition']
    print(f"-> PDF generado exitosamente ({len(pdf_resp.content)} bytes). Header: {pdf_resp['Content-Disposition']}")

    # 5. Probar Exportación de Reporte en Excel XLSX (HU-28)
    print("\n[Paso 5] Generación y descarga de Reporte Oficial en XLSX (HU-28)...")
    excel_resp = django_client.get(f'/api/v2/reporting/students/{student.id}/export/?format=xlsx')
    assert excel_resp.status_code == 200, f"Fallo export Excel: {excel_resp.status_code}"
    assert 'spreadsheetml' in excel_resp['Content-Type']
    assert 'attachment' in excel_resp['Content-Disposition']
    print(f"-> Archivo Excel XLSX generado ({len(excel_resp.content)} bytes). Header: {excel_resp['Content-Disposition']}")

    print("\n=================================================================")
    print("✅ TODAS LAS PRUEBAS DE INTEGRACIÓN DEL SPRINT 5 SATISFECHAS")
    print("=================================================================")

if __name__ == '__main__':
    run_sprint5_integration_test()
