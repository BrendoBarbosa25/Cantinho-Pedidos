// services/api.js

// Troque para false quando o backend do Vitor estiver rodando e acessível
const USAR_MOCK = true;

const BASE_URL = 'http://IP_DO_VITOR:3000';

// ---------------------------------------------------------------
// DADOS FALSOS — simulam o que o backend vai retornar depois.
// Ficam em memória (o array é recriado toda vez que o app reinicia),
// então dá pra testar abrir/fechar comanda e adicionar/remover item
// como se fosse de verdade, só que sem persistir de fato.
// ---------------------------------------------------------------

let mockComandas = [
  { id: 1, numero_mesa: 3, status: 'aberta', data_abertura: new Date().toISOString(), valor_total: 0 },
];

let mockCardapio = [
  { id: 1, nome: 'Coxinha', preco: 8.5, categoria: 'entrada' },
  { id: 2, nome: 'Feijoada', preco: 32.0, categoria: 'prato' },
  { id: 3, nome: 'Refrigerante', preco: 6.0, categoria: 'bebida' },
  { id: 4, nome: 'Pudim', preco: 10.0, categoria: 'sobremesa' },
];

let mockItensComanda = [
  { id: 1, comanda_id: 1, item_cardapio_id: 1, nome_item: 'Coxinha', quantidade: 2, preco: 8.5, observacao: null },
];

let proximoIdComanda = 2;
let proximoIdItem = 2;

// Simula o atraso de rede (200ms) — importante pra você testar de verdade
// o estado de "carregando" nas telas, não só o resultado final instantâneo
function atraso(valor) {
  return new Promise((resolve) => setTimeout(() => resolve(valor), 200));
}

// ---------------------------------------------------------------
// Tratamento de resposta real (usado só quando USAR_MOCK = false)
// ---------------------------------------------------------------
async function tratarResposta(response) {
  if (!response.ok) {
    const corpo = await response.json().catch(() => ({}));
    throw new Error(corpo.erro || 'Erro na requisição');
  }
  return response.json();
}

// ---------------------------------------------------------------
// Funcionalidade 3: listar comandas
// ---------------------------------------------------------------
export async function listarComandas() {
  if (USAR_MOCK) {
    return atraso([...mockComandas]); // devolve uma cópia, nunca a referência direta
  }
  const response = await fetch(`${BASE_URL}/comandas`);
  return tratarResposta(response);
}

// ---------------------------------------------------------------
// Funcionalidade 1: abrir comanda
// ---------------------------------------------------------------
export async function abrirComanda(numeroMesa) {
  if (USAR_MOCK) {
    // Simula a regra do índice único (seção 4.1 do mob):
    // não deixa abrir duas comandas na mesma mesa
    const jaAberta = mockComandas.find((c) => c.numero_mesa === numeroMesa && c.status === 'aberta');
    if (jaAberta) {
      return Promise.reject(new Error('já existe uma comanda aberta nessa mesa'));
    }
    const nova = {
      id: proximoIdComanda++,
      numero_mesa: numeroMesa,
      status: 'aberta',
      data_abertura: new Date().toISOString(),
      valor_total: 0,
    };
    mockComandas.push(nova);
    return atraso(nova);
  }
  const response = await fetch(`${BASE_URL}/comandas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero_mesa: numeroMesa }),
  });
  return tratarResposta(response);
}

// ---------------------------------------------------------------
// Funcionalidade 4: fechar comanda
// ---------------------------------------------------------------
export async function fecharComanda(comandaId) {
  if (USAR_MOCK) {
    const comanda = mockComandas.find((c) => c.id === comandaId);
    if (!comanda) return Promise.reject(new Error('comanda não encontrada'));

    const itensDaComanda = mockItensComanda.filter((i) => i.comanda_id === comandaId);
    const total = itensDaComanda.reduce((soma, i) => soma + i.quantidade * i.preco, 0);

    comanda.status = 'fechada';
    comanda.valor_total = total;
    return atraso(comanda);
  }
  const response = await fetch(`${BASE_URL}/comandas/${comandaId}/fechar`, {
    method: 'PATCH',
  });
  return tratarResposta(response);
}

// ---------------------------------------------------------------
// Funcionalidade 2: itens da comanda
// ---------------------------------------------------------------
export async function listarItensDaComanda(comandaId) {
  if (USAR_MOCK) {
    return atraso(mockItensComanda.filter((i) => i.comanda_id === comandaId));
  }
  const response = await fetch(`${BASE_URL}/itens-comanda?comanda_id=${comandaId}`);
  return tratarResposta(response);
}

export async function adicionarItem(comandaId, itemCardapioId, quantidade, observacao) {
  if (USAR_MOCK) {
    const itemDoCardapio = mockCardapio.find((c) => c.id === itemCardapioId);
    const novoItem = {
      id: proximoIdItem++,
      comanda_id: comandaId,
      item_cardapio_id: itemCardapioId,
      nome_item: itemDoCardapio.nome,
      quantidade,
      preco: itemDoCardapio.preco,
      observacao,
    };
    mockItensComanda.push(novoItem);
    return atraso(novoItem);
  }
  const response = await fetch(`${BASE_URL}/itens-comanda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comanda_id: comandaId, item_cardapio_id: itemCardapioId, quantidade, observacao }),
  });
  return tratarResposta(response);
}

export async function removerItem(itemId) {
  if (USAR_MOCK) {
    mockItensComanda = mockItensComanda.filter((i) => i.id !== itemId);
    return atraso({ sucesso: true });
  }
  const response = await fetch(`${BASE_URL}/itens-comanda/${itemId}`, {
    method: 'DELETE',
  });
  return tratarResposta(response);
}

// ---------------------------------------------------------------
// Cardápio
// ---------------------------------------------------------------
export async function listarCardapio() {
  if (USAR_MOCK) {
    return atraso([...mockCardapio]);
  }
  const response = await fetch(`${BASE_URL}/cardapio`);
  return tratarResposta(response);
}