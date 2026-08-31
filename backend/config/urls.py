from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v2/', include('apps.identity.urls')),
    path('api/v2/', include('apps.students.urls')),
    path('api/v2/', include('apps.tutoring.urls')),
    path('api/v2/', include('apps.agreements.urls')),
    path('api/v2/', include('apps.thesis.urls')),
    path('api/v2/', include('apps.evidence.urls')),
    path('api/v2/', include('apps.monitoring.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
