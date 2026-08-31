from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.thesis.views import ThesisProgressViewSet

router = DefaultRouter()
router.register(r'thesis-progress', ThesisProgressViewSet, basename='thesis-progress')

urlpatterns = [
    path('', include(router.urls)),
]
