/* Tela "Hoje": resumo do dia, tempo disponível e lista de atividades. */
import { Atividades } from "./api.js";
import { detectarConflitos, estadoVazio, itemAtividade, ligarAcoes } from "./componentes.js";
import { estado, lerHoras, salvarHoras } from "./estado.js";
import { $, avisar, dataExtenso, fmtDuracao, hojeStr, icone, somarDias } from "./utils.js";

const CIRCUNFERENCIA = 2 * Math.PI * 54;

function saudacao(data) {
  const hoje = hojeStr();
  if (data > hoje) return "Planejando o que vem pela frente";
  if (data < hoje) return "Olhando para trás";
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

export function telaHoje(view) {
  let lista = [];

  view.innerHTML = `
    <header class="view-head">
      <div>
        <p class="eyebrow" id="saudacao"></p>
        <h1>Seu dia, <span class="grad-text">seu ritmo.</span></h1>
        <p class="subtitulo" id="data-extenso"></p>
      </div>
      <div class="date-nav">
        <button class="icon-btn" id="ant" type="button" aria-label="Dia anterior">${icone("left")}</button>
        <input class="input" type="date" id="data" aria-label="Escolher data">
        <button class="icon-btn" id="prox" type="button" aria-label="Próximo dia">${icone("right")}</button>
        <button class="btn btn-ghost" id="btn-hoje" type="button">Hoje</button>
      </div>
    </header>

    <section class="hero" aria-label="Progresso do dia">
      <div class="ring">
        <svg viewBox="0 0 130 130" aria-hidden="true">
          <circle class="trilho" cx="65" cy="65" r="54"/>
          <circle class="valor" id="anel" cx="65" cy="65" r="54" stroke-dasharray="${CIRCUNFERENCIA}" stroke-dashoffset="${CIRCUNFERENCIA}"/>
        </svg>
        <div class="ring-txt" id="anel-pct">0%</div>
      </div>
      <div class="hero-txt"><h2 id="hero-titulo"></h2><p id="hero-texto"></p></div>
    </section>

    <section class="stats" aria-label="Resumo do dia">
      <article class="card stat"><div class="stat-top">Planejado <span class="stat-ico roxo">${icone("clock")}</span></div><strong id="st-plan">0min</strong><p>Tempo reservado para tarefas</p></article>
      <article class="card stat"><div class="stat-top">Concluído <span class="stat-ico verde">${icone("check")}</span></div><strong id="st-feito">0min</strong><p>Você está avançando</p></article>
      <article class="card stat"><div class="stat-top">Tempo livre <span class="stat-ico ambar">${icone("spark")}</span></div><strong id="st-livre">0min</strong><p>Espaço para respirar</p></article>
    </section>

    <div class="grade-hoje">
      <section class="card">
        <div class="tempo-top">
          <div><h2 style="font-size:18px;font-weight:800;letter-spacing:-.4px">Cabe no seu dia?</h2>
          <p class="muted">Compare as atividades com o tempo que você tem.</p></div>
          <label class="horas">Tempo disponível
            <input class="input" type="number" id="horas" min="1" max="24" step="0.5" aria-label="Horas disponíveis no dia"> h
          </label>
        </div>
        <div class="pct-linha"><span>Uso do tempo</span><strong id="pct">0%</strong></div>
        <div class="barra" id="barra" role="progressbar" aria-label="Tempo planejado" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="barra-v"></span></div>
        <p class="aviso" id="aviso" aria-live="polite" hidden></p>
      </section>

      <section class="card">
        <div class="card-title">
          <h2>Suas atividades <span class="muted" id="contador" style="font-size:14px;font-weight:600"></span></h2>
          <button class="btn btn-grad" type="button" data-abrir-modal>${icone("plus")} Nova atividade</button>
        </div>
        <ul class="lista" id="lista"></ul>
        <div id="vazio" hidden></div>
      </section>
    </div>`;

  /* ----- desenho ----- */
  function cabecalho() {
    $("#data").value = estado.data;
    $("#data-extenso").textContent = dataExtenso(estado.data);
    $("#saudacao").textContent = saudacao(estado.data);
  }

  function desenharLista() {
    const conflitos = detectarConflitos(lista);
    $("#lista").innerHTML = lista.map((a) => itemAtividade(a, conflitos.has(a.id))).join("");
    $("#vazio").hidden = lista.length > 0;
    $("#vazio").innerHTML = lista.length ? "" : estadoVazio(
      "Seu dia começa aqui", "Adicione uma atividade e transforme planos em pequenas conquistas.", estado.data);
    $("#contador").textContent = lista.length ? `· ${lista.length} ${lista.length === 1 ? "tarefa" : "tarefas"}` : "";
  }

  function desenharResumo() {
    const disponivel = Math.round(lerHoras() * 60);
    const planejado = lista.reduce((s, a) => s + a.duracao_min, 0);
    const feito = lista.filter((a) => a.concluida).reduce((s, a) => s + a.duracao_min, 0);
    const livre = disponivel - planejado;
    const total = lista.length;
    const concluidas = lista.filter((a) => a.concluida).length;
    const pctTarefas = total ? Math.round((concluidas / total) * 100) : 0;
    const pctTempo = disponivel ? (planejado / disponivel) * 100 : 0;

    $("#st-plan").textContent = fmtDuracao(planejado);
    $("#st-feito").textContent = fmtDuracao(feito);
    $("#st-livre").textContent = (livre < 0 ? "-" : "") + fmtDuracao(Math.abs(livre));

    $("#anel-pct").textContent = `${pctTarefas}%`;
    $("#anel").style.strokeDashoffset = CIRCUNFERENCIA * (1 - pctTarefas / 100);
    if (!total) {
      $("#hero-titulo").textContent = "Seu dia está livre";
      $("#hero-texto").textContent = "Nenhuma atividade por aqui ainda. Que tal planejar algo bom para hoje?";
    } else if (concluidas === total) {
      $("#hero-titulo").textContent = "Tudo concluído! 🎉";
      $("#hero-texto").textContent = `Você finalizou as ${total} atividades. Aproveite o descanso, você merece.`;
    } else {
      const falta = total - concluidas;
      $("#hero-titulo").textContent = `${concluidas} de ${total} concluídas`;
      $("#hero-texto").textContent = `Falta${falta === 1 ? "" : "m"} ${falta} ${falta === 1 ? "atividade" : "atividades"}. Um passo de cada vez!`;
    }

    $("#pct").textContent = `${Math.round(pctTempo)}%`;
    $("#barra-v").style.width = `${Math.min(100, pctTempo)}%`;
    $("#barra").setAttribute("aria-valuenow", String(Math.min(100, Math.round(pctTempo))));
    $("#barra").className = "barra" + (livre < 0 ? " estourou" : pctTempo >= 85 ? " alerta" : "");

    const aviso = $("#aviso");
    aviso.hidden = !total;
    if (!total) return;
    if (livre < 0) {
      aviso.className = "aviso erro";
      aviso.textContent = `Não cabe no dia: faltam ${fmtDuracao(-livre)}. Reduza ou adie atividades de baixa prioridade.`;
    } else if (livre < 30) {
      aviso.className = "aviso alerta";
      aviso.textContent = `Dia quase cheio: sobram só ${fmtDuracao(livre)}.`;
    } else {
      aviso.className = "aviso ok";
      aviso.textContent = `Cabe no dia! Sobram ${fmtDuracao(livre)}.`;
    }
  }

  async function recarregar() {
    cabecalho();
    try {
      lista = await Atividades.listar({ data: estado.data });
    } catch (e) {
      lista = [];
      avisar(e.message, true);
    }
    desenharLista();
    desenharResumo();
  }

  /* ----- eventos ----- */
  const ir = (data) => { estado.data = data; recarregar(); };
  $("#ant").addEventListener("click", () => ir(somarDias(estado.data, -1)));
  $("#prox").addEventListener("click", () => ir(somarDias(estado.data, 1)));
  $("#btn-hoje").addEventListener("click", () => ir(hojeStr()));
  $("#data").addEventListener("change", (e) => e.target.value && ir(e.target.value));
  $("#horas").value = lerHoras();
  $("#horas").addEventListener("input", (e) => {
    const h = parseFloat(e.target.value);
    if (h > 0 && h <= 24) { salvarHoras(h); desenharResumo(); }
  });
  ligarAcoes($("#lista"), () => lista, recarregar);

  recarregar();
  return { recarregar };
}
