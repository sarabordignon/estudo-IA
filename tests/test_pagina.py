from fastapi.testclient import TestClient

from main import app


def test_pagina_e_arquivos_estaticos():
    client = TestClient(app)
    r = client.get("/")
    assert r.status_code == 200 and "Meu Dia" in r.text
    for caminho in ("/static/css/style.css", "/static/js/main.js"):
        assert client.get(caminho).status_code == 200, caminho
