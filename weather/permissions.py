from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Object-level check: only the user who owns an object may access it.

    The viewsets already filter get_queryset() by request.user, so this is
    defense in depth in case that filtering ever changes.
    """

    message = "You do not own this object."

    def has_object_permission(self, request, view, obj):
        # Compare ids: `obj.user` would trigger an extra query to load the user.
        return obj.user_id == request.user.id
