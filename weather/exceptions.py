"""Project-wide DRF exception handler.

Registered in settings.REST_FRAMEWORK["EXCEPTION_HANDLER"]. DRF calls it
whenever a view raises, so service-layer errors become clean HTTP
responses in one place instead of a try/except in every view.
"""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler

from .services import CityNotFoundError, ExternalAPIError

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    # Let DRF handle its own exceptions first (ValidationError -> 400,
    # NotAuthenticated -> 401, NotFound -> 404, ...).
    response = exception_handler(exc, context)
    if response is not None:
        return response

    if isinstance(exc, CityNotFoundError):
        return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
    if isinstance(exc, ExternalAPIError):
        # The message is for us, not the client: a network error's text can
        # include the request URL, and that URL carries our API key (appid=).
        logger.warning("Weather provider error: %s", exc)
        return Response(
            {"detail": "El servicio del clima no está disponible. Intenta de nuevo más tarde."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Anything else is a real bug: returning None lets Django raise it
    # (traceback in DEBUG, generic 500 in production).
    return None
