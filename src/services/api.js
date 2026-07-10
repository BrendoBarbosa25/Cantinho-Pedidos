// services/api.js
import { getToken, limparSessao } from './auth';

// Troque pelo IP local (enquanto testando na mesma rede) ou
// pela URL do Render quando o backend estiver hospedado.
const BASE_URL = 'https://cantinho-pedidos.onrender.com';
// ---------------------------------------------------------------
// Função central — toda chamada passa por aqui.
// Anexa o token automaticamente e trata erros de forma padronizada.
// ---------------------------------------------------------------
async function apiFetch(caminho, opcoes = {}) {
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(opcoes.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${caminho}`, {
    ...opcoes,
    headers,
  });

  if (response.status === 401) {
    await limparSessao();
  }

  // Antes: assumia sempre JSON e escondia o motivo real do erro.
  // Agora: se não vier JSON (ex: 404 do Express, HTML de erro do Render),
  // a gente pega o texto puro e mostra o status, pra dar pra saber a causa.
  const contentType = response.headers.get('content-type') || '';
  let corpo = {};
  if (contentType.includes('application/json')) {
    corpo = await response.json().catch(() => ({}));
  } else {
    const texto = await response.text().catch(() => '');
    corpo = { erro: texto ? texto.slice(0, 200) : null };
  }

  if (!response.ok) {
    throw new Error(corpo.erro || `erro na requisição (status ${response.status})`);
  }

  return corpo;
}

// ---------------------------------------------------------------
// Login
// ---------------------------------------------------------------
export async function login(nome_usuario, senha) {
  // login não usa apiFetch porque ainda não existe token nesse momento
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome_usuario, senha }),
  });

  const corpo = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(corpo.erro || 'usuário ou senha inválidos');
  }

  return corpo; // { mensagem, token, usuario: { id, nome_usuario, role } }
}

// ---------------------------------------------------------------
// Mesas
// ---------------------------------------------------------------
export function listarMesas() {
  return apiFetch('/mesas');
}

export function atualizarStatusMesa(mesaId, status) {
  return apiFetch(`/mesas/${mesaId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ---------------------------------------------------------------
// Comandas
// ---------------------------------------------------------------
export function listarComandas() {
  return apiFetch('/comandas');
}

export function buscarComanda(comandaId) {
  return apiFetch(`/comandas/${comandaId}`);
}

export function abrirComanda(mesaId) {
  return apiFetch('/comandas', {
    method: 'POST',
    body: JSON.stringify({ mesa_id: mesaId }),
  });
}

export function fecharComanda(comandaId) {
  return apiFetch(`/comandas/${comandaId}/fechar`, {
    method: 'PATCH',
  });
}

// ---------------------------------------------------------------
// Pedidos (rodadas dentro de uma comanda)
// ---------------------------------------------------------------
export function criarPedido(comandaId) {
  return apiFetch('/pedidos', {
    method: 'POST',
    body: JSON.stringify({ comanda_id: comandaId }),
  });
}

export function listarPedidosDaComanda(comandaId) {
  return apiFetch(`/pedidos/comanda/${comandaId}`);
}

export function atualizarStatusPedido(pedidoId, status) {
  return apiFetch(`/pedidos/${pedidoId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// pega pedidos com um status específico — usado no polling da cozinha/garçom
export async function listarPedidosPorStatus(status) {
  // não existe rota direta pra isso ainda — filtramos no app por enquanto,
  // buscando pedidos de todas as comandas abertas.
  // Se o volume crescer, vale pedir ao Vitor uma rota GET /pedidos?status=...
  const comandas = await listarComandas();
  const todosPedidos = await Promise.all(
    comandas.map((c) => listarPedidosDaComanda(c.id))
  );
  return todosPedidos.flat().filter((p) => p.status === status);
}

// ---------------------------------------------------------------
// Itens do pedido
// ---------------------------------------------------------------
export function listarItensDoPedido(pedidoId) {
  return apiFetch(`/itens-pedido/${pedidoId}`);
}

export function adicionarItem(pedidoId, itemCardapioId, quantidade, observacao) {
  return apiFetch('/itens-pedido', {
    method: 'POST',
    body: JSON.stringify({
      pedido_id: pedidoId,
      item_cardapio_id: itemCardapioId,
      quantidade,
      observacao,
    }),
  });
}

export function removerItem(itemId) {
  return apiFetch(`/itens-pedido/${itemId}`, {
    method: 'DELETE',
  });
}

export function totalDoPedido(pedidoId) {
  return apiFetch(`/itens-pedido/total/${pedidoId}`);
}

// ---------------------------------------------------------------
// Cardápio
// ---------------------------------------------------------------
export function listarCardapio() {
  return apiFetch('/cardapio');
}

// ---------------------------------------------------------------
// Usuários (admin)
// ---------------------------------------------------------------
export function criarUsuario(nome_usuario, senha, role) {
  return apiFetch('/usuarios', {
    method: 'POST',
    body: JSON.stringify({ nome_usuario, senha, role }),
  });
}

// ---------------------------------------------------------------
// Relatórios (admin)
// ---------------------------------------------------------------
export function buscarFaturamento(inicio, fim) {
  const params = new URLSearchParams();
  if (inicio) params.append('inicio', inicio);
  if (fim) params.append('fim', fim);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/relatorios/faturamento${query}`);
}

export function listarUsuarios() {
  return apiFetch('/usuarios');
}
