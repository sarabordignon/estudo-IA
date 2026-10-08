def test_resumo(client):
    def criar(data, concluir=False, prio="media", dur=30):
        r = client.post("/api/atividades", json={"titulo": "t", "data": data,
                                                  "duracao_min": dur, "prioridade": prio})
        if concluir:
            client.patch(f"/api/atividades/{r.json()['id']}/concluir")

    criar("2026-10-06", True, "alta", 60)
    criar("2026-10-06", True, "baixa", 30)
    criar("2026-10-07", False, "alta", 45)

    r = client.get("/api/resumo", params={"inicio": "2026-10-05", "fim": "2026-10-08"})
    assert r.status_code == 200
    d = r.json()
    assert (d["total"], d["concluidas"], d["pendentes"]) == (3, 2, 1)
    assert d["taxa_conclusao"] == 67
    assert d["minutos_planejados"] == 135 and d["minutos_concluidos"] == 90
    assert d["dias_perfeitos"] == 1
    assert len(d["por_dia"]) == 4
    assert d["por_prioridade"]["alta"] == {"total": 2, "concluidas": 1}


def test_resumo_periodo_invalido(client):
    assert client.get("/api/resumo", params={"inicio": "2026-10-08", "fim": "2026-10-01"}).status_code == 422
    assert client.get("/api/resumo", params={"inicio": "2020-01-01", "fim": "2026-10-01"}).status_code == 422
