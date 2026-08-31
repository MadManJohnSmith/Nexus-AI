import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.tutoring.models import TutoringSession
from apps.agreements.models import Agreement
from apps.thesis.models import ThesisProgress
from apps.evidence.models import Evidence

def run_e2e_mvp_acceptance():
    print("=================================================================")
    print("EJECUTANDO PRUEBA DE ACEPTACIÓN INTEGRAL DEL MVP (E2E LIVE TEST)")
    print("=================================================================")
    client = APIClient()

    # 1. Login como Asesor
    print("\n[Paso 1] Autenticación como Asesor...")
    login_resp = client.post('/api/v2/auth/login/', {
        'email': 'alonzo.church@posgrado.edu',
        'password': 'AsesorSecure2025!'
    }, format='json')
    assert login_resp.status_code == 200, f"Fallo login asesor: {login_resp.data}"
    asesor_token = login_resp.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {asesor_token}')
    print("-> Token JWT de Asesor obtenido exitosamente.")

    # Obtener estudiante y asegurar Semestre 3
    student = Student.objects.get(matricula='DOC-2024-001')
    sem3, _ = Semester.objects.get_or_create(
        student=student,
        numero=3,
        defaults={
            'fecha_inicio': date(2025, 1, 15),
            'fecha_fin': date(2025, 6, 30),
            'is_active': True
        }
    )
    print(f"-> Expediente estudiante: {student.nombre_completo} (Matrícula: {student.matricula}, Semestre: {sem3.numero})")

    # Registrar tutoría en Semestre 3
    print("\n[Paso 2] Asesor registra sesión de tutoría en Semestre 3...")
    tutoria_resp = client.post('/api/v2/tutoring-sessions/', {
        'student': student.id,
        'semester': sem3.id,
        'fecha_sesion': '2025-02-10',
        'modalidad': 'PRESENCIAL',
        'resumen_general': 'Revisión metodológica y definición de instrumentos de evaluación cualitativa.',
        'proxima_reunion_fecha': '2025-03-15',
        'proxima_reunion_notas': 'Evaluación del avance del capítulo metodológico.',
        'participants': [
            {'user': login_resp.data['user']['id'], 'rol_en_sesion': 'Asesor Principal', 'asistencia_confirmada': True}
        ],
        'observations': [
            {'autor': login_resp.data['user']['id'], 'tema_revisado': 'Metodología y Diseño Muestral', 'observaciones_detalladas': 'Instrumentos validados por expertos.'}
        ]
    }, format='json')
    assert tutoria_resp.status_code == 201, f"Fallo registro tutoría: {tutoria_resp.data}"
    sess_id = tutoria_resp.data['tutoring_session_created_id']
    print(f"-> Tutoría creada exitosamente (ID: {sess_id}).")

    # 2. Generar acuerdo
    print("\n[Paso 3] Derivar acuerdo 'Terminar instrumento de evaluación'...")
    student_user = student.user
    acuerdo_resp = client.post('/api/v2/agreements/', {
        'session': sess_id,
        'student': student.id,
        'semester': sem3.id,
        'descripcion': 'Terminar instrumento de evaluación y matriz de consistencia metodológica.',
        'responsable': student_user.id,
        'fecha_limite': (date.today() + timedelta(days=14)).isoformat(),
        'estado': 'PENDIENTE'
    }, format='json')
    assert acuerdo_resp.status_code == 201, f"Fallo registro acuerdo: {acuerdo_resp.data}"
    acuerdo_id = acuerdo_resp.data['agreement_created_id']
    print(f"-> Acuerdo derivado exitosamente (ID: {acuerdo_id}).")

    # 3. Login como Estudiante
    print("\n[Paso 4] Autenticación como Estudiante de Doctorado...")
    student_login = client.post('/api/v2/auth/login/', {
        'email': 'alan.turing@posgrado.edu',
        'password': 'StudentSecure2025!'
    }, format='json')
    assert student_login.status_code == 200, f"Fallo login estudiante: {student_login.data}"
    student_token = student_login.data['access']
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {student_token}')
    print("-> Token JWT de Estudiante obtenido.")

    # Cargar evidencia PDF (HU-21)
    print("\n[Paso 5] Estudiante carga evidencia documental PDF (HU-21)...")
    pdf_content = b"%PDF-1.4 Instrumento de evaluacion validado..."
    uploaded_file = SimpleUploadedFile("Instrumento_Evaluacion_Validado.pdf", pdf_content, content_type="application/pdf")
    ev_resp = client.post('/api/v2/evidences/', {
        'student': student.id,
        'semester': sem3.id,
        'actividad_tipo': 'ACUERDO',
        'actividad_id': acuerdo_id,
        'tipo': 'ARCHIVO_LOCAL',
        'archivo_adjunto': uploaded_file,
        'descripcion': 'Instrumento de Evaluación Cualitativa Validado por Comité'
    }, format='multipart')
    assert ev_resp.status_code == 201, f"Fallo carga evidencia: {ev_resp.data}"
    print(f"-> Evidencia documental registrada (ID: {ev_resp.data['evidence_created_id']}).")

    # Cargar evidencia DOI (HU-22)
    print("\n[Paso 6] Estudiante registra enlace digital DOI (HU-22)...")
    doi_resp = client.post('/api/v2/evidences/', {
        'student': student.id,
        'semester': sem3.id,
        'actividad_tipo': 'TESIS',
        'tipo': 'ENLACE_DOI',
        'url_doi': 'https://doi.org/10.1145/1234567.891011',
        'descripcion': 'Publicación DOI del Framework Experimental'
    }, format='json')
    assert doi_resp.status_code == 201, f"Fallo registro DOI: {doi_resp.data}"
    print(f"-> Enlace DOI registrado (ID: {doi_resp.data['evidence_created_id']}).")

    # Mover estado de acuerdo a EN_PROCESO
    print("\n[Paso 7] Estudiante actualiza acuerdo a EN_PROCESO...")
    status_resp = client.patch(f'/api/v2/agreements/{acuerdo_id}/status/', {
        'estado': 'EN_PROCESO',
        'comentario': 'Instrumentos aplicados y evidencia cargada en plataforma.'
    }, format='json')
    assert status_resp.status_code == 200, f"Fallo cambio estado acuerdo: {status_resp.data}"
    print("-> Acuerdo actualizado a EN_PROCESO.")

    # 4. Registrar avance de tesis al 45% (HU-15)
    print("\n[Paso 8] Registro de avance longitudinal de tesis al 45% (HU-15)...")
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {asesor_token}')
    thesis_resp = client.post('/api/v2/thesis-progress/', {
        'student': student.id,
        'semester': sem3.id,
        'porcentaje_avance': 45,
        'componentes_json': {
            'protocolo': 100,
            'estado_arte': 90,
            'marco_teorico': 60,
            'metodologia': 45,
            'analisis': 20,
            'redaccion': 10
        },
        'observaciones': 'Capítulo 3 estructurado conforme a metodología de agentes.'
    }, format='json')
    assert thesis_resp.status_code == 201, f"Fallo registro tesis: {thesis_resp.data}"
    print(f"-> Avance de tesis al 45% registrado exitosamente (ID: {thesis_resp.data['thesis_progress_created_id']}).")

    # 5. Consulta y verificación del Timeline Longitudinal
    print("\n[Paso 9] Consulta del Timeline Longitudinal unificado (HU-23)...")
    timeline_resp = client.get(f'/api/v2/monitoring/timeline/?student={student.id}')
    assert timeline_resp.status_code == 200, f"Fallo timeline: {timeline_resp.data}"
    events = timeline_resp.data['events']
    print(f"-> Total de eventos en el timeline: {len(events)}")
    
    event_types = set(e['tipo'] for e in events)
    assert 'TUTORIA' in event_types, "Falta TUTORIA en timeline"
    assert 'ACUERDO' in event_types, "Falta ACUERDO en timeline"
    assert 'TESIS' in event_types, "Falta TESIS en timeline"
    assert 'EVIDENCIA' in event_types, "Falta EVIDENCIA en timeline"

    print(f"-> Tipos de eventos presentes en el timeline: {event_types}")
    print("\nLISTADO DE EVENTOS CONSOLIDADOS:")
    for e in events[:6]:
        print(f"   [{e['tipo']}] {e['fecha']} - {e['titulo']} (Autor: {e['autor_nombre']})")

    # 6. Verificación del sistema de alertas
    print("\n[Paso 10] Verificación del endpoint de Alertas Reactivas (HU-25)...")
    alerts_resp = client.get('/api/v2/monitoring/alerts/')
    assert alerts_resp.status_code == 200
    print(f"-> Total alertas calculadas: {alerts_resp.data['total_alertas']} (Vencidos: {alerts_resp.data['total_vencidos']}, Por vencer: {alerts_resp.data['total_por_vencer']})")

    print("\n=================================================================")
    print("✅ TODAS LAS PRUEBAS DE ACEPTACIÓN INTEGRAL DEL MVP SATISFECHAS")
    print("=================================================================")

if __name__ == '__main__':
    run_e2e_mvp_acceptance()
