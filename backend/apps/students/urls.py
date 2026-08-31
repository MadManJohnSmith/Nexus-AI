from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.students.views import StudentViewSet, SemesterViewSet

router = DefaultRouter()
router.register(r'students', StudentViewSet, basename='student')
router.register(r'semesters', SemesterViewSet, basename='semester')

urlpatterns = [
    path('', include(router.urls)),
]
