from django.urls import path
from .views import euro_price_api

app_name = "eurocalc"

urlpatterns = [
path("price/", euro_price_api, name="price")
]