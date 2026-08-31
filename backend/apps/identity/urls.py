from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.identity.views import (
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    CurrentUserView,
    UserViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='current_user'),
    path('', include(router.urls)),
]
