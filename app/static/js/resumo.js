/* Tela "Resumo": estatísticas e gráficos de um período. */
import { buscarResumo } from "./api.js";
import { $, avisar, dataCurta, diaSemanaCurto, fmtData, fmtDuracao, hojeStr, icone, lerData, somarDias } from "./utils.js";

let periodoAtual = "7";

function intervalo(periodo) {
  const hoje = hojeStr();
  if (periodo === "mes") {
    const d = lerData(hoje);
    return [fmtData(new Date(d.getFullYear(), d.getMonth(), 1)), fmtData(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  }
  const dias = Number(periodo);
  return [somarDias(hoje, -(dias - 1)), hoje];
}

const CORES = { alta: "#f43f5e", media: "#f59e0b", baixa: "#14b8a6" };
const NOMES = { alta: "Alta", media: "Média", baixa: "Baixa" };

function kpi(rotulo, valor, detalhe, icon, cor) {
  return `<article class="card stat"><div class="stat-top">${rotulo}<span class="stat-ico ${cor}">${icone(icon)}</span></div>
    <strong>${valor}</strong><p>${detalhe}</p></article>`;
}

function grafico(dias) {
  const maximo = Math.max(1, ...dias.map((d) => d.minutos));
  const hoje = hojeStr();
  const poucos = dias.length <= 7;
  return dias.map((d, i) => {
    const alturaPlan = (d.minutos / maximo) * 100;
    const alturaFeito = d.minutos ? (d.minutos_concluidos / d.minutos) * 100 : 0;
    const numero = lerData(d.data).getDate();
    const rotulo = poucos ? diaSemanaCurto(d.data) : (i === 0 || numero % 5 === 0 ? numero : "");
    const dica = `${diaSemanaCurto(d.data)}, ${dataCurta(d.data)}: ${d.concluidas} de ${d.total} concluídas · ${fmtDuracao(d.minutos_concluidos)} de ${fmtDuracao(d.minutos)}`;
    return `<div class="col${d.data === hoje ? " hoje" : ""}" title="${dica}">
      <div class="col-barra"><div class="col-plan" style="height:${alturaPlan}%"><div class="col-feito" style="height:${alturaFeito}%"></div></div></div>
      <span class="col-rot">${rotulo}</span></div>`;
  }).join("");
}

function donut(p) {
  const total = Object.values(p).reduce((s, x) => s + x.total, 0);
  if (!total) return { fundo: "var(--line)", total };
  let acumulado = 0;
  const partes = ["alta", "media", "baixa"].map((k) => {
    const ini = acumulado;
    acumulado += (p[k].total / total) * 100;
    return `${CORES[k]} ${ini}% ${acumulado}%`;
  });
  return { fundo: `conic-gradient(${partes.join(", ")})`, total };
}

function insight(r) {
  if (!r.total) return ["Sem dados ainda", "Ainda não há atividades neste período. Que tal planejar o seu dia?"];
  if (r.taxa_conclusao >= 80) return ["Ritmo excelente!", `Você concluiu ${r.taxa_conclusao}% das atividades. Continue assim!`];
  if (r.taxa_conclusao >= 50) return ["Bom caminho", `${r.concluidas} de ${r.total} atividades concluídas. Faltam ${r.pendentes} para fechar o período.`];
  return ["Dica para ganhar fôlego", `Só ${r.taxa_conclusao}% foi concluído. Tente planejar menos atividades por dia e priorizar as mais importantes.`];
}

export function telaResumo(view) {
  view.innerHTML = `
    <header class="view-head">
      <div>
        <p class="eyebrow">Seu progresso</p>
        <h1>Resumo do <span class="grad-text">período.</span></h1>
        <p class="subtitulo" id="faixa"></p>
      </div>
      <div class="seg" id="periodo" role="group" aria-label="Período">
        <button type="button" data-p="7">7 dias</button>
        <button type="button" data-p="30">30 dias</button>
        <button type="button" data-p="mes">Este mês</button>
      </div>
    </header>
    <div id="conteudo"></div>`;

  async function recarregar() {
    view.querySelectorAll("#periodo button").forEach((b) => b.classList.toggle("ativo", b.dataset.p === periodoAtual));
    const [ini, fim] = intervalo(periodoAtual);
    $("#faixa").textContent = `${dataCurta(ini)} a ${dataCurta(fim)}`;
    let r;
    try {
      r = await buscarResumo(ini, fim);
    } catch (e) {
      avisar(e.message, true);
      return;
    }
    if (!$("#conteudo")) return; // usuário saiu da tela
    const d = donut(r.por_prioridade);
    const [tituloIns, textoIns] = insight(r);
    $("#conteudo").innerHTML = `
      <section class="kpis">
        ${kpi("Concluídas", `${r.concluidas}<small class="muted" style="font-size:16px"> / ${r.total}</small>`, "Atividades finalizadas", "check", "verde")}
        ${kpi("Taxa de conclusão", `${r.taxa_conclusao}%`, "Do que foi planejado", "target", "roxo")}
        ${kpi("Tempo concluído", fmtDuracao(r.minutos_concluidos), `de ${fmtDuracao(r.minutos_planejados)} planejadas`, "clock", "azul")}
        ${kpi("Dias perfeitos", r.dias_perfeitos, "Dias com tudo concluído", "star", "ambar")}
      </section>
      <div class="resumo-grid">
        <section class="card">
          <div class="card-title"><h2>Tempo por dia</h2>
            <div class="legenda"><span><i style="background:color-mix(in srgb,var(--primary) 30%,transparent)"></i>Planejado</span><span><i style="background:var(--grad)"></i>Concluído</span></div>
          </div>
          <div class="grafico" role="img" aria-label="Gráfico de tempo planejado e concluído por dia">${grafico(r.por_dia)}</div>
        </section>
        <section class="card">
          <div class="card-title"><h2>Por prioridade</h2></div>
          <div class="donut-wrap">
            <div class="donut" style="background:${d.fundo}" role="img" aria-label="Distribuição por prioridade"><span>${d.total}</span></div>
            <div class="prio-lista">
              ${["alta", "media", "baixa"].map((k) => `<div class="prio-lin"><i style="background:${CORES[k]}"></i><span>${NOMES[k]}</span>
                <span>${r.por_prioridade[k].concluidas}/${r.por_prioridade[k].total} concluídas</span></div>`).join("")}
            </div>
          </div>
        </section>
      </div>
      <section class="card insight"><span class="stat-ico roxo">${icone("spark")}</span>
        <div><strong>${tituloIns}</strong><p class="muted">${textoIns}</p></div></section>`;
  }

  $("#periodo").addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-p]");
    if (!b) return;
    periodoAtual = b.dataset.p;
    recarregar();
  });

  recarregar();
  return { recarregar };
}
