"""Cria o database no MySQL (só é necessário se DB_ENGINE=mysql no .env).

Uso:  python criar_banco.py
"""
from app.core.config import settings

if not settings.usa_mysql:
    print("Você está usando SQLite: não é preciso criar banco nenhum. Tudo é automático!")
    raise SystemExit(0)

import pymysql  # noqa: E402

conexao = pymysql.connect(
    host=settings.db_host,
    port=settings.db_port,
    user=settings.db_user,
    password=settings.db_password,
)
try:
    with conexao.cursor() as cursor:
        cursor.execute(
            f"CREATE DATABASE IF NOT EXISTS `{settings.db_name}` "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        )
    conexao.commit()
    print(f"Database '{settings.db_name}' pronto.")
finally:
    conexao.close()
