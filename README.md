# WeatherPulse

Aplicación fullstack del clima cuyo tema visual cambia según el clima actual.
Busca ciudades o elige un punto en el mapa, guarda favoritos y compáralos
lado a lado, y crea alertas (lluvia, temperatura por encima o por debajo de
un umbral) que una tarea programada revisa cada 30 minutos.

**Stack:** Django 6 + Django REST Framework, PostgreSQL, Redis (caché y
broker de Celery), Celery + Celery Beat, autenticación JWT (simplejwt con
blacklist de tokens) · React 19 + TypeScript + Vite, Motion, Leaflet · API de
OpenWeatherMap.

## Requisitos

- Python 3.12+
- Node.js 20+
- Docker Desktop (ejecuta PostgreSQL y Redis)
- Una API key gratuita de [OpenWeatherMap](https://openweathermap.org/api)

## Configuración (primera vez)

```bash
# 1. Servicios: PostgreSQL en 5432, Redis en 6379
docker compose up -d

# 2. Backend
python -m venv venv
venv\Scripts\activate            # Windows (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env             # luego edita SECRET_KEY y OPENWEATHER_API_KEY
python manage.py migrate
python manage.py createsuperuser # opcional, para /admin/

# 3. Frontend
cd frontend
npm install
```

Para generar una `SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

## Ejecución en local

Cada proceso corre en su propia terminal (con el venv activado para los de
Python). Docker debe estar corriendo antes: `docker compose up -d`.

| Proceso | Comando | Necesario para |
| --- | --- | --- |
| API | `python manage.py runserver` | todo (http://localhost:8000) |
| Frontend | `cd frontend && npm run dev` | la interfaz (http://localhost:5173) |
| Worker de Celery | `celery -A config worker -l info --pool=solo` | ejecutar la revisión de alertas |
| Celery Beat | `celery -A config beat -l info` | programar la revisión de alertas cada 30 min |

El worker y beat solo hacen falta para que se evalúen las alertas; el resto
de la aplicación funciona sin ellos. `--pool=solo` es obligatorio en Windows,
donde el pool de procesos por defecto de Celery no está soportado.

La programación de beat se guarda en la base de datos (`django_celery_beat`).
La entrada por defecto de `CELERY_BEAT_SCHEDULE` se copia ahí al iniciar beat
y después se puede editar desde el admin de Django.

## Tests

```bash
python -m pytest        # backend; necesita PostgreSQL activo para la base de datos de prueba
cd frontend && npm run lint && npm run build
```

Los tests del backend simulan la API de OpenWeatherMap y usan una caché en
memoria, así que no necesitan Redis ni una API key real.

## Resumen de la API

Todos los endpoints están bajo `/api/`. Los que requieren autenticación
esperan `Authorization: Bearer <access token>`.

| Método | Endpoint | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `auth/register/` | – | Crear una cuenta |
| POST | `auth/token/` | – | Iniciar sesión: devuelve access + refresh token |
| POST | `auth/token/refresh/` | – | Rotar el refresh token |
| POST | `auth/logout/` | – | Invalidar un refresh token (blacklist) |
| GET | `auth/me/` | ✓ | Usuario actual |
| GET | `cities/search/?q=&limit=` | – | Geocodificar y guardar las ciudades encontradas |
| GET | `weather/current/?lat=&lon=` | – | Clima actual (en caché 10 min por ubicación) |
| GET/POST | `favorites/` | ✓ | Listar / agregar ciudades favoritas |
| GET/DELETE | `favorites/<id>/` | ✓ | Ver / quitar un favorito |
| GET/POST | `alerts/` | ✓ | Listar / crear alertas del clima |
| GET/PUT/PATCH/DELETE | `alerts/<id>/` | ✓ | Gestionar una alerta |

## Estructura del proyecto

```
config/      settings, URLs raíz, app de Celery
users/       modelo User propio, registro, endpoints de autenticación JWT
weather/     modelos, capa de servicios de OpenWeatherMap, vistas de la API, tareas de Celery, tests
frontend/    cliente React (ver frontend/README.md)
```
