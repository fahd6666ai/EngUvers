from fastapi.testclient import TestClient


def test_health_is_public_and_ok(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "healthy"}
