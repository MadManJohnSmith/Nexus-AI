import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.identity.models import CustomUser
from apps.students.models import Student, Semester, AcademicCommittee

def run_seed():
    print("Iniciando seed de datos para Sprint 1...")
    
    # 1. Crear Coordinador
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
    print(f"Coordinador listo: {coord.email}")

    # 2. Crear Asesores
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
            'first_name': 'Dra. Ada',
            'last_name': 'Lovelace',
            'role': CustomUser.Role.ASESOR
        }
    )
    asesor2.set_password('AsesorSecure2025!')
    asesor2.save()
    print("Asesores listos: Alonzo Church y Ada Lovelace")

    # 3. Crear Estudiante
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
    print(f"Estudiante registrado: {student.matricula} - {student.nombre_completo}")

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
    print(f"Semestres configurados: Semestre 1 y Semestre 2 (Activo)")

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
    print("Comité académico asignado exitosamente.")
    print("Seed finalizado con éxito.")

if __name__ == '__main__':
    run_seed()
