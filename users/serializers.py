from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    # write_only: accepted on input, never rendered back in the response.
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["id", "username", "email", "password"]
        read_only_fields = ["id"]

    def validate(self, attrs):
        # Run settings.AUTH_PASSWORD_VALIDATORS. Pass an unsaved User so the
        # similarity validator can compare the password to username/email.
        candidate = User(username=attrs.get("username"), email=attrs.get("email", ""))
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as exc:
            # Django's ValidationError isn't DRF's; re-raise as a 400 on `password`.
            raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        return attrs

    def create(self, validated_data):
        # create_user() hashes the password via set_password(). The default
        # ModelSerializer.create() would store it as plain text.
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    """Public view of the logged-in user (GET /api/auth/me/)."""

    class Meta:
        model = User
        fields = ["id", "username", "email"]
