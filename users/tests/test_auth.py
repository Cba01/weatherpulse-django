import pytest

from users.models import User

pytestmark = pytest.mark.django_db

PASSWORD = "Nubes-Lima-2026"


def login(client, username="ana", password=PASSWORD):
    return client.post("/api/auth/token/", {"username": username, "password": password}, format="json")


def test_register_hashes_password_and_never_returns_it(api_client):
    response = api_client.post(
        "/api/auth/register/",
        {"username": "carla", "email": "carla@example.com", "password": PASSWORD},
        format="json",
    )

    assert response.status_code == 201
    assert "password" not in response.json()
    user = User.objects.get(username="carla")
    assert user.password != PASSWORD
    assert user.check_password(PASSWORD)


def test_register_enforces_password_validators(api_client):
    response = api_client.post(
        "/api/auth/register/", {"username": "carla", "password": "1234"}, format="json"
    )

    assert response.status_code == 400
    assert "password" in response.json()
    assert not User.objects.exists()


def test_register_ignores_a_stale_authorization_header(api_client):
    api_client.credentials(HTTP_AUTHORIZATION="Bearer not-a-real-token")
    response = api_client.post(
        "/api/auth/register/", {"username": "carla", "password": PASSWORD}, format="json"
    )
    assert response.status_code == 201


def test_login_and_me_with_real_jwt(api_client, user):
    tokens = login(api_client).json()

    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
    response = api_client.get("/api/auth/me/")

    assert response.status_code == 200
    assert response.json() == {"id": user.id, "username": "ana", "email": ""}


def test_login_with_wrong_password_fails(api_client, user):
    assert login(api_client, password="wrong").status_code == 401


def test_rotated_refresh_token_cannot_be_reused(api_client, user):
    old_refresh = login(api_client).json()["refresh"]

    first = api_client.post("/api/auth/token/refresh/", {"refresh": old_refresh}, format="json")
    reused = api_client.post("/api/auth/token/refresh/", {"refresh": old_refresh}, format="json")

    assert first.status_code == 200
    assert reused.status_code == 401


def test_logout_blacklists_refresh_token(api_client, user):
    refresh = login(api_client).json()["refresh"]

    assert api_client.post("/api/auth/logout/", {"refresh": refresh}, format="json").status_code == 200
    after = api_client.post("/api/auth/token/refresh/", {"refresh": refresh}, format="json")
    assert after.status_code == 401
