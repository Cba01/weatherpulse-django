"""Service layer for talking to the OpenWeatherMap API.

Views and Celery tasks call into these functions instead of using
`requests` directly, so the HTTP-fetch / cache / error-handling logic
lives in exactly one place.
"""

import requests
from django.conf import settings
from django.core.cache import cache

CURRENT_WEATHER_CACHE_TTL_SECONDS = 60 * 10  # matches the "10 minutes" requirement
REQUEST_TIMEOUT_SECONDS = 5


class WeatherServiceError(Exception):
    """Base class for anything that can go wrong in this module."""


class CityNotFoundError(WeatherServiceError):
    """The requested city doesn't exist as far as OpenWeatherMap is concerned."""


class ExternalAPIError(WeatherServiceError):
    """OpenWeatherMap is unreachable, timed out, or returned an unexpected error."""


def _get(path: str, params: dict) -> dict:
    """Low-level GET against the OpenWeatherMap API with the API key attached."""
    request_params = {**params, "appid": settings.OPENWEATHER_API_KEY}

    try:
        response = requests.get(
            f"{settings.OPENWEATHER_BASE_URL}{path}",
            params=request_params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.exceptions.RequestException as exc:
        raise ExternalAPIError(f"Could not reach OpenWeatherMap: {exc}") from exc

    if response.status_code == 404:
        raise CityNotFoundError("City not found")
    if response.status_code == 401:
        raise ExternalAPIError("OpenWeatherMap rejected the API key")
    if response.status_code == 429:
        raise ExternalAPIError("OpenWeatherMap rate limit exceeded")
    if not response.ok:
        raise ExternalAPIError(f"OpenWeatherMap returned status {response.status_code}")

    return response.json()


def geocode_city(query: str, limit: int = 5) -> list[dict]:
    """Resolve a free-text city name into candidate (name, country, lat, lon) matches."""
    results = _get("/geo/1.0/direct", {"q": query, "limit": limit})

    if not results:
        raise CityNotFoundError(f"No city found matching '{query}'")

    return [
        {
            "name": item["name"],
            "country": item["country"],
            "lat": item["lat"],
            "lon": item["lon"],
        }
        for item in results
    ]


def get_current_weather(lat: float, lon: float) -> dict:
    """Current weather for a coordinate pair, cached in Redis for 10 minutes."""
    # Round coordinates so that near-identical floats (e.g. from repeated
    # geocoding of the same city) reuse the same cache key.
    cache_key = f"weather:current:{round(lat, 3)}:{round(lon, 3)}"

    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    # lang=es: descriptions ("nubes", "lluvia ligera") match the Spanish UI.
    data = _get(
        "/data/2.5/weather", {"lat": lat, "lon": lon, "units": "metric", "lang": "es"}
    )
    cache.set(cache_key, data, CURRENT_WEATHER_CACHE_TTL_SECONDS)
    return data
