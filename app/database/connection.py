"""Conexão com o banco de dados (SQLite por padrão, MySQL opcional)."""
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import BASE_DIR, settings


def montar_url() -> URL:
    if settings.usa_mysql:
        # URL.create trata caracteres especiais da senha automaticamente.
        return URL.create(
            drivername="mysql+pymysql",
            username=settings.db_user,
            password=settings.db_password,
            host=settings.db_host,
            port=settings.db_port,
            database=settings.db_name,
            query={"charset": "utf8mb4"},
        )
    arquivo = BASE_DIR / settings.sqlite_file
    return URL.create(drivername="sqlite", database=str(arquivo))


DATABASE_URL = montar_url()

_args = {"check_same_thread": False} if DATABASE_URL.drivername == "sqlite" else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    """Base de todos os models."""


def get_db():
    """Dependência do FastAPI: abre e fecha uma sessão por requisição."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
