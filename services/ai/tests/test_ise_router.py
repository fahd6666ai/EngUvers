from fastapi.testclient import TestClient

from app.dependencies import get_llm_provider
from app.llm.provider import LLMProvider
from app.llm.unavailable_provider import UnavailableLLMProvider
from app.main import app

from .conftest import make_token


class _FakeProvider(LLMProvider):
    async def complete(self, *, system: str, prompt: str) -> str:
        return f"fake summary (prompt length {len(prompt)})"


def test_explain_requires_a_bearer_token(client: TestClient):
    resp = client.post("/ise/explain", json={"vlxContent": {}})
    assert resp.status_code == 401


def test_explain_returns_a_summary_when_a_provider_is_configured(client: TestClient):
    app.dependency_overrides[get_llm_provider] = lambda: _FakeProvider()

    resp = client.post(
        "/ise/explain",
        json={"vlxContent": {"board": "uno", "sketch": "void setup() {}"}},
        headers={"Authorization": f"Bearer {make_token()}"},
    )

    assert resp.status_code == 200
    assert "fake summary" in resp.json()["summary"]


def test_explain_returns_503_when_no_provider_is_configured(client: TestClient):
    app.dependency_overrides[get_llm_provider] = lambda: UnavailableLLMProvider()

    resp = client.post(
        "/ise/explain",
        json={"vlxContent": {}},
        headers={"Authorization": f"Bearer {make_token()}"},
    )

    assert resp.status_code == 503
    assert "ANTHROPIC_API_KEY" in resp.json()["detail"]
