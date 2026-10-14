from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import RegisterSerializer, UserSerializer


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create an account. Log in afterwards via /api/auth/token/."""

    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    # Public endpoint: don't let a stale Authorization header turn signup into a 401.
    authentication_classes = []


class MeView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — the currently authenticated user."""

    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
