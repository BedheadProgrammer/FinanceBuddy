# optnstrdr/urls.py
from django.urls import path
from .views import HomeView  # or from .views import home if you used a function view

app_name = "optnstrdr"

urlpatterns = [
    path("", HomeView.as_view(), name="home"),  # or path("", home, name="home"),
]
