"""Configuração central do projeto.

Os valores vêm do arquivo .env (opcional). Sem .env o sistema usa SQLite,
que não precisa instalar nem configurar nada.
"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Raiz do projeto (pasta onde está o main.py), independente de onde o comando roda.
BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Meu Dia"
    app_env: str = "development"

    # "sqlite" (padrão, zero configuração) ou "mysql"
    db_engine: str = "sqlite"
    sqlite_file: str = "meudia.db"

    # Usados apenas quando db_engine=mysql
    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = "agenda"
    db_user: str = "root"
    db_password: str = ""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def usa_mysql(self) -> bool:
        return self.db_engine.strip().lower() == "mysql"


settings = Settings()
