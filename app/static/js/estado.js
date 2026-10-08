/* Estado compartilhado entre as telas. */
import { hojeStr, inicioSemana } from "./utils.js";

export const estado = {
  data: hojeStr(),                 // dia exibido na tela "Hoje"
  semana: inicioSemana(hojeStr()), // segunda-feira da semana exibida
};

export function lerHoras() {
  try {
    const v = parseFloat(localStorage.getItem("meudia_horas"));
    if (v > 0 && v <= 24) return v;
  } catch { /* localStorage indisponível */ }
  return 8;
}
export function salvarHoras(h) {
  try { localStorage.setItem("meudia_horas", String(h)); } catch { /* ignora */ }
}

/** Abre a tela "Hoje" já no dia escolhido. */
export function irParaDia(data) {
  estado.data = data;
  if (location.hash === "#/hoje") window.dispatchEvent(new HashChangeEvent("hashchange"));
  else location.hash = "#/hoje";
}
