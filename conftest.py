"""Fixtures shared by every test in the project (pytest finds this file by name)."""

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

from users.models import User
from weather.models import City


@pytest.fixture(autouse=True)
def isolated_settings(settings):
    """Applied to every test: in-memory cache (no shared state through Redis)
    and a fake API key so nothing could ever authenticate against the real API."""
    settings.CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
    settings.OPENWEATHER_API_KEY = "test-key"
    cache.clear()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(username="ana", password="Nubes-Lima-2026")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(username="bob", password="Nubes-Lima-2026")


@pytest.fixture
def auth_client(user):
    """Client logged in as `user`. force_authenticate skips JWT on purpose:
    the token flow itself is covered in users/tests/test_auth.py."""
    client = APIClient()
    client.force_authenticate(user)
    return client


@pytest.fixture
def city(db):
    return City.objects.create(name="Lima", country="PE", lat=-12.0621, lon=-77.0365)


@pytest.fixture
def weather_payload():
    """Minimal OpenWeatherMap /data/2.5/weather response."""
    return {
        "name": "Lima",
        "main": {"temp": 25.0},
        "weather": [{"main": "Clouds", "description": "overcast clouds"}],
        "sys": {"sunrise": 1760000000, "sunset": 1760040000},
    }
