import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .config import Settings, get_settings

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> str:
    """Decodes the same HS256 JWT apps/api issues — see
    services/simulator/bridge-overlay/backend/pro/__init__.py's
    _get_current_user_id for the other service that does the same thing
    against the same secret.
    """
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")
    return user_id
