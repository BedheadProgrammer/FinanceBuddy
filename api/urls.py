# api/urls.py
from django.urls import path
from . import views

app_name = "api"

urlpatterns = [
    path("prices", views.prices, name="prices"),
path("assistant/american/", views.american_assistant, name="assistant_american"),
path("assistant/euro/", views.euro_assistant, name="assistant_euro"),

]
