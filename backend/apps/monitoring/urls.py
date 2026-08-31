from django.urls import path
from apps.monitoring.views import (
    MonitoringAlertsView,
    MonitoringTimelineView,
    CoordinatorDashboardView
)

urlpatterns = [
    path('monitoring/alerts/', MonitoringAlertsView.as_view(), name='monitoring-alerts'),
    path('monitoring/timeline/', MonitoringTimelineView.as_view(), name='monitoring-timeline'),
    path('monitoring/coordinator-dashboard/', CoordinatorDashboardView.as_view(), name='coordinator-dashboard'),
]
