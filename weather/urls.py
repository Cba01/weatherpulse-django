from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views

# The router generates list/detail routes (e.g. /favorites/ and
# /favorites/<pk>/) for each viewset from the actions it implements.
router = DefaultRouter()
# basename is required because the viewsets define get_queryset()
# instead of a class-level `queryset` attribute.
router.register("favorites", views.FavoriteCityViewSet, basename="favorite")
router.register("alerts", views.WeatherAlertViewSet, basename="alert")

urlpatterns = [
    path("weather/current/", views.current_weather, name="weather-current"),
    path("cities/search/", views.search_cities, name="cities-search"),
] + router.urls
