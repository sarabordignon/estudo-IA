from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.atividade import Atividade
from app.schemas.resumo import DiaResumo, PrioridadeResumo, Resumo


def calcular_resumo(db: Session, inicio: date, fim: date) -> Resumo:
    itens = db.scalars(
        select(Atividade).where(Atividade.data >= inicio, Atividade.data <= fim)
    ).all()

    dias: dict[date, DiaResumo] = {}
    dia = inicio
    while dia <= fim:
        dias[dia] = DiaResumo(data=dia, total=0, concluidas=0, minutos=0, minutos_concluidos=0)
        dia += timedelta(days=1)

    prioridades = {p: PrioridadeResumo(total=0, concluidas=0) for p in ("alta", "media", "baixa")}

    for a in itens:
        d = dias[a.data]
        d.total += 1
        d.minutos += a.duracao_min
        p = prioridades.setdefault(a.prioridade, PrioridadeResumo(total=0, concluidas=0))
        p.total += 1
        if a.concluida:
            d.concluidas += 1
            d.minutos_concluidos += a.duracao_min
            p.concluidas += 1

    total = len(itens)
    concluidas = sum(1 for a in itens if a.concluida)
    return Resumo(
        inicio=inicio,
        fim=fim,
        total=total,
        concluidas=concluidas,
        pendentes=total - concluidas,
        minutos_planejados=sum(d.minutos for d in dias.values()),
        minutos_concluidos=sum(d.minutos_concluidos for d in dias.values()),
        taxa_conclusao=round(concluidas / total * 100) if total else 0,
        dias_perfeitos=sum(1 for d in dias.values() if d.total and d.total == d.concluidas),
        por_prioridade=prioridades,
        por_dia=list(dias.values()),
    )
