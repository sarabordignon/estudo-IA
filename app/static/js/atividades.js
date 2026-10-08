/* Tela "Atividades": todas as atividades, com busca e filtros. */
import { Atividades } from "./api.js";
import { detectarConflitos, estadoVazio, itemAtividade, ligarAcoes } from "./componentes.js";
import { estado, irParaDia } from "./estado.js";
import { $, avisar, dataExtenso, debounce, esc, hojeStr, icone, lerData, somarDias } from "./utils.js";

// Os filtros ficam guardados enquanto o usuário navega entre as telas.
const filtros = { busca: "", status: "", prioridade: "", periodo: "todos" };

function periodoParaApi(periodo) {
  const hoje = hojeStr();
  switch (periodo) {
    case "futuras": return { inicio: hoje };
    case "recentes": return { inicio: somarDias(hoje, -30), fim: hoje };
    case "anteriores": return { fim: somarDias(hoje, -1) };
    default: return {};
  }
}

function rotuloDia(data) {
  const hoje = hojeStr();
  const extenso = dataExtenso(data, lerData(data).getFullYear() !== new Date().getFullYear());
  if (data === hoje) return `${extenso} <span class="badge-hoje">Hoje</span>`;
  if (data === somarDias(hoje, 1)) return `${extenso} <span class="badge-hoje">Amanhã</span>`;
  return esc(extenso);
}

export function telaAtividades(view) {
  let lista = [];
  let pedido = 0;

  view.innerHTML = `
    <header class="view-head">
      <div>
        <p class="eyebrow">Tudo em um só lugar</p>
        <h1>Suas <span class="grad-text">atividades.</span></h1>
        <p class="subtitulo" id="contagem"></p>
      </div>
      <button class="btn btn-grad" type="button" data-abrir-modal>${icone("plus")} Nova atividade</button>
    </header>

    <div class="filtros">
      <label class="busca">${icone("search")}
        <input class="input" id="busca" type="search" placeholder="Buscar atividade..." aria-label="Buscar atividade" value="${esc(filtros.busca)}">
      </label>
      <div class="seg" id="status" role="group" aria-label="Filtrar por situação">
        <button type="button" data-v="">Todas</button>
        <button type="button" data-v="pendente">Pendentes</button>
        <button type="button" data-v="concluida">Concluídas</button>
      </div>
      <select class="input" id="prioridade" aria-label="Filtrar por prioridade">
        <option value="">Toda prioridade</option>
        <option value="alta">Alta</option><option value="media">Média</option><option value="baixa">Baixa</option>
      </select>
      <select class="input" id="periodo" aria-label="Filtrar por período">
        <option value="todos">Todo o período</option>
        <option value="futuras">De hoje em diante</option>
        <option value="recentes">Últimos 30 dias</option>
        <option value="anteriores">Antes de hoje</option>
      </select>
    </div>

    <div id="resultado"></div>`;

  function marcarFiltros() {
    $("#prioridade").value = filtros.prioridade;
    $("#periodo").value = filtros.periodo;
    view.querySelectorAll("#status button").forEach((b) => b.classList.toggle("ativo", b.dataset.v === filtros.status));
  }

  function desenhar() {
    const temFiltro = filtros.busca || filtros.status || filtros.prioridade || filtros.periodo !== "todos";
    $("#contagem").textContent = `${lista.length} ${lista.length === 1 ? "atividade encontrada" : "atividades encontradas"}`;
    if (!lista.length) {
      $("#resultado").innerHTML = `<div class="card">${temFiltro
        ? `<div class="vazio"><div class="vazio-ico">${icone("search")}</div><h3>Nada encontrado</h3><p>Tente mudar a busca ou limpar os filtros.</p></div>`
        : estadoVazio("Nenhuma atividade ainda", "Crie a primeira e comece a organizar sua rotina.")}</div>`;
      return;
    }
    const conflitos = detectarConflitos(lista);
    const grupos = new Map();
    for (const a of lista) {
      if (!grupos.has(a.data)) grupos.set(a.data, []);
      grupos.get(a.data).push(a);
    }
    let html = "";
    for (const [data, itens] of grupos) {
      const feitas = itens.filter((a) => a.concluida).length;
      html += `
        <section class="grupo">
          <button class="grupo-head" type="button" data-ir="${data}" title="Abrir este dia">
            <span>${rotuloDia(data)}</span><small>${feitas}/${itens.length} concluídas</small>
          </button>
          <ul class="lista">${itens.map((a) => itemAtividade(a, conflitos.has(a.id))).join("")}</ul>
        </section>`;
    }
    $("#resultado").innerHTML = html;
  }

  async function recarregar() {
    const meu = ++pedido; // ignora respostas antigas se o usuário digitar rápido
    try {
      const resposta = await Atividades.listar({
        busca: filtros.busca, status: filtros.status, prioridade: filtros.prioridade, ...periodoParaApi(filtros.periodo),
      });
      if (meu !== pedido) return;
      lista = resposta;
    } catch (e) {
      if (meu !== pedido) return;
      lista = [];
      avisar(e.message, true);
    }
    desenhar();
  }

  const resultado = $("#resultado");
  ligarAcoes(resultado, () => lista, recarregar);
  resultado.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-ir]");
    if (b) irParaDia(b.dataset.ir);
  });

  const buscar = debounce(() => { filtros.busca = $("#busca").value.trim(); recarregar(); }, 300);
  $("#busca").addEventListener("input", buscar);
  $("#status").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-v]");
    if (!b) return;
    filtros.status = b.dataset.v;
    marcarFiltros();
    recarregar();
  });
  $("#prioridade").addEventListener("change", (e) => { filtros.prioridade = e.target.value; recarregar(); });
  $("#periodo").addEventListener("change", (e) => { filtros.periodo = e.target.value; recarregar(); });

  marcarFiltros();
  recarregar();
  return { recarregar };
}
