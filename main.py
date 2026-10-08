from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from app import models  # noqa: F401  (registra as tabelas)
from app.core.config import settings
from app.database.connection import Base, engine
from app.routes import atividades, health, resumo

STATIC_DIR = Path(__file__).parent / "app" / "static"


@asynccontextmanager
async def lifespan(application: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as erro:
        primeira_linha = str(erro).splitlines()[0]
        print(f"\n[AVISO] Não foi possível preparar o banco de dados: {primeira_linha}")
        print("Se estiver usando MySQL, confira o .env e o serviço do MySQL.")
        print("Para usar SQLite (sem configuração), apague o .env ou ponha DB_ENGINE=sqlite.\n")
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(health.router)
app.include_router(atividades.router)
app.include_router(resumo.router)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def pagina_inicial():
    return FileResponse(STATIC_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000)
