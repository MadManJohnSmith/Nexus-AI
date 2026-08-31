from django.urls import path
from apps.reporting.views import FullDossierView, StudentDossierExportView

urlpatterns = [
    path('reporting/students/<int:student_id>/full-dossier/', FullDossierView.as_view(), name='student-full-dossier'),
    path('reporting/students/<int:student_id>/export/', StudentDossierExportView.as_view(), name='student-dossier-export'),
]
