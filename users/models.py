from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model. Identical to Django's default User for now —
    exists so we can extend it later without a painful migration."""

    pass
