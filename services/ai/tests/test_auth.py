import jwt
import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.auth import get_current_user_id
from app.config import Settings

from .conftest import JWT_SECRET, make_token


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _settings() -> Settings:
    return Settings(jwt_secret=JWT_SECRET)


def test_valid_token_returns_the_subject_claim():
    token = make_token(sub="user-42")
    assert get_current_user_id(_creds(token), _settings()) == "user-42"


def test_missing_credentials_raise_401():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(None, _settings())
    assert exc_info.value.status_code == 401


def test_wrong_signature_raises_401():
    token = jwt.encode({"sub": "user-1"}, "a-different-secret", algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(_creds(token), _settings())
    assert exc_info.value.status_code == 401


def test_token_without_subject_raises_401():
    token = jwt.encode({"role": "student"}, JWT_SECRET, algorithm="HS256")
    with pytest.raises(HTTPException) as exc_info:
        get_current_user_id(_creds(token), _settings())
    assert exc_info.value.status_code == 401
