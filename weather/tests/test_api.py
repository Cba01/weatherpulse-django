from unittest.mock import patch

import pytest

from weather import services
from weather.models import City, FavoriteCity, WeatherAlert

GET_WEATHER = "weather.services.get_current_weather"
GEOCODE = "weather.services.geocode_city"

pytestmark = pytest.mark.django_db


# --- GET /api/weather/current/ ---------------------------------------------

def test_current_weather_passes_payload_through(api_client, weather_payload):
    with patch(GET_WEATHER, return_value=weather_payload) as mock_weather:
        response = api_client.get("/api/weather/current/", {"lat": -12.06, "lon": -77.03})

    assert response.status_code == 200
    assert response.json() == weather_payload
    mock_weather.assert_called_once_with(lat=-12.06, lon=-77.03)


@pytest.mark.parametrize(
    "params",
    [{}, {"lat": "abc", "lon": 0}, {"lat": 91, "lon": 0}, {"lat": 0, "lon": -181}],
)
def test_current_weather_rejects_bad_coordinates(api_client, params):
    with patch(GET_WEATHER) as mock_weather:
        response = api_client.get("/api/weather/current/", params)

    assert response.status_code == 400
    mock_weather.assert_not_called()


@pytest.mark.parametrize(
    ("error", "status_code"),
    [(services.ExternalAPIError("down"), 503), (services.CityNotFoundError("nope"), 404)],
)
def test_service_errors_go_through_the_exception_handler(api_client, error, status_code):
    with patch(GET_WEATHER, side_effect=error):
        response = api_client.get("/api/weather/current/", {"lat": 0, "lon": 0})

    assert response.status_code == status_code
    assert "detail" in response.json()


def test_provider_error_details_are_not_sent_to_the_client(api_client):
    # A requests error's text can include the URL, and with it our appid.
    leaky = services.ExternalAPIError("Could not reach https://api.example/?appid=SECRET")
    with patch(GET_WEATHER, side_effect=leaky):
        response = api_client.get("/api/weather/current/", {"lat": 0, "lon": 0})

    assert response.status_code == 503
    assert "SECRET" not in response.content.decode()


# --- GET /api/cities/search/ -----------------------------------------------

def test_search_stores_cities_and_is_idempotent(api_client):
    matches = [
        {"name": "Lima", "country": "PE", "lat": -12.06, "lon": -77.03},
        {"name": "Lima", "country": "US", "lat": 40.74, "lon": -84.11},
        {"name": "Lima", "country": "PE", "lat": -12.05, "lon": -77.04},  # same (name, country)
    ]
    with patch(GEOCODE, return_value=matches):
        first = api_client.get("/api/cities/search/", {"q": "Lima"})
        second = api_client.get("/api/cities/search/", {"q": "Lima"})

    assert first.status_code == 200
    assert [c["country"] for c in first.json()] == ["PE", "US"]
    assert [c["id"] for c in first.json()] == [c["id"] for c in second.json()]
    assert City.objects.count() == 2


def test_search_requires_a_meaningful_query(api_client):
    assert api_client.get("/api/cities/search/", {"q": "L"}).status_code == 400


# --- /api/favorites/ -------------------------------------------------------

def test_favorites_require_authentication(api_client):
    assert api_client.get("/api/favorites/").status_code == 401


def test_create_favorite_sets_owner_from_request(auth_client, user, city):
    response = auth_client.post("/api/favorites/", {"city_id": city.id}, format="json")

    assert response.status_code == 201
    assert response.json()["city"]["name"] == "Lima"
    assert FavoriteCity.objects.get().user == user


def test_duplicate_favorite_is_a_400_not_a_500(auth_client, city):
    auth_client.post("/api/favorites/", {"city_id": city.id}, format="json")
    response = auth_client.post("/api/favorites/", {"city_id": city.id}, format="json")

    assert response.status_code == 400
    assert "city_id" in response.json()


def test_favorites_cannot_be_updated(auth_client, user, city):
    favorite = FavoriteCity.objects.create(user=user, city=city)
    assert auth_client.patch(f"/api/favorites/{favorite.id}/", {}, format="json").status_code == 405


def test_users_only_see_their_own_favorites(auth_client, other_user, city):
    theirs = FavoriteCity.objects.create(user=other_user, city=city)

    assert auth_client.get("/api/favorites/").json()["count"] == 0
    assert auth_client.get(f"/api/favorites/{theirs.id}/").status_code == 404
    assert auth_client.delete(f"/api/favorites/{theirs.id}/").status_code == 404
    assert FavoriteCity.objects.filter(pk=theirs.pk).exists()


def test_favorites_list_has_no_n_plus_one(auth_client, user, django_assert_num_queries):
    for i in range(5):
        city = City.objects.create(name=f"City {i}", country="PE", lat=i, lon=i)
        FavoriteCity.objects.create(user=user, city=city)

    # 1 COUNT for pagination + 1 SELECT ... JOIN city, however many favorites.
    with django_assert_num_queries(2):
        response = auth_client.get("/api/favorites/")
    assert response.json()["count"] == 5


# --- /api/alerts/ ----------------------------------------------------------

def test_temperature_alert_requires_threshold(auth_client, city):
    response = auth_client.post(
        "/api/alerts/", {"city_id": city.id, "condition": "temp_above"}, format="json"
    )
    assert response.status_code == 400
    assert "threshold" in response.json()


def test_partial_update_cannot_clear_required_threshold(auth_client, user, city):
    alert = WeatherAlert.objects.create(user=user, city=city, condition="temp_below", threshold=5)

    response = auth_client.patch(f"/api/alerts/{alert.id}/", {"threshold": None}, format="json")

    assert response.status_code == 400


def test_partial_update_of_is_active_keeps_existing_threshold(auth_client, user, city):
    # What the frontend's on/off switch sends: validate() must fall back to
    # the stored threshold instead of complaining that it's missing.
    alert = WeatherAlert.objects.create(user=user, city=city, condition="temp_above", threshold=30)

    response = auth_client.patch(f"/api/alerts/{alert.id}/", {"is_active": False}, format="json")

    assert response.status_code == 200
    alert.refresh_from_db()
    assert alert.is_active is False
    assert alert.threshold == 30


def test_last_triggered_is_read_only(auth_client, user, city):
    alert = WeatherAlert.objects.create(user=user, city=city, condition="rain")

    response = auth_client.patch(
        f"/api/alerts/{alert.id}/", {"last_triggered": "2026-01-01T00:00:00Z"}, format="json"
    )

    assert response.status_code == 200
    alert.refresh_from_db()
    assert alert.last_triggered is None
