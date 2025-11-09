from django.urls import path
from .views import american_price_api

app_name = "eurocalc_american"

urlpatterns = [
    path("price/", american_price_api, name="american_price"),
]
