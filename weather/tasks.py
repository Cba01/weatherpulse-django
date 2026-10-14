"""Celery tasks for the weather app."""

import logging
from collections import defaultdict
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from . import services
from .models import WeatherAlert

logger = logging.getLogger(__name__)

# After firing, an alert stays quiet this long so a rainy afternoon doesn't
# re-trigger it on every 30-minute run.
ALERT_COOLDOWN = timedelta(hours=6)

# OpenWeatherMap "main" groups that count as rain.
RAIN_GROUPS = {"Rain", "Drizzle", "Thunderstorm"}


def alert_condition_met(alert: WeatherAlert, weather: dict) -> bool:
    """Pure rule check: does this OpenWeatherMap payload satisfy the alert?"""
    if alert.condition == WeatherAlert.Condition.RAIN:
        return any(w["main"] in RAIN_GROUPS for w in weather.get("weather", []))

    temp = weather["main"]["temp"]
    if alert.condition == WeatherAlert.Condition.TEMP_BELOW:
        return temp < alert.threshold
    if alert.condition == WeatherAlert.Condition.TEMP_ABOVE:
        return temp > alert.threshold
    return False


@shared_task
def check_weather_alerts() -> dict:
    """Evaluate every active alert against current weather (scheduled every 30 min)."""
    now = timezone.now()
    alerts = WeatherAlert.objects.filter(is_active=True).select_related("city")

    # One API call per city, however many alerts point at it.
    alerts_by_city = defaultdict(list)
    for alert in alerts:
        alerts_by_city[alert.city].append(alert)

    triggered = []
    failed_cities = 0
    for city, city_alerts in alerts_by_city.items():
        try:
            weather = services.get_current_weather(city.lat, city.lon)
        except services.WeatherServiceError:
            # Don't let one failing city block everyone else's alerts.
            logger.exception("Could not fetch weather for %s", city)
            failed_cities += 1
            continue

        for alert in city_alerts:
            in_cooldown = alert.last_triggered and now - alert.last_triggered < ALERT_COOLDOWN
            if not in_cooldown and alert_condition_met(alert, weather):
                alert.last_triggered = now
                triggered.append(alert)
                logger.info("Alert %s triggered: %s", alert.pk, alert)

    WeatherAlert.objects.bulk_update(triggered, ["last_triggered"])

    summary = {
        "cities_checked": len(alerts_by_city) - failed_cities,
        "cities_failed": failed_cities,
        "alerts_triggered": len(triggered),
    }
    logger.info("check_weather_alerts finished: %s", summary)
    return summary
