/* Comunicação com o servidor (FastAPI). */
export async function api(url, opcoes = {}) {
  let resp;
  try {
    resp = await fetch(url, { headers: { "Content-Type": "application/json" }, ...opcoes });
  } catch {
    throw new Error("Não foi possível falar com o servidor. Ele está rodando?");
  }
  if (!resp.ok) {
    let msg = `Erro ${resp.status}`;
    if (resp.status >= 500) msg = "Erro no servidor. Se usa MySQL, confira o .env e se o MySQL está ligado.";
    try {
      const j = await resp.json();
      if (typeof j.detail === "string") msg = j.detail;
      else if (Array.isArray(j.detail)) msg = j.detail.map((e) => e.msg).join("; ");
    } catch { /* resposta sem JSON */ }
    throw new Error(msg);
  }
  return resp.status === 204 ? null : resp.json();
}

const enviar = (metodo, corpo) => ({ method: metodo, ...(corpo ? { body: JSON.stringify(corpo) } : {}) });

export const Atividades = {
  listar(filtros = {}) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(filtros)) if (v) q.set(k, v);
    return api(`/api/atividades?${q}`);
  },
  criar: (dados) => api("/api/atividades", enviar("POST", dados)),
  atualizar: (id, dados) => api(`/api/atividades/${id}`, enviar("PUT", dados)),
  alternar: (id) => api(`/api/atividades/${id}/concluir`, enviar("PATCH")),
  mover: (id, data) => api(`/api/atividades/${id}/mover`, enviar("PATCH", { data })),
  excluir: (id) => api(`/api/atividades/${id}`, enviar("DELETE")),
};

export const buscarResumo = (inicio, fim) => api(`/api/resumo?inicio=${inicio}&fim=${fim}`);
