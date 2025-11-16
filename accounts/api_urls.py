from django.urls import path
from . import api_views

app_name = "accounts_api"

urlpatterns = [
    path("login/", api_views.login_view, name="login"),
    path("register/", api_views.register_view, name="register"),
]
