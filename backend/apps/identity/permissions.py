from rest_framework import permissions
from apps.identity.models import CustomUser

class IsCoordinator(permissions.BasePermission):
    """
    Permite acceso únicamente a coordinadores o administradores de staff.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == CustomUser.Role.COORDINADOR or request.user.is_staff)
        )


class IsAssignedAdvisor(permissions.BasePermission):
    """
    Permite acceso si el usuario es Asesor/Coasesor asignado al estudiante,
    o si es Coordinador.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == CustomUser.Role.COORDINADOR or request.user.is_staff:
            return True

        if request.user.role != CustomUser.Role.ASESOR:
            return False

        # Extraer el estudiante según el tipo de objeto
        student = getattr(obj, 'student', obj)
        from apps.students.models import Student
        if isinstance(student, Student):
            return student.academic_committee.filter(
                user=request.user,
                is_active=True
            ).exists()

        return False


class IsStudentOwner(permissions.BasePermission):
    """
    Permite acceso si el usuario autenticado es el estudiante dueño del expediente/recurso,
    o un asesor asignado, o el coordinador.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role == CustomUser.Role.COORDINADOR or request.user.is_staff:
            return True

        student = getattr(obj, 'student', obj)
        from apps.students.models import Student
        if isinstance(student, Student):
            # El estudiante es dueño si su usuario está asociado al perfil
            if student.user and student.user == request.user:
                return True

            # Si es asesor asignado
            if request.user.role == CustomUser.Role.ASESOR:
                return student.academic_committee.filter(
                    user=request.user,
                    is_active=True
                ).exists()

        return False


class IsCoordinatorOrReadOnly(permissions.BasePermission):
    """
    Permite lectura a usuarios autenticados, y escritura sólo a coordinadores.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == CustomUser.Role.COORDINADOR or request.user.is_staff
