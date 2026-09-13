from django.conf import settings
from django.db import models


class City(models.Model):
    """A geocoded city. Cached locally so we don't re-hit the
    OpenWeatherMap geocoding endpoint for a city we've already resolved."""

    name = models.CharField(max_length=150)
    country = models.CharField(max_length=2)  # ISO 3166-1 alpha-2, e.g. "AR"
    lat = models.FloatField()
    lon = models.FloatField()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "country"], name="unique_city_name_country"),
        ]

    def __str__(self):
        return f"{self.name}, {self.country}"


class FavoriteCity(models.Model):
    """A user's saved/favorited city, for quick access and comparison."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="favorite_cities",
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="favorited_by",
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "city"], name="unique_user_favorite_city"),
        ]
        ordering = ["-added_at"]

    def __str__(self):
        return f"{self.user} → {self.city}"


class WeatherAlert(models.Model):
    """A user-configured rule that Celery evaluates periodically
    (e.g. 'notify me if it rains in Buenos Aires')."""

    class Condition(models.TextChoices):
        RAIN = "rain", "Rain"
        TEMP_BELOW = "temp_below", "Temperature below threshold"
        TEMP_ABOVE = "temp_above", "Temperature above threshold"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="weather_alerts",
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name="alerts",
    )
    condition = models.CharField(max_length=20, choices=Condition.choices)
    threshold = models.FloatField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} alert on {self.city} ({self.condition})"
