# Load the Celery app whenever Django starts, so @shared_task functions
# bind to it (and .delay() from views uses our Redis broker).
from .celery import app as celery_app

__all__ = ("celery_app",)
