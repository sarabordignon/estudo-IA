from fastapi.testclient import TestClient

from main import app


def test_health():
    resposta = TestClient(app).get("/health")
    assert resposta.status_code == 200
    assert resposta.json()["status"] == "ok"


def test_health_database():
    resposta = TestClient(app).get("/health/database")
    assert resposta.status_code in (200, 503)
