from datetime import date

from pydantic import BaseModel


class DiaResumo(BaseModel):
    data: date
    total: int
    concluidas: int
    minutos: int
    minutos_concluidos: int


class PrioridadeResumo(BaseModel):
    total: int
    concluidas: int


class Resumo(BaseModel):
    inicio: date
    fim: date
    total: int
    concluidas: int
    pendentes: int
    minutos_planejados: int
    minutos_concluidos: int
    taxa_conclusao: int
    dias_perfeitos: int
    por_prioridade: dict[str, PrioridadeResumo]
    por_dia: list[DiaResumo]
