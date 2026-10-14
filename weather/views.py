from rest_framework import mixins, viewsets
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from . import services
from .models import City, FavoriteCity, WeatherAlert
from .permissions import IsOwner
from .serializers import (
    CitySearchQuerySerializer,
    CitySerializer,
    CurrentWeatherQuerySerializer,
    FavoriteCitySerializer,
    WeatherAlertSerializer,
)


@api_view(["GET"])
def current_weather(request):
    """GET /api/weather/current/?lat=..&lon=..

    Passes the OpenWeatherMap payload through as-is. Service errors are
    turned into 404/503 by weather.exceptions.custom_exception_handler.
    """
    query = CurrentWeatherQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)

    data = services.get_current_weather(**query.validated_data)
    return Response(data)


@api_view(["GET"])
def search_cities(request):
    """GET /api/cities/search/?q=..&limit=..

    Geocodes the query and stores each match as a City, so the returned
    ids can be used directly as `city_id` for favorites and alerts.
    """
    query = CitySearchQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)

    matches = services.geocode_city(query.validated_data["q"], query.validated_data["limit"])

    cities = {}
    for match in matches:
        city, _ = City.objects.get_or_create(
            name=match["name"],
            country=match["country"],
            defaults={"lat": match["lat"], "lon": match["lon"]},
        )
        # Geocoding can return several hits that map to the same
        # (name, country) row; keep each City only once.
        cities[city.pk] = city

    return Response(CitySerializer(cities.values(), many=True).data)


class FavoriteCityViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """/api/favorites/ — list, add, retrieve and remove the user's favorite cities.

    No update/partial_update: a favorite only points at a city, so
    "editing" one means deleting it and adding another.
    """

    serializer_class = FavoriteCitySerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        # Only the current user's rows; select_related joins City in the same
        # query so the nested CitySerializer doesn't cause N+1 queries.
        return FavoriteCity.objects.filter(user=self.request.user).select_related("city")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeatherAlertViewSet(viewsets.ModelViewSet):
    """/api/alerts/ — full CRUD over the user's weather alerts."""

    serializer_class = WeatherAlertSerializer
    permission_classes = [IsAuthenticated, IsOwner]

    def get_queryset(self):
        # WeatherAlert has no Meta.ordering; pagination needs a stable order.
        return (
            WeatherAlert.objects.filter(user=self.request.user)
            .select_related("city")
            .order_by("-id")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
