/* Funções utilitárias compartilhadas por todas as telas. */
export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

export const ROTULO_PRIO = { alta: "Alta", media: "Média", baixa: "Baixa" };

/** Protege contra HTML injetado em textos digitados pelo usuário. */
export function esc(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

export const icone = (nome, extra = "") =>
  `<svg class="ic ${extra}" aria-hidden="true"><use href="#i-${nome}"/></svg>`;

const p2 = (n) => String(n).padStart(2, "0");

/* ---------- datas (sempre no formato AAAA-MM-DD, sem fuso) ---------- */
export function fmtData(d) {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}
export const hojeStr = () => fmtData(new Date());

export function lerData(str) {
  const [a, m, d] = str.split("-").map(Number);
  return new Date(a, m - 1, d);
}
export function somarDias(str, n) {
  const d = lerData(str);
  d.setDate(d.getDate() + n);
  return fmtData(d);
}
/** Segunda-feira da semana da data informada. */
export function inicioSemana(str) {
  const d = lerData(str);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return fmtData(d);
}
export function dataExtenso(str, comAno = true) {
  return lerData(str).toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", ...(comAno ? { year: "numeric" } : {}),
  });
}
export function dataCurta(str) {
  return lerData(str).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
}
export function diaSemanaCurto(str) {
  return lerData(str).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

/* ---------- tempo ---------- */
export function fmtDuracao(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  return m ? `${h}h${p2(m)}` : `${h}h`;
}
export function paraMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
export function deMin(total) {
  return `${p2(Math.floor(total / 60) % 24)}:${p2(total % 60)}`;
}
/** "09:00–10:30" a partir do horário inicial e da duração. */
export function faixaHorario(horario, duracao) {
  const ini = horario.slice(0, 5);
  return `${ini}–${deMin(paraMin(ini) + duracao)}`;
}

/* ---------- interface ---------- */
let temporizador;
export function avisar(mensagem, erro = false) {
  const t = $("#toast");
  t.textContent = mensagem;
  t.className = "toast" + (erro ? " erro" : "");
  t.hidden = false;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (t.hidden = true), 3500);
}

export function debounce(fn, ms = 300) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
}
