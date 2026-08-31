from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.academic_output.views import (
    PublicationViewSet,
    AcademicEventViewSet,
    ResearchStayViewSet,
    OtherProductViewSet
)

router = DefaultRouter()
router.register(r'publications', PublicationViewSet, basename='publication')
router.register(r'academic-events', AcademicEventViewSet, basename='academic-event')
router.register(r'research-stays', ResearchStayViewSet, basename='research-stay')
router.register(r'other-products', OtherProductViewSet, basename='other-product')

urlpatterns = [
    path('', include(router.urls)),
]
