import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct
from apps.thesis.models import ThesisProgress

def run_sprint4_integration_test():
    print("=================================================================")
    print("EJECUTANDO PRUEBA DE INTEGRACIÓN SPRINT 4 (PRODUCCIÓN & DASHBOARD)")
    print("=================================================================")
    client = APIClient()

    # 1. Login Coordinador
    print("\n[Paso 1] Autenticación como Coordinadora...")
    coord_login = client.post('/api/v2/auth/login/', {
        'email': 'coordinador@posgrado.edu',
        'password': 'NexusCoord2025!'
    }, format='json')
    assert coord_login.status_code == 200, f"Fallo login: {coord_login.data}"
    coord_token = coord_login.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {coord_token}')
    print("-> Token de Coordinador obtenido.")

    # 2. Registrar Publicación Científica (HU-17)
    student = Student.objects.get(matricula='DOC-2024-001')
    semester = student.semesters.first()
    print(f"\n[Paso 2] Registro de Publicación JCR para {student.nombre_completo} (HU-17)...")
    pub_resp = client.post('/api/v2/publications/', {
        'student': student.id,
        'semester': semester.id,
        'titulo': 'Autonomous Agent-Based Longitudinal Tracking in Higher Education',
        'autores_texto': 'Turing, A., Church, A.',
        'tipo': 'ARTICULO_JCR',
        'revista_editorial': 'IEEE Transactions on Learning Technologies',
        'estado': 'PUBLICADO',
        'fecha_publicacion': '2025-02-20',
        'doi_url': 'https://doi.org/10.1109/TLT.2025.109876'
    }, format='json')
    assert pub_resp.status_code == 201, f"Fallo publicación: {pub_resp.data}"
    print(f"-> Publicación creada exitosamente (ID: {pub_resp.data['publication_created_id']}).")

    # 3. Registrar Evento Académico / Congreso (HU-18)
    print("\n[Paso 3] Registro de Ponencia en Congreso Internacional (HU-18)...")
    ev_resp = client.post('/api/v2/academic-events/', {
        'student': student.id,
        'semester': semester.id,
        'tipo_evento': 'CONGRESO_INTERNACIONAL',
        'nombre_evento': 'International Conference on Software Engineering (ICSE 2025)',
        'titulo_ponencia': 'Decoupled Multi-Agent Workflows for Doctoral Supervision',
        'fecha_presentacion': '2025-05-18',
        'sede_lugar': 'Ottawa, Canadá',
        'modalidad': 'PRESENCIAL'
    }, format='json')
    assert ev_resp.status_code == 201, f"Fallo evento: {ev_resp.data}"
    print(f"-> Evento registrado exitosamente (ID: {ev_resp.data['academic_event_created_id']}).")

    # 4. Registrar Estancia de Investigación (HU-19)
    print("\n[Paso 4] Registro de Estancia Doctoral en el Extranjero (HU-19)...")
    stay_resp = client.post('/api/v2/research-stays/', {
        'student': student.id,
        'semester': semester.id,
        'institucion_receptora': 'Oxford University - Department of Computer Science',
        'pais': 'Reino Unido',
        'fecha_inicio': '2025-06-01',
        'fecha_fin': '2025-08-31',
        'responsable_estancia': 'Prof. Michael Wooldridge',
        'objetivos': 'Formalización de protocolos de verificación en sistemas multi-agente.'
    }, format='json')
    assert stay_resp.status_code == 201, f"Fallo estancia: {stay_resp.data}"
    print(f"-> Estancia registrada (ID: {stay_resp.data['research_stay_created_id']}).")

    # 5. Registrar Software / Patente (HU-20)
    print("\n[Paso 5] Registro de Producto de Software (HU-20)...")
    prod_resp = client.post('/api/v2/other-products/', {
        'student': student.id,
        'semester': semester.id,
        'tipo_producto': 'SOFTWARE',
        'titulo': 'NexusCore Multi-Agent Orchestrator v1.0',
        'descripcion': 'Framework reactivo para automatización de workflows académicos.',
        'fecha_registro': '2025-02-15'
    }, format='json')
    assert prod_resp.status_code == 201, f"Fallo producto: {prod_resp.data}"
    print(f"-> Producto tecnológico registrado (ID: {prod_resp.data['other_product_created_id']}).")

    # 6. Consultar Histórico Comparativo de Tesis (HU-16)
    print("\n[Paso 6] Consulta de Histórico Comparativo de Tesis Semestres 1 a 6 (HU-16)...")
    hist_resp = client.get(f'/api/v2/thesis-progress/history/?student_id={student.id}')
    assert hist_resp.status_code == 200, f"Fallo histórico tesis: {hist_resp.data}"
    sem_hist = hist_resp.data['semesters_history']
    assert len(sem_hist) == 6, f"Se esperaban 6 semestres pero se obtuvieron {len(sem_hist)}"
    print(f"-> Trayectoria de 6 semestres consolidada: {[s['porcentaje_avance'] for s in sem_hist]}%")

    # 7. Consultar Timeline Longitudinal con Nodos 🎓 (HU-23 ampliado)
    print("\n[Paso 7] Consulta de Timeline ampliado con Publicaciones, Congresos y Estancias...")
    timeline_resp = client.get(f'/api/v2/monitoring/timeline/?student={student.id}')
    assert timeline_resp.status_code == 200
    events = timeline_resp.data['events']
    event_types = set(e['tipo'] for e in events)
    print(f"-> Tipos presentes en Timeline: {event_types}")
    assert 'PUBLICACION' in event_types
    assert 'EVENTO' in event_types
    assert 'ESTANCIA' in event_types
    assert 'PRODUCTO' in event_types

    # 8. Consultar Dashboard del Coordinador (HU-24)
    print("\n[Paso 8] Consulta de Dashboard del Coordinador con KPIs y Semáforo de Riesgo (HU-24)...")
    dash_resp = client.get('/api/v2/monitoring/coordinator-dashboard/')
    assert dash_resp.status_code == 200
    kpis = dash_resp.data['kpis']
    casos = dash_resp.data['casos_atencion']
    distribucion = dash_resp.data['distribucion_tesis_cohorte']
    print(f"-> KPIs: {kpis}")
    print(f"-> Casos de atención evaluados: {len(casos)}")
    print(f"-> Distribución de tesis por cohorte: {distribucion}")
    assert kpis['total_publicaciones'] >= 1
    assert len(casos) >= 1

    print("\n=================================================================")
    print("✅ TODAS LAS PRUEBAS DE INTEGRACIÓN DEL SPRINT 4 SATISFECHAS")
    print("=================================================================")

if __name__ == '__main__':
    run_sprint4_integration_test()
