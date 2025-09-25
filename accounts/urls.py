from django.urls import path
from .views import DashboardView

app_name = "accounts"
urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]