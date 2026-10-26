"""DRF serializers for the weather app.

These define the JSON contract for each model: what fields go out on a
GET, and what fields are accepted / validated on a POST or PATCH.
"""

from rest_framework import serializers

from .models import City, FavoriteCity, WeatherAlert


class CitySerializer(serializers.ModelSerializer):
    """Read-only representation of a geocoded city.

    Cities are created by the geocoding flow, not by direct client POSTs,
    so this serializer is only ever used to *render* a city (usually
    nested inside a favorite or an alert).
    """

    class Meta:
        model = City
        fields = ["id", "name", "country", "lat", "lon"]


class CurrentWeatherQuerySerializer(serializers.Serializer):
    """Validates ?lat=&lon= for the current-weather endpoint.

    A plain Serializer (not a ModelSerializer): it isn't tied to any model,
    it only declares and validates input fields.
    """

    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class CitySearchQuerySerializer(serializers.Serializer):
    """Validates ?q=&limit= for the city-search endpoint."""

    q = serializers.CharField(min_length=2, max_length=150, trim_whitespace=True)
    limit = serializers.IntegerField(min_value=1, max_value=5, default=5)


class FavoriteCitySerializer(serializers.ModelSerializer):
    # Output: the full city object, so the frontend doesn't need a second request.
    city = CitySerializer(read_only=True)
    # Input: just the id of an existing City. `source="city"` wires this
    # field to the model's `city` attribute; the queryset makes DRF verify
    # the City exists (a bad id -> 400, not a 500).
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        source="city",
        write_only=True,
    )

    class Meta:
        model = FavoriteCity
        # `user` is intentionally absent: the view sets it from request.user
        # via serializer.save(user=...). It must never come from the payload.
        fields = ["id", "city", "city_id", "added_at"]
        read_only_fields = ["id", "added_at"]

    def validate_city_id(self, city):
        """Reject duplicates with a 400 instead of letting the DB constraint
        raise IntegrityError (500). `user` isn't a field here, so DRF can't
        build a UniqueTogetherValidator for us; the view passes the request
        in the serializer context."""
        user = self.context["request"].user
        if FavoriteCity.objects.filter(user=user, city=city).exists():
            raise serializers.ValidationError("Esta ciudad ya está en tus favoritos.")
        return city


class WeatherAlertSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    city_id = serializers.PrimaryKeyRelatedField(
        queryset=City.objects.all(),
        source="city",
        write_only=True,
    )

    class Meta:
        model = WeatherAlert
        # `user` set server-side (see FavoriteCitySerializer).
        # `last_triggered` is written only by the Celery task, never the client.
        fields = [
            "id",
            "city",
            "city_id",
            "condition",
            "threshold",
            "is_active",
            "last_triggered",
        ]
        read_only_fields = ["id", "last_triggered"]

    def validate(self, attrs):
        """Cross-field rule: temperature alerts need a threshold.

        Runs on both create and partial update, so when `condition` or
        `threshold` is missing from the payload we fall back to the value
        already on the instance (self.instance is None on create).
        """
        condition = attrs.get("condition")
        if condition is None and self.instance is not None:
            condition = self.instance.condition

        threshold = attrs.get("threshold", serializers.empty)
        if threshold is serializers.empty:
            threshold = self.instance.threshold if self.instance is not None else None

        needs_threshold = condition in (
            WeatherAlert.Condition.TEMP_BELOW,
            WeatherAlert.Condition.TEMP_ABOVE,
        )
        if needs_threshold and threshold is None:
            raise serializers.ValidationError(
                {"threshold": "Este campo es obligatorio en las alertas de temperatura."}
            )
        return attrs
