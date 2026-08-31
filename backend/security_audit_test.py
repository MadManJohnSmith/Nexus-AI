import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from apps.identity.models import CustomUser
from apps.students.models import Student

def run_security_audit():
    print("=================================================================")
    print("AUDITORÍA DE SEGURIDAD Y PERMISOS RBAC (CRITERIO CA-02.1 & CA-02.2)")
    print("=================================================================")
    client = APIClient()

    # 1. Autenticar como Estudiante 1 (Alan Turing)
    student1 = Student.objects.get(matricula='DOC-2024-001')
    student2 = Student.objects.get(matricula='DOC-2023-002')
    
    login_st1 = client.post('/api/v2/auth/login/', {
        'email': 'alan.turing@posgrado.edu',
        'password': 'StudentSecure2025!'
    }, format='json')
    assert login_st1.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_st1.data['access']}")
    print("[Test 1] Estudiante 1 autenticado exitosamente.")

    # 2. Intento de acceso a expediente de Estudiante 2 (Debe ser denegado o filtrado)
    dossier_resp = client.get(f'/api/v2/reporting/students/{student2.id}/full-dossier/')
    assert dossier_resp.status_code == 403, f"Fallo aislamiento de estudiante: {dossier_resp.status_code}"
    print("-> CA-02.1 APROBADO: Estudiante 1 bloqueado con 403 Forbidden al intentar acceder al expediente de Estudiante 2.")

    # 3. Intento de acceso al timeline de Estudiante 2
    timeline_resp = client.get(f'/api/v2/monitoring/timeline/?student={student2.id}')
    assert timeline_resp.status_code == 403, f"Fallo aislamiento timeline: {timeline_resp.status_code}"
    print("-> CA-02.1 APROBADO: Estudiante 1 bloqueado con 403 Forbidden al consultar timeline ajeno.")

    # 4. Intento de acceso al Dashboard del Coordinador
    dash_resp = client.get('/api/v2/monitoring/coordinator-dashboard/')
    assert dash_resp.status_code == 403, f"Fallo RBAC Dashboard: {dash_resp.status_code}"
    print("-> RBAC APROBADO: Estudiante bloqueado con 403 Forbidden al intentar acceder a Dashboard del Coordinador.")

    # 5. Autenticar como Asesor no asignado
    advisor_unassigned = CustomUser.objects.get(email='grace.hopper@posgrado.edu')
    # Grace Hopper no está en el comité de Alan Turing
    login_adv = client.post('/api/v2/auth/login/', {
        'email': 'grace.hopper@posgrado.edu',
        'password': 'AsesorSecure2025!'
    }, format='json')
    assert login_adv.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_adv.data['access']}")
    print("\n[Test 2] Asesor no asignado autenticado.")

    dossier_adv_resp = client.get(f'/api/v2/reporting/students/{student1.id}/full-dossier/')
    assert dossier_adv_resp.status_code == 403, f"Fallo aislamiento asesor: {dossier_adv_resp.status_code}"
    print("-> CA-02.2 APROBADO: Asesor no asignado bloqueado con 403 Forbidden al intentar consultar expediente ajeno.")

    timeline_adv_resp = client.get(f'/api/v2/monitoring/timeline/?student={student1.id}')
    assert timeline_adv_resp.status_code == 403, f"Fallo timeline asesor: {timeline_adv_resp.status_code}"
    print("-> CA-02.2 APROBADO: Asesor no asignado bloqueado con 403 Forbidden al intentar consultar timeline ajeno.")

    print("\n=================================================================")
    print("✅ TODAS LAS PRUEBAS DE AUDITORÍA DE SEGURIDAD Y PERMISOS APROBADAS")
    print("=================================================================")

if __name__ == '__main__':
    run_security_audit()
