from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.evidence.views import EvidenceViewSet

router = DefaultRouter()
router.register(r'evidences', EvidenceViewSet, basename='evidence')

urlpatterns = [
    path('', include(router.urls)),
]
