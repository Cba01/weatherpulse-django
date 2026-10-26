# WeatherPulse

Fullstack weather app whose UI theme changes with the current weather.
Search cities or pick a point on the map, save favorites and compare them
side by side, and set alerts (rain, temperature above/below a threshold)
that a scheduled job checks every 30 minutes.

**Stack:** Django 6 + Django REST Framework, PostgreSQL, Redis (cache and
Celery broker), Celery + Celery Beat, JWT auth (simplejwt with token
blacklist) · React 19 + TypeScript + Vite, Motion, Leaflet · OpenWeatherMap API.

## Requirements

- Python 3.12+
- Node.js 20+
- Docker Desktop (runs PostgreSQL and Redis)
- A free [OpenWeatherMap](https://openweathermap.org/api) API key

## Setup (first time)

```bash
# 1. Services: PostgreSQL on 5432, Redis on 6379
docker compose up -d

# 2. Backend
python -m venv venv
venv\Scripts\activate            # Windows (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env             # then edit SECRET_KEY and OPENWEATHER_API_KEY
python manage.py migrate
python manage.py createsuperuser # optional, for /admin/

# 3. Frontend
cd frontend
npm install
```

Generate a `SECRET_KEY` with:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Running locally

Each process runs in its own terminal (with the venv activated for the
Python ones). Docker must be running first: `docker compose up -d`.

| Process | Command | Needed for |
| --- | --- | --- |
| API | `python manage.py runserver` | everything (http://localhost:8000) |
| Frontend | `cd frontend && npm run dev` | the UI (http://localhost:5173) |
| Celery worker | `celery -A config worker -l info --pool=solo` | running alert checks |
| Celery beat | `celery -A config beat -l info` | scheduling alert checks every 30 min |

The worker and beat are only needed for alerts to be evaluated; the rest of
the app works without them. `--pool=solo` is required on Windows, where
Celery's default process pool is not supported.

The beat schedule is stored in the database (`django_celery_beat`). The
default entry in `CELERY_BEAT_SCHEDULE` is copied there when beat starts
and can then be edited from the Django admin.

## Tests

```bash
python -m pytest        # backend; needs PostgreSQL up for the test database
cd frontend && npm run lint && npm run build
```

Backend tests mock the OpenWeatherMap API and use an in-memory cache, so
they need neither Redis nor a real API key.

## API overview

All endpoints are under `/api/`. Authenticated ones expect
`Authorization: Bearer <access token>`.

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `auth/register/` | – | Create an account |
| POST | `auth/token/` | – | Log in: returns access + refresh tokens |
| POST | `auth/token/refresh/` | – | Rotate the refresh token |
| POST | `auth/logout/` | – | Blacklist a refresh token |
| GET | `auth/me/` | ✓ | Current user |
| GET | `cities/search/?q=&limit=` | – | Geocode and store matching cities |
| GET | `weather/current/?lat=&lon=` | – | Current weather (cached 10 min per location) |
| GET/POST | `favorites/` | ✓ | List / add favorite cities |
| GET/DELETE | `favorites/<id>/` | ✓ | Retrieve / remove a favorite |
| GET/POST | `alerts/` | ✓ | List / create weather alerts |
| GET/PUT/PATCH/DELETE | `alerts/<id>/` | ✓ | Manage one alert |

## Project layout

```
config/      settings, root URLs, Celery app
users/       custom User model, registration, JWT auth endpoints
weather/     models, OpenWeatherMap service layer, API views, Celery tasks, tests
frontend/    React client (see frontend/README.md)
```
