from django.urls import path
from apps.monitoring.views import (
    MonitoringAlertsView,
    MonitoringTimelineView,
    CoordinatorDashboardView,
    SupervisionAlertsView
)

urlpatterns = [
    path('monitoring/alerts/', MonitoringAlertsView.as_view(), name='monitoring-alerts'),
    path('monitoring/timeline/', MonitoringTimelineView.as_view(), name='monitoring-timeline'),
    path('monitoring/coordinator-dashboard/', CoordinatorDashboardView.as_view(), name='coordinator-dashboard'),
    path('monitoring/supervision-alerts/', SupervisionAlertsView.as_view(), name='supervision-alerts'),
]
