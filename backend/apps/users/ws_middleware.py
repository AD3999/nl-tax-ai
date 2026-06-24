from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class JwtAuthMiddleware:
    """
    Authenticates WebSocket connections using a JWT token
    passed as ?token=<access_token> in the query string.
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        scope["user"] = await self._get_user(scope)
        return await self.inner(scope, receive, send)

    @database_sync_to_async
    def _get_user(self, scope):
        try:
            from rest_framework_simplejwt.tokens import AccessToken
            from apps.users.models import User
            qs     = parse_qs(scope.get("query_string", b"").decode())
            tokens = qs.get("token", [])
            if not tokens:
                return AnonymousUser()
            token  = AccessToken(tokens[0])
            return User.objects.get(id=token["user_id"])
        except Exception:
            return AnonymousUser()
