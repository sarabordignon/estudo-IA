/* Tela "Semana": sete colunas com as atividades de cada dia (arraste para mudar de dia). */
import { Atividades } from "./api.js";
import { ligarAcoes } from "./componentes.js";
import { estado, irParaDia } from "./estado.js";
import {
  $, avisar, dataCurta, diaSemanaCurto, esc, faixaHorario, fmtDuracao, hojeStr, icone,
  inicioSemana, lerData, somarDias,
} from "./utils.js";

function miniAtividade(a) {
  const hora = a.horario ? `${faixaHorario(a.horario, a.duracao_min)} · ` : "";
  return `
    <div class="mini ${a.prioridade}${a.concluida ? " feita" : ""}" data-id="${a.id}" draggable="true">
      <button class="check" type="button" data-acao="toggle" aria-pressed="${a.concluida}"
        aria-label="${a.concluida ? "Marcar como pendente" : "Marcar como concluída"}">${icone("check")}</button>
      <button class="mini-b" type="button" data-acao="editar" title="Editar">
        <span class="mini-t">${esc(a.titulo)}</span>
        <span class="mini-h">${hora}${fmtDuracao(a.duracao_min)}</span>
      </button>
    </div>`;
}

export function telaSemana(view) {
  let lista = [];
  let jaRolou = false;

  view.innerHTML = `
    <header class="view-head">
      <div>
        <p class="eyebrow">Visão geral</p>
        <h1>Sua <span class="grad-text">semana.</span></h1>
        <p class="subtitulo" id="faixa"></p>
      </div>
      <div class="date-nav">
        <button class="icon-btn" id="ant" type="button" aria-label="Semana anterior">${icone("left")}</button>
        <button class="btn btn-ghost" id="esta" type="button">Esta semana</button>
        <button class="icon-btn" id="prox" type="button" aria-label="Próxima semana">${icone("right")}</button>
      </div>
    </header>
    <div class="semana-grid" id="grade"></div>
    <p class="muted" style="margin-top:16px;font-size:13px">Dica: arraste uma atividade para outro dia para reagendá-la.</p>`;

  function desenhar() {
    const hoje = hojeStr();
    let html = "";
    for (let i = 0; i < 7; i++) {
      const data = somarDias(estado.semana, i);
      const doDia = lista.filter((a) => a.data === data);
      const feitas = doDia.filter((a) => a.concluida).length;
      const pct = doDia.length ? (feitas / doDia.length) * 100 : 0;
      html += `
        <section class="card dia${data === hoje ? " hoje" : ""}" data-data="${data}">
          <button class="dia-head" type="button" data-ir="${data}" title="Abrir este dia">
            <span><span class="dia-nome">${diaSemanaCurto(data)}</span><br>
              <small class="muted">${doDia.length ? `${feitas}/${doDia.length} feitas` : "livre"}</small></span>
            <span class="dia-num">${lerData(data).getDate()}</span>
          </button>
          <div class="dia-prog"><span style="width:${pct}%"></span></div>
          ${doDia.map(miniAtividade).join("")}
          <button class="add-dia" type="button" data-abrir-modal data-data="${data}">${icone("plus")} Adicionar</button>
        </section>`;
    }
    $("#grade").innerHTML = html;
    if (!jaRolou) { // na primeira vez, deixa o dia de hoje visível
      jaRolou = true;
      const dh = $("#grade .dia.hoje");
      const g = $("#grade");
      if (dh && dh.offsetLeft + dh.offsetWidth > g.clientWidth) g.scrollLeft = dh.offsetLeft - g.offsetLeft - 8;
    }
    const fim = somarDias(estado.semana, 6);
    $("#faixa").textContent = `${dataCurta(estado.semana)} a ${dataCurta(fim)} de ${lerData(fim).getFullYear()}`;
  }

  async function recarregar() {
    try {
      lista = await Atividades.listar({ inicio: estado.semana, fim: somarDias(estado.semana, 6) });
    } catch (e) {
      lista = [];
      avisar(e.message, true);
    }
    desenhar();
  }

  const grade = $("#grade");
  ligarAcoes(grade, () => lista, recarregar);
  grade.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ir]");
    if (b) irParaDia(b.dataset.ir);
  });

  /* arrastar e soltar */
  let arrastandoId = null;
  grade.addEventListener("dragstart", (ev) => {
    const m = ev.target.closest(".mini");
    if (!m) return;
    arrastandoId = Number(m.dataset.id);
    ev.dataTransfer.effectAllowed = "move";
    ev.dataTransfer.setData("text/plain", String(arrastandoId));
    m.classList.add("arrastando");
  });
  grade.addEventListener("dragend", () => {
    arrastandoId = null;
    grade.querySelectorAll(".arrastando, .alvo").forEach((e) => e.classList.remove("arrastando", "alvo"));
  });
  grade.addEventListener("dragover", (ev) => {
    const dia = ev.target.closest(".dia");
    if (!dia || arrastandoId === null) return;
    ev.preventDefault();
    grade.querySelectorAll(".alvo").forEach((e) => e !== dia && e.classList.remove("alvo"));
    dia.classList.add("alvo");
  });
  grade.addEventListener("drop", async (ev) => {
    const dia = ev.target.closest(".dia");
    if (!dia || arrastandoId === null) return;
    ev.preventDefault();
    const a = lista.find((x) => x.id === arrastandoId);
    arrastandoId = null;
    if (!a || a.data === dia.dataset.data) return desenhar();
    try {
      await Atividades.mover(a.id, dia.dataset.data);
      avisar(`Movida para ${dataCurta(dia.dataset.data)}.`);
      await recarregar();
    } catch (e) {
      avisar(e.message, true);
    }
  });

  const mudar = (data) => { estado.semana = inicioSemana(data); recarregar(); };
  $("#ant").addEventListener("click", () => mudar(somarDias(estado.semana, -7)));
  $("#prox").addEventListener("click", () => mudar(somarDias(estado.semana, 7)));
  $("#esta").addEventListener("click", () => mudar(hojeStr()));

  desenhar();
  recarregar();
  return { recarregar };
}
