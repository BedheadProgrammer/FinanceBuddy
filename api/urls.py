# api/urls.py
from django.urls import path
from . import views
from . import portfolio_assistant
from . import portfolio_views

app_name = "api"

urlpatterns = [
    path("prices", views.prices, name="prices"),
    path("assistant/american/", views.american_assistant, name="assistant_american"),
    path("assistant/euro/", views.euro_assistant, name="assistant_euro"),
    path("portfolio/summary/", views.portfolio_summary, name="portfolio_summary"),
    path("portfolio/trade/", views.execute_trade, name="execute_trade"),
    path("assistant/portfolio/", portfolio_assistant.portfolio_assistant, name="assistant_portfolio"),

    path("portfolios/", portfolio_views.list_portfolios, name="list_portfolios"),
    path("portfolios/create/", portfolio_views.create_portfolio, name="create_portfolio"),
    path("portfolios/<int:portfolio_id>/", portfolio_views.portfolio_detail, name="portfolio_detail"),
    path("portfolios/<int:portfolio_id>/set_default/", portfolio_views.set_default_portfolio, name="set_default_portfolio"),
]
