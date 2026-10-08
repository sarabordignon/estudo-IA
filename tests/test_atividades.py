D = "2026-10-08"


def _nova(client, **extra):
    corpo = {"titulo": "Estudar Python", "data": D, "horario": "09:00",
             "duracao_min": 90, "prioridade": "alta", **extra}
    return client.post("/api/atividades", json=corpo)


def test_fluxo_completo(client):
    r = _nova(client)
    assert r.status_code == 201
    id_ = r.json()["id"]
    assert r.json()["concluida"] is False

    client.post("/api/atividades", json={"titulo": "Sem horário", "data": D})
    lista = client.get("/api/atividades", params={"data": D}).json()
    assert [a["titulo"] for a in lista] == ["Estudar Python", "Sem horário"]

    assert client.patch(f"/api/atividades/{id_}/concluir").json()["concluida"] is True
    assert client.patch(f"/api/atividades/{id_}/concluir").json()["concluida"] is False

    corpo = {"titulo": "Estudar FastAPI", "data": D, "duracao_min": 60, "prioridade": "baixa"}
    r = client.put(f"/api/atividades/{id_}", json=corpo)
    assert r.json()["titulo"] == "Estudar FastAPI"
    assert r.json()["horario"] is None

    assert client.delete(f"/api/atividades/{id_}").status_code == 204
    assert client.delete(f"/api/atividades/{id_}").status_code == 404


def test_validacao(client):
    assert client.post("/api/atividades", json={"titulo": "   ", "data": D}).status_code == 422
    assert _nova(client, duracao_min=0).status_code == 422
    assert _nova(client, prioridade="urgente").status_code == 422
    assert client.put("/api/atividades/999", json={"titulo": "x", "data": D}).status_code == 404


def test_filtros_e_periodo(client):
    _nova(client, titulo="Ler livro", prioridade="baixa", horario=None)
    _nova(client, titulo="Treinar", data="2026-10-10")
    r = _nova(client, titulo="Reunião 100%", data="2026-10-12")
    client.patch(f"/api/atividades/{r.json()['id']}/concluir")

    def buscar(**p):
        return [a["titulo"] for a in client.get("/api/atividades", params=p).json()]

    assert len(buscar()) == 3
    assert buscar(inicio="2026-10-09", fim="2026-10-11") == ["Treinar"]
    assert buscar(busca="LIVRO") == ["Ler livro"]
    assert buscar(busca="100%") == ["Reunião 100%"]
    assert buscar(status="concluida") == ["Reunião 100%"]
    assert buscar(prioridade="baixa") == ["Ler livro"]
    assert client.get("/api/atividades", params={"inicio": D, "fim": "2026-10-01"}).status_code == 422


def test_mover(client):
    id_ = _nova(client).json()["id"]
    r = client.patch(f"/api/atividades/{id_}/mover", json={"data": "2026-10-09"})
    assert r.status_code == 200 and r.json()["data"] == "2026-10-09"
    assert client.patch("/api/atividades/999/mover", json={"data": D}).status_code == 404
