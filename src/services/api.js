// services/api.js
import { getToken, limparSessao } from './auth';

// Troque pelo IP local (enquanto testando na mesma rede) ou
// pela URL do Render quando o backend estiver hospedado.
const BASE_URL = 'https://cantinho-pedidos.onrender.com';
// ---------------------------------------------------------------
// Função central — toda chamada passa por aqui.
// Anexa o token automaticamente e trata erros de forma padronizada.
// ---------------------------------------------------------------
async function apiFetch(caminho, opcoes = {}) { //faz a chamada http anexando o token 
                                                //api fetch significs requisições HTTP para servidores externos de forma assincrona
                                                //assincrona significa que pode ser executada em segundo plano sem travar o sistema
  const token = await getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(opcoes.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`; //Bearer é o tipo de autenticação que indica quem possui o token ("o portador") tem autorização de acesso
  }

  const response = await fetch(`${BASE_URL}${caminho}`, { 
    ...opcoes,
    headers,
  });

  if (response.status === 401) { //se der o erro 401 (nao autorizado)
    await limparSessao(); //limpa a sessão 
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

//login
export async function login(nome_usuario, senha) { //o javascript preenche o nome_usuario, senha pela ordem.                                             
  // login não usa apiFetch porque ainda não existe token nesse momento.
  const response = await fetch(`${BASE_URL}/login`, {    //fetch significa trazer, nesse caso ele fala tipo "vá até o url/login e busca a reposta de lá"
    method: 'POST',                                      
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome_usuario, senha }),  //isso aqui n depende da ordem, o que depende é lá em cima no login(nome_usuario, senha)
  });                                              

  const corpo = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(corpo.erro || 'usuário ou senha inválidos');
  }

  return corpo; // { mensagem, token, usuario: { id, nome_usuario, role } }
}


// Mesas
export function listarMesas() { // retorna a lista com todas as mesas
  return apiFetch('/mesas');
}

export function atualizarStatusMesa(mesaId, status) {  
  return apiFetch(`/mesas/${mesaId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}


// Comandas
export function listarComandas() {
  return apiFetch('/comandas');
}

export function buscarComanda(comandaId) {
  return apiFetch(`/comandas/${comandaId}`);
}

export function abrirComanda(mesaId) { //cria uma comanda
  return apiFetch('/comandas', { 
    method: 'POST', //metodo post
    body: JSON.stringify({ mesa_id: mesaId }),
  });
}

export function fecharComanda(comandaId) {
  return apiFetch(`/comandas/${comandaId}/fechar`, { //fecha a comanda
    method: 'PATCH',
  });
}


// Pedidos (rodadas dentro de uma comanda)
export function criarPedido(comandaId) {
  return apiFetch('/pedidos', { //cria pedidos dentro da comanda
    method: 'POST',
    body: JSON.stringify({ comanda_id: comandaId }),
  });
}

export function listarPedidosDaComanda(comandaId) {
  return apiFetch(`/pedidos/comanda/${comandaId}`); //aparece os pedidos da comanda
}

export function atualizarStatusPedido(pedidoId, status) {
  return apiFetch(`/pedidos/${pedidoId}/status`, { //mudança no status do pedido
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

// Itens do pedido
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


// Cardápio
export function listarCardapio() {
  return apiFetch('/cardapio'); //cardapio
}

// Usuários (admin)
export function criarUsuario(nome_usuario, senha, role) { 
  return apiFetch('/usuarios', {  
    method: 'POST', //cria novo usuario, metodo post
    body: JSON.stringify({ nome_usuario, senha, role }), //body da requisição
  });
}


// Relatórios (admin)
export function buscarFaturamento(inicio, fim) {
  const params = new URLSearchParams(); //urlSeacrh... é usada para criar, ler e modificar os parametros de busca 
  if (inicio) params.append('inicio', inicio);
  if (fim) params.append('fim', fim);
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/relatorios/faturamento${query}`);
}

export function listarUsuarios() {
  return apiFetch('/usuarios');
}
