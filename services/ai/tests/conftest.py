import jwt
import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.dependencies import get_llm_provider
from app.main import app

JWT_SECRET = "test-secret"


@pytest.fixture(autouse=True)
def _test_env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET", JWT_SECRET)
    get_settings.cache_clear()
    get_llm_provider.cache_clear()
    yield
    app.dependency_overrides.clear()
    get_settings.cache_clear()
    get_llm_provider.cache_clear()


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


def make_token(sub: str = "user-1", **extra_claims: object) -> str:
    return jwt.encode({"sub": sub, **extra_claims}, JWT_SECRET, algorithm="HS256")
