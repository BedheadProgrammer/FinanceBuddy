from django.urls import path

from .views import (
    HomeView,
    option_trade_api,
    option_positions_api,
    option_trades_api,
    option_snapshot_api,
    option_exercise_api
)

app_name = "optnstrdr"

urlpatterns = [
    path("", HomeView.as_view(), name="home"),
    path("api/options/trade/", option_trade_api, name="option_trade_api"),
    path("api/options/positions/", option_positions_api, name="option_positions_api"),
    path("api/options/trades/", option_trades_api, name="option_trades_api"),
    path("api/options/snapshot/", option_snapshot_api, name="option_snapshot_api"),
path("api/options/exercise/", option_exercise_api, name="option-exercise-api"),

]
