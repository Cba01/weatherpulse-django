from django.urls import path
from rest_framework_simplejwt.views import (
    TokenBlacklistView,
    TokenObtainPairView,
    TokenRefreshView,
)

from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="auth-register"),
    # Login: {username, password} -> {access, refresh}
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    # {refresh} -> {access, refresh} (refresh rotates, see SIMPLE_JWT)
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    # Logout: {refresh} -> blacklists that refresh token
    path("logout/", TokenBlacklistView.as_view(), name="auth-logout"),
    path("me/", views.MeView.as_view(), name="auth-me"),
]
