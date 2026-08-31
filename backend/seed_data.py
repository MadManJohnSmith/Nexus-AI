import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.tutoring.models import TutoringSession, TutoringParticipant, TutoringObservation
from apps.agreements.models import Agreement, AgreementAuditLog

def run_seed():
    print("Iniciando seed de datos para Sprint 1 y 2...")
    
    # 1. Coordinador
    coord, _ = CustomUser.objects.get_or_create(
        email='coordinador@posgrado.edu',
        defaults={
            'first_name': 'Dra. Elena',
            'last_name': 'Rostova',
            'role': CustomUser.Role.COORDINADOR,
            'is_staff': True,
            'is_superuser': True
        }
    )
    coord.set_password('NexusCoord2025!')
    coord.save()

    # 2. Asesores
    asesor1, _ = CustomUser.objects.get_or_create(
        email='alonzo.church@posgrado.edu',
        defaults={
            'first_name': 'Dr. Alonzo',
            'last_name': 'Church',
            'role': CustomUser.Role.ASESOR
        }
    )
    asesor1.set_password('AsesorSecure2025!')
    asesor1.save()

    asesor2, _ = CustomUser.objects.get_or_create(
        email='ada.lovelace@posgrado.edu',
        defaults={
            'first_name': 'Dra. Barbara',
            'last_name': 'Liskov',
            'role': CustomUser.Role.ASESOR
        }
    )
    asesor2.set_password('AsesorSecure2025!')
    asesor2.save()

    # 3. Estudiante
    estudiante_user, _ = CustomUser.objects.get_or_create(
        email='alan.turing@posgrado.edu',
        defaults={
            'first_name': 'Alan',
            'last_name': 'Turing',
            'role': CustomUser.Role.ESTUDIANTE
        }
    )
    estudiante_user.set_password('StudentSecure2025!')
    estudiante_user.save()

    student, _ = Student.objects.get_or_create(
        matricula='DOC-2024-001',
        defaults={
            'user': estudiante_user,
            'nombre_completo': 'Alan Turing',
            'programa_doctoral': 'Doctorado en Ciencias de la Computación',
            'fecha_ingreso': date(2024, 1, 15),
            'cohorte': '2024-A',
            'estatus_activo': True
        }
    )

    # 4. Semestres
    s1, _ = Semester.objects.get_or_create(
        student=student,
        numero=1,
        defaults={
            'fecha_inicio': date(2024, 1, 15),
            'fecha_fin': date(2024, 6, 30),
            'is_active': False
        }
    )
    s2, _ = Semester.objects.get_or_create(
        student=student,
        numero=2,
        defaults={
            'fecha_inicio': date(2024, 8, 1),
            'fecha_fin': date(2024, 12, 15),
            'is_active': True
        }
    )

    # 5. Comité Tutoral
    AcademicCommittee.objects.get_or_create(
        student=student,
        user=asesor1,
        rol_comite=AcademicCommittee.RolComite.ASESOR_PRINCIPAL
    )
    AcademicCommittee.objects.get_or_create(
        student=student,
        user=asesor2,
        rol_comite=AcademicCommittee.RolComite.COASESOR
    )

    # 6. Sesiones de Tutoría
    sess1, _ = TutoringSession.objects.get_or_create(
        student=student,
        semester=s1,
        fecha_sesion=date(2024, 3, 10),
        defaults={
            'modalidad': TutoringSession.Modalidad.PRESENCIAL,
            'resumen_general': 'Revisión inicial del protocolo de investigación doctoral y delimitación del estado del arte.',
            'proxima_reunion_fecha': date(2024, 4, 15),
            'proxima_reunion_notas': 'Entrega de primera versión del marco teórico con 30 referencias indexadas.',
            'created_by': asesor1
        }
    )
    TutoringParticipant.objects.get_or_create(session=sess1, user=asesor1, defaults={'rol_en_sesion': 'Asesor Principal'})
    TutoringParticipant.objects.get_or_create(session=sess1, user=estudiante_user, defaults={'rol_en_sesion': 'Doctorando'})
    TutoringObservation.objects.get_or_create(
        session=sess1,
        autor=asesor1,
        tema_revisado='Protocolo y Marco Teórico',
        defaults={'observaciones_detalladas': 'El enfoque de agentes es sólido. Se recomienda acotar los benchmarks experimentales.'}
    )

    sess2, _ = TutoringSession.objects.get_or_create(
        student=student,
        semester=s2,
        fecha_sesion=date(2024, 9, 20),
        defaults={
            'modalidad': TutoringSession.Modalidad.VIRTUAL,
            'resumen_general': 'Evaluación del diseño experimental y pipeline de procesamiento con LLMs.',
            'proxima_reunion_fecha': date(2024, 11, 5),
            'proxima_reunion_notas': 'Demostración del prototipo funcional.',
            'created_by': asesor1
        }
    )
    TutoringParticipant.objects.get_or_create(session=sess2, user=asesor1, defaults={'rol_en_sesion': 'Asesor Principal'})
    TutoringParticipant.objects.get_or_create(session=sess2, user=asesor2, defaults={'rol_en_sesion': 'Coasesora'})
    TutoringObservation.objects.get_or_create(
        session=sess2,
        autor=asesor2,
        tema_revisado='Métricas y Arquitectura DRF/Angular',
        defaults={'observaciones_detalladas': 'Excelente modularidad. Asegurar que las validaciones relacionales no generen sobrecarga N+1.'}
    )

    # 7. Acuerdos con los 4 Estados del Semáforo
    a1, _ = Agreement.objects.get_or_create(
        student=student,
        session=sess1,
        semester=s1,
        descripcion='Entrega de Protocolo Doctoral Aprobado por el Comité.',
        defaults={
            'responsable': estudiante_user,
            'fecha_limite': date(2024, 5, 30),
            'estado': Agreement.Estado.CONCLUIDO,
            'modificado_por': asesor1
        }
    )
    AgreementAuditLog.objects.get_or_create(
        agreement=a1,
        estado_anterior='PENDIENTE',
        estado_nuevo='CONCLUIDO',
        defaults={'cambiado_por': asesor1, 'comentario': 'Protocolo validado y aprobado en sesión extraordinaria.'}
    )

    a2, _ = Agreement.objects.get_or_create(
        student=student,
        session=sess2,
        semester=s2,
        descripcion='Borrador de Artículo para Journal JCR Q1.',
        defaults={
            'responsable': estudiante_user,
            'fecha_limite': date.today() + timedelta(days=20),
            'estado': Agreement.Estado.EN_PROCESO,
            'modificado_por': asesor1
        }
    )
    AgreementAuditLog.objects.get_or_create(
        agreement=a2,
        estado_anterior='PENDIENTE',
        estado_nuevo='EN_PROCESO',
        defaults={'cambiado_por': estudiante_user, 'comentario': 'Sección de resultados en redacción avanzada.'}
    )

    a3, _ = Agreement.objects.get_or_create(
        student=student,
        session=sess2,
        semester=s2,
        descripcion='Implementación del módulo de Machine Learning en Python.',
        defaults={
            'responsable': estudiante_user,
            'fecha_limite': date.today() + timedelta(days=40),
            'estado': Agreement.Estado.PENDIENTE,
            'modificado_por': asesor1
        }
    )

    a4, _ = Agreement.objects.get_or_create(
        student=student,
        session=sess1,
        semester=s1,
        descripcion='Registro de asignaturas optativas y seminario doctoral.',
        defaults={
            'responsable': estudiante_user,
            'fecha_limite': date(2024, 6, 1),
            'estado': Agreement.Estado.VENCIDO,
            'modificado_por': None
        }
    )
    AgreementAuditLog.objects.get_or_create(
        agreement=a4,
        estado_anterior='PENDIENTE',
        estado_nuevo='VENCIDO',
        defaults={'cambiado_por': None, 'comentario': 'Fecha límite superada sin confirmación de trámite.'}
    )

    print("Seed de Sprint 1 y Sprint 2 completado exitosamente.")

if __name__ == '__main__':
    run_seed()
