"""Inicia o Meu Dia com UM comando:   python iniciar.py

Faz tudo sozinho: cria o ambiente virtual (.venv), instala as dependências,
sobe o servidor e abre o navegador. Para parar, pressione Ctrl+C.
"""
import hashlib
import os
import socket
import subprocess
import sys
import threading
import time
import venv
import webbrowser
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
VENV = RAIZ / ".venv"
PYTHON = VENV / ("Scripts/python.exe" if os.name == "nt" else "bin/python")
REQUISITOS = RAIZ / "requirements.txt"
MARCA = VENV / ".requisitos.sha"


def preparar_ambiente() -> None:
    if sys.version_info < (3, 10):
        sys.exit("Python 3.10 ou superior é necessário. Baixe em https://www.python.org/downloads/")
    if not PYTHON.exists():
        print("» Criando ambiente virtual (só na primeira vez)...")
        venv.create(VENV, with_pip=True)

    assinatura = hashlib.sha256(REQUISITOS.read_bytes()).hexdigest()
    if MARCA.exists() and MARCA.read_text() == assinatura:
        return
    print("» Instalando dependências (só na primeira vez, pode levar um minuto)...")
    comando = [str(PYTHON), "-m", "pip", "install", "--quiet", "-r", str(REQUISITOS)]
    if subprocess.call(comando, cwd=RAIZ) != 0:
        sys.exit("Falha ao instalar as dependências. Verifique sua conexão com a internet.")
    MARCA.write_text(assinatura)


def porta_livre(inicial: int = 8000) -> int:
    for porta in range(inicial, inicial + 20):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", porta)) != 0:
                return porta
    sys.exit("Nenhuma porta livre encontrada entre 8000 e 8019.")


def abrir_navegador(url: str, porta: int) -> None:
    for _ in range(100):
        with socket.socket() as s:
            if s.connect_ex(("127.0.0.1", porta)) == 0:
                webbrowser.open(url)
                return
        time.sleep(0.2)


def main() -> None:
    preparar_ambiente()
    porta = porta_livre()
    url = f"http://127.0.0.1:{porta}"
    print(f"\n✔ Meu Dia rodando em {url}\n  (Ctrl+C para parar)\n")
    threading.Thread(target=abrir_navegador, args=(url, porta), daemon=True).start()
    try:
        subprocess.call(
            [str(PYTHON), "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", str(porta)],
            cwd=RAIZ,
        )
    except KeyboardInterrupt:
        print("\nAté logo!")


if __name__ == "__main__":
    main()
