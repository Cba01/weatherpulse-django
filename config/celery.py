"""Celery application for the project.

Run (from the project root, venv active, Redis up):
    celery -A config worker --pool=solo -l info   # executes tasks (--pool=solo on Windows)
    celery -A config beat -l info                 # enqueues scheduled tasks; run only ONE
"""

import os

from celery import Celery

# Worker/beat processes don't go through manage.py, so tell Django which
# settings to load before anything imports models.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("config")

# Read every CELERY_* setting from settings.py (CELERY_BROKER_URL -> broker_url, ...).
app.config_from_object("django.conf:settings", namespace="CELERY")

# Import tasks.py from every installed app.
app.autodiscover_tasks()
