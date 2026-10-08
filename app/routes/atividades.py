from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.atividade import Atividade
from app.schemas.atividade import AtividadeIn, AtividadeOut, MoverIn, Prioridade
from app.services.ordenacao import chave_ordenacao

router = APIRouter(prefix="/api/atividades", tags=["Atividades"])


def _buscar(db: Session, atividade_id: int) -> Atividade:
    atividade = db.get(Atividade, atividade_id)
    if atividade is None:
        raise HTTPException(status_code=404, detail="Atividade não encontrada.")
    return atividade


@router.get("", response_model=list[AtividadeOut])
def listar(
    data: date | None = Query(None, description="Um dia específico"),
    inicio: date | None = Query(None, description="Início do período"),
    fim: date | None = Query(None, description="Fim do período"),
    busca: str | None = Query(None, max_length=100),
    status: Literal["pendente", "concluida"] | None = None,
    prioridade: Prioridade | None = None,
    limite: int = Query(500, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Lista atividades de um dia, de um período ou todas, com filtros opcionais."""
    if data:
        inicio = fim = data
    if inicio and fim and fim < inicio:
        raise HTTPException(status_code=422, detail="A data final não pode ser anterior à inicial.")

    consulta = select(Atividade)
    if inicio:
        consulta = consulta.where(Atividade.data >= inicio)
    if fim:
        consulta = consulta.where(Atividade.data <= fim)
    if busca and busca.strip():
        consulta = consulta.where(
            func.lower(Atividade.titulo).contains(busca.strip().lower(), autoescape=True)
        )
    if status:
        consulta = consulta.where(Atividade.concluida == (status == "concluida"))
    if prioridade:
        consulta = consulta.where(Atividade.prioridade == prioridade)

    itens = db.scalars(consulta.order_by(Atividade.data.desc()).limit(limite)).all()
    return sorted(itens, key=chave_ordenacao)


@router.post("", response_model=AtividadeOut, status_code=201)
def criar(dados: AtividadeIn, db: Session = Depends(get_db)):
    atividade = Atividade(**dados.model_dump())
    db.add(atividade)
    db.commit()
    db.refresh(atividade)
    return atividade


@router.put("/{atividade_id}", response_model=AtividadeOut)
def atualizar(atividade_id: int, dados: AtividadeIn, db: Session = Depends(get_db)):
    atividade = _buscar(db, atividade_id)
    for campo, valor in dados.model_dump().items():
        setattr(atividade, campo, valor)
    db.commit()
    db.refresh(atividade)
    return atividade


@router.patch("/{atividade_id}/concluir", response_model=AtividadeOut)
def alternar_conclusao(atividade_id: int, db: Session = Depends(get_db)):
    """Marca como concluída / volta para pendente."""
    atividade = _buscar(db, atividade_id)
    atividade.concluida = not atividade.concluida
    db.commit()
    db.refresh(atividade)
    return atividade


@router.patch("/{atividade_id}/mover", response_model=AtividadeOut)
def mover(atividade_id: int, destino: MoverIn, db: Session = Depends(get_db)):
    """Muda a atividade de dia (ex.: adiar para amanhã)."""
    atividade = _buscar(db, atividade_id)
    atividade.data = destino.data
    db.commit()
    db.refresh(atividade)
    return atividade


@router.delete("/{atividade_id}", status_code=204)
def excluir(atividade_id: int, db: Session = Depends(get_db)):
    atividade = _buscar(db, atividade_id)
    db.delete(atividade)
    db.commit()
    return Response(status_code=204)
