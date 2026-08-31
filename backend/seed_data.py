import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee
from apps.tutoring.models import TutoringSession, TutoringParticipant, TutoringObservation
from apps.agreements.models import Agreement, AgreementAuditLog
from apps.thesis.models import ThesisProgress
from apps.evidence.models import Evidence
from apps.academic_output.models import Publication, AcademicEvent, ResearchStay, OtherProduct

def run_seed():
    print("=================================================================")
    print("CARGANDO DATOS DEMO COMPLETOS DE N.E.X.U.S. (RELEASE RC 1.0)")
    print("=================================================================")
    
    # 1. Administrador del Sistema
    admin_user, _ = CustomUser.objects.get_or_create(
        email='admin@posgrado.edu',
        defaults={
            'first_name': 'Super',
            'last_name': 'Administrador',
            'role': CustomUser.Role.COORDINADOR,
            'is_staff': True,
            'is_superuser': True
        }
    )
    admin_user.set_password('NexusAdmin2025!')
    admin_user.save()
    print("-> 1 Administrador cargado (admin@posgrado.edu).")

    # 2. Coordinadora de Posgrado
    coord_user, _ = CustomUser.objects.get_or_create(
        email='coordinador@posgrado.edu',
        defaults={
            'first_name': 'Dra. Elena',
            'last_name': 'Rostova',
            'role': CustomUser.Role.COORDINADOR,
            'is_staff': True,
            'is_superuser': True
        }
    )
    coord_user.set_password('NexusCoord2025!')
    coord_user.save()
    print("-> 1 Coordinador cargado (coordinador@posgrado.edu).")

    # 3. 5 Asesores Académicos
    asesores_data = [
        ('alonzo.church@posgrado.edu', 'Dr. Alonzo', 'Church', 'AsesorSecure2025!'),
        ('claude.shannon@posgrado.edu', 'Dr. Claude', 'Shannon', 'AsesorSecure2025!'),
        ('ada.lovelace@posgrado.edu', 'Dra. Ada', 'Lovelace', 'AsesorSecure2025!'),
        ('john.vonneumann@posgrado.edu', 'Dr. John', 'Von Neumann', 'AsesorSecure2025!'),
        ('grace.hopper@posgrado.edu', 'Dra. Grace', 'Hopper', 'AsesorSecure2025!')
    ]
    asesores = []
    for email, fn, ln, pwd in asesores_data:
        u, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={'first_name': fn, 'last_name': ln, 'role': CustomUser.Role.ASESOR}
        )
        u.set_password(pwd)
        u.save()
        asesores.append(u)
    print(f"-> {len(asesores)} Asesores cargados exitosamente.")

    # 4. 10 Estudiantes en Semestres 1 a 6 con Trayectorias Completas
    estudiantes_data = [
        ('alan.turing@posgrado.edu', 'Alan', 'Turing', 'DOC-2024-001', 'Doctorado en Ciencias de la Computación', '2024-A', 3, asesores[0], asesores[1]),
        ('katherine.johnson@posgrado.edu', 'Katherine', 'Johnson', 'DOC-2023-002', 'Doctorado en Ciencias de la Computación', '2023-B', 4, asesores[1], asesores[2]),
        ('margaret.hamilton@posgrado.edu', 'Margaret', 'Hamilton', 'DOC-2022-003', 'Doctorado en Ingeniería de Software', '2022-A', 6, asesores[2], asesores[3]),
        ('linus.torvalds@posgrado.edu', 'Linus', 'Torvalds', 'DOC-2024-004', 'Doctorado en Sistemas Distribuidos', '2024-B', 2, asesores[3], asesores[4]),
        ('barbara.liskov@posgrado.edu', 'Barbara', 'Liskov', 'DOC-2023-005', 'Doctorado en Ingeniería de Software', '2023-A', 5, asesores[4], asesores[0]),
        ('donald.knuth@posgrado.edu', 'Donald', 'Knuth', 'DOC-2025-006', 'Doctorado en Ciencias de la Computación', '2025-A', 1, asesores[0], asesores[2]),
        ('tim.bernerslee@posgrado.edu', 'Tim', 'Berners-Lee', 'DOC-2024-007', 'Doctorado en Sistemas Inteligentes', '2024-A', 3, asesores[1], asesores[4]),
        ('eddsger.dijkstra@posgrado.edu', 'Edsger', 'Dijkstra', 'DOC-2023-008', 'Doctorado en Métodos Formales', '2023-B', 4, asesores[3], asesores[0]),
        ('shafi.goldwasser@posgrado.edu', 'Shafi', 'Goldwasser', 'DOC-2022-009', 'Doctorado en Criptografía Avanzada', '2022-B', 6, asesores[2], asesores[1]),
        ('dennis.ritchie@posgrado.edu', 'Dennis', 'Ritchie', 'DOC-2024-010', 'Doctorado en Arquitectura de Software', '2024-B', 2, asesores[4], asesores[3]),
    ]

    for email, fn, ln, mat, prog, coh, sem_act, as_p, as_c in estudiantes_data:
        st_user, _ = CustomUser.objects.get_or_create(
            email=email,
            defaults={'first_name': fn, 'last_name': ln, 'role': CustomUser.Role.ESTUDIANTE}
        )
        st_user.set_password('StudentSecure2025!')
        st_user.save()

        student, _ = Student.objects.get_or_create(
            matricula=mat,
            defaults={
                'user': st_user,
                'nombre_completo': f"{fn} {ln}",
                'programa_doctoral': prog,
                'fecha_ingreso': date(2022 if '2022' in coh else (2023 if '2023' in coh else (2024 if '2024' in coh else 2025)), 1 if 'A' in coh else 8, 15),
                'cohorte': coh,
                'estatus_activo': True
            }
        )

        # Semestres 1 a sem_act
        for num in range(1, sem_act + 1):
            sem, _ = Semester.objects.get_or_create(
                student=student,
                numero=num,
                defaults={
                    'fecha_inicio': date(2023, 1, 15) + timedelta(days=(num - 1) * 180),
                    'fecha_fin': date(2023, 6, 30) + timedelta(days=(num - 1) * 180),
                    'is_active': (num == sem_act)
                }
            )

            # Comité
            if num == 1:
                AcademicCommittee.objects.get_or_create(
                    student=student,
                    user=as_p,
                    defaults={'rol_comite': AcademicCommittee.RolComite.ASESOR_PRINCIPAL}
                )
                AcademicCommittee.objects.get_or_create(
                    student=student,
                    user=as_c,
                    defaults={'rol_comite': AcademicCommittee.RolComite.COASESOR}
                )

            # Tutoría por semestre
            tut, _ = TutoringSession.objects.get_or_create(
                student=student,
                semester=sem,
                fecha_sesion=sem.fecha_inicio + timedelta(days=30),
                defaults={
                    'modalidad': TutoringSession.Modalidad.PRESENCIAL,
                    'resumen_general': f"Revisión y seguimiento del plan de trabajo en Semestre {num}.",
                    'created_by': as_p,
                    'proxima_reunion_fecha': sem.fecha_inicio + timedelta(days=60),
                    'proxima_reunion_notas': "Evaluación de avances metodológicos y entregables."
                }
            )
            TutoringParticipant.objects.get_or_create(session=tut, user=as_p, defaults={'rol_en_sesion': 'Director de Tesis'})
            TutoringParticipant.objects.get_or_create(session=tut, user=st_user, defaults={'rol_en_sesion': 'Doctorando'})

            TutoringObservation.objects.get_or_create(
                session=tut,
                autor=as_p,
                tema_revisado=f"Avance de Tesis Semestre {num}",
                defaults={'observaciones_detalladas': f"Cumplimiento satisfactorio de metas pactadas para el semestre {num}."}
            )

            # Acuerdos en 4 Estados
            estados = [Agreement.Estado.PENDIENTE, Agreement.Estado.EN_PROCESO, Agreement.Estado.CONCLUIDO, Agreement.Estado.VENCIDO]
            for idx_e, est in enumerate(estados):
                agr, _ = Agreement.objects.get_or_create(
                    student=student,
                    semester=sem,
                    descripcion=f"Compromiso de {est} - Semestre {num} (#{idx_e+1})",
                    defaults={
                        'session': tut,
                        'responsable': st_user,
                        'fecha_limite': date.today() + timedelta(days=15 if est != Agreement.Estado.VENCIDO else -10),
                        'estado': est
                    }
                )
                AgreementAuditLog.objects.get_or_create(
                    agreement=agr,
                    cambiado_por=as_p,
                    estado_anterior='',
                    estado_nuevo=est,
                    defaults={'comentario': f'Creación inicial del acuerdo en estado {est}.'}
                )

            # Avance de Tesis
            pct = min(100, int((num / 6) * 100))
            ThesisProgress.objects.get_or_create(
                student=student,
                semester=sem,
                defaults={
                    'porcentaje_avance': pct,
                    'fecha_registro': sem.fecha_inicio + timedelta(days=50),
                    'registrado_por': as_p,
                    'observaciones': f"Evaluación semestral {num} con avance global del {pct}%.",
                    'componentes_json': {
                        'protocolo': min(100, pct * 2),
                        'estado_arte': min(100, int(pct * 1.5)),
                        'marco_teorico': min(100, int(pct * 1.2)),
                        'metodologia': min(100, pct),
                        'analisis': max(0, pct - 20),
                        'redaccion': max(0, pct - 30)
                    }
                }
            )

        # Publicación Científica (HU-17)
        sem_1 = student.semesters.first()
        Publication.objects.get_or_create(
            student=student,
            semester=sem_1,
            titulo=f"Autonomous Multi-Agent Investigation - Research of {student.nombre_completo}",
            defaults={
                'autores_texto': f"{student.nombre_completo}, {student.asesor_principal}",
                'tipo': Publication.TipoPublicacion.ARTICULO_JCR,
                'revista_editorial': 'IEEE Transactions on Software Engineering',
                'estado': Publication.Estado.PUBLICADO,
                'fecha_publicacion': date(2024, 6, 15),
                'doi_url': f"https://doi.org/10.1109/TSE.2024.{student.id}001"
            }
        )

        # Congreso (HU-18)
        AcademicEvent.objects.get_or_create(
            student=student,
            semester=sem_1,
            titulo_ponencia=f"Longitudinal Tracking & AI Supervision: A Study by {student.nombre_completo}",
            defaults={
                'tipo_evento': AcademicEvent.TipoEvento.CONGRESO_INTERNACIONAL,
                'nombre_evento': 'ACM/IEEE International Conference on Automated Software Engineering (ASE)',
                'fecha_presentacion': date(2024, 9, 20),
                'sede_lugar': 'Sacramento, California, EE. UU.',
                'modalidad': AcademicEvent.Modalidad.PRESENCIAL
            }
        )

        # Estancia (HU-19)
        ResearchStay.objects.get_or_create(
            student=student,
            semester=sem_1,
            institucion_receptora='Stanford AI Laboratory (SAIL)',
            defaults={
                'pais': 'Estados Unidos',
                'fecha_inicio': date(2024, 7, 1),
                'fecha_fin': date(2024, 9, 1),
                'responsable_estancia': 'Prof. Andrew Ng',
                'objetivos': 'Desarrollo y validación de modelos de orquestación multi-agente.'
            }
        )

    print(f"-> 10 Estudiantes con semestres 1 a 6, comités, tutorías, acuerdos, tesis y publicaciones cargados.")
    print("\n=================================================================")
    print("✅ BASE DE DATOS DE DEMOSTRACIÓN CARGADA SATISFACTORIAMENTE")
    print("=================================================================")

if __name__ == '__main__':
    run_seed()
