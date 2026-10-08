# Meu Dia

Aplicação web para organizar suas atividades diárias: defina prioridades, veja se o planejamento cabe no seu tempo, acompanhe a semana e o seu progresso.

## Como executar (3 passos)

1. Tenha o **Python 3.10 ou superior** instalado (https://www.python.org/downloads/ — no Windows, marque *Add Python to PATH*).
2. Extraia o ZIP e abra a pasta `meu-dia` no terminal (no VS Code: *Terminal > New Terminal*).
3. Rode **um único comando**:

```
python iniciar.py
```

Pronto! Na primeira vez ele cria o ambiente, instala as dependências, inicia o sistema e **abre o navegador sozinho**. Para parar, use `Ctrl+C`.

> Atalhos: no Windows, dê **duplo clique em `iniciar.bat`**. No Mac/Linux, use `./iniciar.sh` (ou `python3 iniciar.py`).

Não precisa instalar banco de dados: o sistema usa **SQLite** (arquivo `meudia.db`, criado automaticamente).

## Telas

| Tela | O que faz |
|------|-----------|
| **Hoje** | Progresso do dia, tempo planejado x concluído x livre, aviso se cabe no dia, lista com conflitos de horário |
| **Semana** | Sete dias lado a lado; arraste uma atividade para outro dia para reagendá-la |
| **Atividades** | Todas as atividades com busca, filtro por situação, prioridade e período |
| **Resumo** | Taxa de conclusão, gráfico de tempo por dia, distribuição por prioridade (7 dias, 30 dias ou mês) |

Em todas as telas é possível criar, editar, concluir, adiar (para amanhã) e excluir atividades. Há tema claro/escuro e layout para celular.

## Estrutura

```text
meu-dia/
├── iniciar.py              # inicia tudo com um comando
├── iniciar.bat / .sh       # atalhos para Windows e Mac/Linux
├── main.py                 # ponto de entrada do FastAPI
├── app/
│   ├── core/config.py      # configurações (.env opcional)
│   ├── database/           # conexão SQLite/MySQL
│   ├── models/             # tabelas
│   ├── schemas/            # validação dos dados
│   ├── services/           # regras (ordenação, resumo)
│   ├── routes/             # endpoints da API
│   └── static/             # interface
│       ├── index.html
│       ├── css/style.css
│       └── js/             # uma tela por arquivo (hoje, semana, atividades, resumo)
├── tests/                  # testes automatizados
├── requirements.txt        # dependências de execução
└── requirements-dev.txt    # + dependências de teste
```

## Endereços úteis

- Sistema: http://127.0.0.1:8000 (se a porta estiver ocupada, o `iniciar.py` escolhe outra e mostra no terminal)
- Documentação da API: `/docs`
- Saúde do sistema: `/health` e `/health/database`

## Testes

```
python -m venv .venv
.venv\Scripts\python -m pip install -r requirements-dev.txt     (Windows)
.venv/bin/python -m pip install -r requirements-dev.txt         (Mac/Linux)
python -m pytest
```

(Se você já rodou `iniciar.py`, o `.venv` existe: basta instalar o `requirements-dev.txt` nele e rodar `pytest`.) Os testes usam SQLite em memória.

## Usar MySQL (opcional)

Só se você quiser trocar o SQLite pelo MySQL:

1. Copie `.env.example` para `.env` e preencha `DB_ENGINE=mysql`, `DB_USER` e `DB_PASSWORD`.
2. Crie o database: `.venv\Scripts\python criar_banco.py` (Windows) ou `.venv/bin/python criar_banco.py`.
3. Rode `python iniciar.py` normalmente.

Para voltar ao SQLite, apague o `.env` (ou ponha `DB_ENGINE=sqlite`).

## Solução de problemas

- **`python` não reconhecido:** reinstale o Python marcando *Add Python to PATH*. No Mac/Linux use `python3`.
- **Falha ao instalar dependências:** confira a conexão com a internet e rode o comando de novo.
- **Quer apagar todos os dados:** pare o sistema e apague o arquivo `meudia.db`.
- **Erro com MySQL:** confira o `.env`, se o serviço do MySQL está ligado e se rodou o `criar_banco.py`.
