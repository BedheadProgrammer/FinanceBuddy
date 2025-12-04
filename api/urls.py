# api/urls.py
from django.urls import path
from . import views
from . import portfolio_assistant

app_name = "api"

urlpatterns = [
    path("prices", views.prices, name="prices"),
path("assistant/american/", views.american_assistant, name="assistant_american"),
path("assistant/euro/", views.euro_assistant, name="assistant_euro"),
    path("portfolio/summary/", views.portfolio_summary, name="portfolio_summary"),
    path("portfolio/trade/", views.execute_trade, name="execute_trade"),
path("assistant/portfolio/", portfolio_assistant.portfolio_assistant, name="portfolio_assistant"),

]
