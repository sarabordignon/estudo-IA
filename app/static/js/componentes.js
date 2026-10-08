/* Peças reutilizadas em várias telas: item de atividade, conflitos e ações. */
import { Atividades } from "./api.js";
import { abrirModal, confirmar } from "./modal.js";
import { ROTULO_PRIO, avisar, esc, faixaHorario, fmtDuracao, icone, paraMin, somarDias } from "./utils.js";

/** Devolve os ids de atividades cujos horários se sobrepõem. */
export function detectarConflitos(lista) {
  const conflitos = new Set();
  const itens = lista
    .filter((a) => a.horario)
    .map((a) => ({ id: a.id, data: a.data, ini: paraMin(a.horario), fim: paraMin(a.horario) + a.duracao_min }))
    .sort((a, b) => a.data.localeCompare(b.data) || a.ini - b.ini);
  let fimMaior = -1, idMaior = null, dataAtual = null;
  for (const a of itens) {
    if (a.data !== dataAtual) { dataAtual = a.data; fimMaior = -1; idMaior = null; }
    if (a.ini < fimMaior) { conflitos.add(a.id); conflitos.add(idMaior); }
    if (a.fim > fimMaior) { fimMaior = a.fim; idMaior = a.id; }
  }
  return conflitos;
}

export function itemAtividade(a, conflito = false) {
  const horario = a.horario
    ? `<span class="chip">${icone("clock")} ${faixaHorario(a.horario, a.duracao_min)}</span>` : "";
  return `
    <li class="item ${a.prioridade}${a.concluida ? " feita" : ""}" data-id="${a.id}">
      <button class="check" type="button" data-acao="toggle" aria-pressed="${a.concluida}"
        aria-label="${a.concluida ? "Marcar como pendente" : "Marcar como concluída"}">${icone("check")}</button>
      <div class="item-body">
        <div class="item-titulo">${esc(a.titulo)}</div>
        <div class="item-meta">
          ${horario}
          <span class="chip">${fmtDuracao(a.duracao_min)}</span>
          <span class="chip ${a.prioridade}">${ROTULO_PRIO[a.prioridade]}</span>
          ${conflito ? `<span class="chip conflito">${icone("alert")} conflito de horário</span>` : ""}
        </div>
      </div>
      <div class="item-acoes">
        ${a.concluida ? "" : `<button class="icon-btn" type="button" data-acao="adiar" title="Adiar para amanhã" aria-label="Adiar para amanhã">${icone("next")}</button>`}
        <button class="icon-btn" type="button" data-acao="editar" title="Editar" aria-label="Editar ${esc(a.titulo)}">${icone("edit")}</button>
        <button class="icon-btn perigo" type="button" data-acao="excluir" title="Excluir" aria-label="Excluir ${esc(a.titulo)}">${icone("trash")}</button>
      </div>
    </li>`;
}

/**
 * Liga os botões (concluir, editar, adiar, excluir) de um container.
 * getLista: função que devolve as atividades atualmente na tela.
 * recarregar: função chamada depois de qualquer alteração.
 */
export function ligarAcoes(container, getLista, recarregar) {
  container.addEventListener("click", async (ev) => {
    const botao = ev.target.closest("[data-acao]");
    const alvo = botao?.closest("[data-id]");
    if (!botao || !alvo) return;
    const id = Number(alvo.dataset.id);
    const a = getLista().find((x) => x.id === id);
    if (!a) return;
    try {
      switch (botao.dataset.acao) {
        case "toggle":
          await Atividades.alternar(id);
          break;
        case "editar":
          abrirModal({ atividade: a }, recarregar);
          return;
        case "adiar":
          await Atividades.mover(id, somarDias(a.data, 1));
          avisar("Atividade movida para amanhã.");
          break;
        case "excluir":
          if (!(await confirmar(`"${a.titulo}" será removida para sempre.`))) return;
          await Atividades.excluir(id);
          avisar("Atividade excluída.");
          break;
        default:
          return;
      }
      await recarregar();
    } catch (e) {
      avisar(e.message, true);
    }
  });
}

export function estadoVazio(titulo, texto, data = "") {
  return `
    <div class="vazio">
      <div class="vazio-ico">${icone("spark")}</div>
      <h3>${titulo}</h3>
      <p>${texto}</p>
      <button class="btn btn-grad" type="button" data-abrir-modal ${data ? `data-data="${data}"` : ""}>${icone("plus")} Criar atividade</button>
    </div>`;
}
