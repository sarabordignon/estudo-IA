/* Janela de criar/editar atividade e janela de confirmação. */
import { Atividades } from "./api.js";
import { estado } from "./estado.js";
import { $, avisar, dataCurta, hojeStr } from "./utils.js";

const dialogo = $("#modal");
const form = $("#form");
let contexto = { id: null, aoSalvar: null };

export function abrirModal({ atividade = null, data } = {}, aoSalvar) {
  contexto = { id: atividade?.id ?? null, aoSalvar };
  form.reset();
  $("#modal-titulo").textContent = atividade ? "Editar atividade" : "Nova atividade";
  $("#f-salvar").textContent = atividade ? "Salvar alterações" : "Adicionar atividade";
  $("#f-titulo").value = atividade?.titulo ?? "";
  $("#f-data").value = atividade?.data ?? data ?? hojeStr();
  $("#f-horario").value = atividade?.horario ? atividade.horario.slice(0, 5) : "";
  $("#f-duracao").value = atividade?.duracao_min ?? 30;
  form.elements.prioridade.value = atividade?.prioridade ?? "media";
  dialogo.showModal();
  $("#f-titulo").focus();
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const botao = $("#f-salvar");
  const corpo = {
    titulo: $("#f-titulo").value.trim(),
    data: $("#f-data").value,
    horario: $("#f-horario").value || null,
    duracao_min: parseInt($("#f-duracao").value, 10) || 30,
    prioridade: form.elements.prioridade.value,
  };
  if (!corpo.titulo) {
    avisar("Escreva o nome da atividade.", true);
    return;
  }
  botao.disabled = true;
  try {
    const salva = contexto.id
      ? await Atividades.atualizar(contexto.id, corpo)
      : await Atividades.criar(corpo);
    dialogo.close();
    const outroDia = salva.data !== estado.data;
    const verbo = contexto.id ? "atualizada" : "adicionada";
    avisar(outroDia ? `Atividade ${verbo} em ${dataCurta(salva.data)}!` : `Atividade ${verbo}!`);
    await contexto.aoSalvar?.(salva);
  } catch (e) {
    avisar(e.message, true);
  } finally {
    botao.disabled = false;
  }
});

$("#duracoes").addEventListener("click", (ev) => {
  const b = ev.target.closest("[data-min]");
  if (b) $("#f-duracao").value = b.dataset.min;
});
dialogo.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", () => dialogo.close()));
dialogo.addEventListener("click", (ev) => { if (ev.target === dialogo) dialogo.close(); });

/** Pergunta "tem certeza?" e devolve true/false. */
export function confirmar(detalhe) {
  const d = $("#confirmar");
  $("#confirmar-detalhe").textContent = detalhe;
  d.returnValue = "nao";
  return new Promise((resolve) => {
    d.addEventListener("close", () => resolve(d.returnValue === "sim"), { once: true });
    d.showModal();
  });
}
