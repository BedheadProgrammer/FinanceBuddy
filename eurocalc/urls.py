from django.urls import path
from .views import euro_price_api

app_name = "eurocalc"

urlpatterns = [
path("euro/", euro_price_api, name="api")
]