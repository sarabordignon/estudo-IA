from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.resumo import Resumo
from app.services.resumo import calcular_resumo

router = APIRouter(prefix="/api/resumo", tags=["Resumo"])

MAX_DIAS = 366


@router.get("", response_model=Resumo)
def resumo(inicio: date, fim: date, db: Session = Depends(get_db)):
    """Estatísticas de um período (usado na tela Resumo)."""
    if fim < inicio:
        raise HTTPException(status_code=422, detail="A data final não pode ser anterior à inicial.")
    if (fim - inicio).days >= MAX_DIAS:
        raise HTTPException(status_code=422, detail=f"O período máximo é de {MAX_DIAS} dias.")
    return calcular_resumo(db, inicio, fim)
