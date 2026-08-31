from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework import status
from django.http import HttpResponse, JsonResponse
from apps.identity.models import CustomUser
from apps.students.models import Student
from apps.reporting.services import DossierService, ExportService


class FullDossierView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        user = request.user
        if hasattr(user, 'role'):
            if user.role == CustomUser.Role.ESTUDIANTE and student.user != user:
                raise PermissionDenied("No tiene autorización para consultar este expediente.")
            if user.role == CustomUser.Role.ASESOR:
                if not student.academic_committee.filter(user=user, is_active=True).exists():
                    raise PermissionDenied("No tiene autorización para consultar este expediente.")

        dossier = DossierService.get_full_dossier(student_id)
        return Response(dossier, status=status.HTTP_200_OK)


class StudentDossierExportView(View):
    def get(self, request, student_id, *args, **kwargs):
        user = request.user
        if not user or not user.is_authenticated:
            return JsonResponse({'detail': 'Las credenciales de autenticación no se proveyeron.'}, status=401)

        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return JsonResponse({'error': 'Estudiante no encontrado.'}, status=404)

        if hasattr(user, 'role'):
            if user.role == CustomUser.Role.ESTUDIANTE and student.user != user:
                return JsonResponse({'detail': 'No tiene autorización para exportar este expediente.'}, status=403)
            if user.role == CustomUser.Role.ASESOR:
                if not student.academic_committee.filter(user=user, is_active=True).exists():
                    return JsonResponse({'detail': 'No tiene autorización para exportar este expediente.'}, status=403)

        export_format = (request.GET.get('format') or 'pdf').lower()
        dossier = DossierService.get_full_dossier(student_id)

        if export_format in ['xlsx', 'excel']:
            file_bytes = ExportService.generate_excel(dossier)
            clean_name = student.nombre_completo.replace(' ', '_')
            filename = f"Expediente_{student.matricula}_{clean_name}.xlsx"
            response = HttpResponse(
                file_bytes,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                status=200
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        elif export_format == 'pdf':
            file_bytes = ExportService.generate_pdf(dossier)
            clean_name = student.nombre_completo.replace(' ', '_')
            filename = f"Expediente_{student.matricula}_{clean_name}.pdf"
            response = HttpResponse(file_bytes, content_type='application/pdf', status=200)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response

        else:
            return JsonResponse(
                {'error': 'Formato no soportado. Utilice format=pdf o format=xlsx.'},
                status=400
            )
