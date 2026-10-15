from unittest.mock import patch

import pytest
import requests

from weather import services

from .utils import fake_response

# Patch where the name is looked up: services.py does `import requests`
# and calls `requests.get`, so we replace weather.services.requests.get.
REQUESTS_GET = "weather.services.requests.get"


def test_geocode_city_returns_only_the_fields_we_use():
    payload = [{"name": "Lima", "country": "PE", "lat": -12.06, "lon": -77.03, "state": "Lima", "local_names": {}}]

    with patch(REQUESTS_GET, return_value=fake_response(200, payload)) as mock_get:
        result = services.geocode_city("Lima", limit=3)

    assert result == [{"name": "Lima", "country": "PE", "lat": -12.06, "lon": -77.03}]
    # The API key and query params reach OpenWeatherMap.
    params = mock_get.call_args.kwargs["params"]
    assert params == {"q": "Lima", "limit": 3, "appid": "test-key"}


def test_geocode_city_with_no_matches_raises_city_not_found():
    with patch(REQUESTS_GET, return_value=fake_response(200, [])):
        with pytest.raises(services.CityNotFoundError):
            services.geocode_city("Xyzqwvbn")


@pytest.mark.parametrize(
    ("status_code", "expected"),
    [
        (404, services.CityNotFoundError),
        (401, services.ExternalAPIError),
        (429, services.ExternalAPIError),
        (500, services.ExternalAPIError),
    ],
)
def test_http_errors_map_to_service_exceptions(status_code, expected):
    with patch(REQUESTS_GET, return_value=fake_response(status_code)):
        with pytest.raises(expected):
            services.get_current_weather(-12.06, -77.03)


def test_network_failure_becomes_external_api_error():
    with patch(REQUESTS_GET, side_effect=requests.exceptions.Timeout("too slow")):
        with pytest.raises(services.ExternalAPIError):
            services.get_current_weather(-12.06, -77.03)


def test_current_weather_is_cached_for_nearby_coordinates(weather_payload):
    with patch(REQUESTS_GET, return_value=fake_response(200, weather_payload)) as mock_get:
        first = services.get_current_weather(-12.06211, -77.03612)
        # Same coordinates once rounded to 3 decimals -> same cache key.
        second = services.get_current_weather(-12.06209, -77.03588)

    assert first == second == weather_payload
    assert mock_get.call_count == 1


def test_coordinates_across_a_rounding_boundary_use_different_cache_keys(weather_payload):
    # -77.03652 -> -77.037 but -77.03648 -> -77.036: ~4 m apart, still two
    # cache entries. Known limitation of rounding to a fixed grid.
    with patch(REQUESTS_GET, return_value=fake_response(200, weather_payload)) as mock_get:
        services.get_current_weather(-12.062, -77.03652)
        services.get_current_weather(-12.062, -77.03648)

    assert mock_get.call_count == 2


def test_failed_requests_are_not_cached(weather_payload):
    with patch(REQUESTS_GET, side_effect=[fake_response(503), fake_response(200, weather_payload)]):
        with pytest.raises(services.ExternalAPIError):
            services.get_current_weather(-12.06, -77.03)
        assert services.get_current_weather(-12.06, -77.03) == weather_payload
