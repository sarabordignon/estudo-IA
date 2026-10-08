/* Ponto de entrada: navegação entre as telas, tema e botões globais. */
import { telaAtividades } from "./atividades.js";
import { estado } from "./estado.js";
import { telaHoje } from "./hoje.js";
import { abrirModal } from "./modal.js";
import { telaResumo } from "./resumo.js";
import { telaSemana } from "./semana.js";
import { $, hojeStr } from "./utils.js";

const TELAS = { hoje: telaHoje, semana: telaSemana, atividades: telaAtividades, resumo: telaResumo };
const FRASES = [
  "Um passo de cada vez.", "Pequenos passos também são progresso.", "Foque no que importa hoje.",
  "Descansar também faz parte do plano.", "Feito é melhor que perfeito.", "Organize o dia, tranquilize a mente.",
];
let atual = { recarregar: async () => {} };

function navegar() {
  const nome = location.hash.replace(/^#\//, "").split("?")[0];
  const rota = TELAS[nome] ? nome : "hoje";
  document.querySelectorAll("[data-rota]").forEach((a) => {
    const ativo = a.dataset.rota === rota;
    a.classList.toggle("ativo", ativo);
    ativo ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current");
  });
  atual = TELAS[rota]($("#view")) ?? atual;
  window.scrollTo(0, 0);
}

/* botões "Nova atividade" (menu, tela vazia, dias da semana...) */
document.addEventListener("click", (ev) => {
  const botao = ev.target.closest("[data-abrir-modal]");
  if (botao) abrirModal({ data: botao.dataset.data || estado.data }, () => atual.recarregar());
});

/* tema claro/escuro */
function rotuloTema() {
  const escuro = document.documentElement.dataset.tema === "escuro";
  $("#tema-rotulo").textContent = escuro ? "Modo claro" : "Modo escuro";
}
$("#tema").addEventListener("click", () => {
  const novo = document.documentElement.dataset.tema === "escuro" ? "claro" : "escuro";
  document.documentElement.dataset.tema = novo;
  try { localStorage.setItem("meudia_tema", novo); } catch { /* ignora */ }
  rotuloTema();
});

$("#frase").textContent = FRASES[new Date().getDate() % FRASES.length];
rotuloTema();
window.addEventListener("hashchange", navegar);
estado.data = hojeStr();
navegar();
