from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from weather import services
from weather.models import City, WeatherAlert
from weather.tasks import ALERT_COOLDOWN, alert_condition_met, check_weather_alerts

GET_WEATHER = "weather.services.get_current_weather"


def weather(temp=20.0, group="Clear"):
    return {"main": {"temp": temp}, "weather": [{"main": group}]}


# --- alert_condition_met: pure function, no DB needed ----------------------

@pytest.mark.parametrize(
    ("condition", "threshold", "payload", "expected"),
    [
        ("rain", None, weather(group="Rain"), True),
        ("rain", None, weather(group="Drizzle"), True),
        ("rain", None, weather(group="Thunderstorm"), True),
        ("rain", None, weather(group="Clouds"), False),
        ("temp_below", 10, weather(temp=5), True),
        ("temp_below", 10, weather(temp=10), False),  # strictly below
        ("temp_above", 30, weather(temp=31), True),
        ("temp_above", 30, weather(temp=30), False),  # strictly above
    ],
)
def test_alert_condition_met(condition, threshold, payload, expected):
    # Unsaved instance: the rule only reads attributes.
    alert = WeatherAlert(condition=condition, threshold=threshold)
    assert alert_condition_met(alert, payload) is expected


# --- check_weather_alerts: the task itself ---------------------------------

@pytest.fixture
def make_alert(user, city):
    def _make(**kwargs):
        kwargs.setdefault("city", city)
        return WeatherAlert.objects.create(user=user, **kwargs)

    return _make


@pytest.mark.django_db
def test_task_triggers_matching_alerts_only(make_alert):
    hot = make_alert(condition="temp_above", threshold=20)
    cold = make_alert(condition="temp_below", threshold=0)
    inactive = make_alert(condition="temp_above", threshold=20, is_active=False)

    with patch(GET_WEATHER, return_value=weather(temp=25)):
        summary = check_weather_alerts()

    assert summary == {"cities_checked": 1, "cities_failed": 0, "alerts_triggered": 1}
    for alert in (hot, cold, inactive):
        alert.refresh_from_db()
    assert hot.last_triggered is not None
    assert cold.last_triggered is None
    assert inactive.last_triggered is None


@pytest.mark.django_db
def test_task_calls_the_api_once_per_city(make_alert):
    for threshold in (10, 20, 30):
        make_alert(condition="temp_above", threshold=threshold)

    with patch(GET_WEATHER, return_value=weather(temp=25)) as mock_weather:
        check_weather_alerts()

    assert mock_weather.call_count == 1


@pytest.mark.django_db
def test_task_respects_cooldown(make_alert):
    recent = make_alert(condition="rain", last_triggered=timezone.now() - timedelta(hours=1))
    old = make_alert(condition="rain", last_triggered=timezone.now() - ALERT_COOLDOWN - timedelta(minutes=1))

    with patch(GET_WEATHER, return_value=weather(group="Rain")):
        summary = check_weather_alerts()

    assert summary["alerts_triggered"] == 1
    recent_before = recent.last_triggered
    recent.refresh_from_db()
    old.refresh_from_db()
    assert recent.last_triggered == recent_before
    assert timezone.now() - old.last_triggered < timedelta(minutes=1)


@pytest.mark.django_db
def test_one_failing_city_does_not_block_the_others(make_alert):
    broken = City.objects.create(name="Broken", country="XX", lat=0, lon=0)
    make_alert(condition="rain", city=broken)
    ok_alert = make_alert(condition="rain")

    def fake_weather(lat, lon):
        if (lat, lon) == (0, 0):
            raise services.ExternalAPIError("down")
        return weather(group="Rain")

    with patch(GET_WEATHER, side_effect=fake_weather):
        summary = check_weather_alerts()

    assert summary == {"cities_checked": 1, "cities_failed": 1, "alerts_triggered": 1}
    ok_alert.refresh_from_db()
    assert ok_alert.last_triggered is not None
