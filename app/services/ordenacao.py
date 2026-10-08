from datetime import time

from app.models.atividade import Atividade

ORDEM_PRIORIDADE = {"alta": 0, "media": 1, "baixa": 2}


def chave_ordenacao(a: Atividade):
    """Data, depois quem tem horário (cedo primeiro), depois prioridade."""
    return (
        a.data,
        a.horario is None,
        a.horario or time.min,
        ORDEM_PRIORIDADE.get(a.prioridade, 9),
        a.id,
    )
