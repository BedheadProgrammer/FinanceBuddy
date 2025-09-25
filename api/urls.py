from django.urls import path
from . import views

app_name = "api"
urlpatterns = [
    path("prices", views.prices, name="prices"),
]
