const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Criar um item em um pedido
router.post("/", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo post (usadas pra criar dados)
  const { pedido_id, item_cardapio_id, quantidade, observacao } = req.body; //extrai as informações enviadas pelo usuário que estão dentro do corpo da requisição (body)
 
  if (!pedido_id || !item_cardapio_id || quantidade === undefined) { //verifica se o pedido_id, item_cardapio_id e quantidade foram enviados. Se algum deles não for enviado retorna erro
    return res.status(400).json({ //erro 400: bad request
      erro: "pedido_id, item_cardapio_id e quantidade são obrigatórios",
    });
  }

  if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) { //isInteger verifica se o valor é um número inteiro
    return res.status(400).json({
      erro: "quantidade deve ser um número inteiro maior que zero",
    });
  }

  try {
    // Verifica se o pedido existe
    const pedido = await pool.query( 
      "SELECT id FROM pedidos WHERE id = $1",
      [pedido_id] //array com os valores que serão passados para a query e serao substituidos no lugar do placeholder $1
    );

    if (pedido.rows.length === 0) { //verifica se o pedido existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({ //erro 404: not found
        erro: "pedido não encontrado",
      });
    }

    // Verifica se o item do cardápio existe
    const item = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
      "SELECT id FROM itens_cardapio WHERE id = $1",
      [item_cardapio_id]
    );

    if (item.rows.length === 0) { //verifica se o item do cardapio existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({
        erro: "item do cardápio não encontrado",
      });
    }

    const result = await pool.query( 
      `INSERT INTO itens_pedido
      (pedido_id, item_cardapio_id, quantidade, observacao)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [
        pedido_id,
        item_cardapio_id,
        quantidade,
        observacao || null,
      ]
    ); //array com os valores que serão passados para a query e serao substituidos no lugar dos placeholders $1, $2, $3 e $4

    res.status(201).json(result.rows[0]); //status 201 significa que a requisição foi bem sucedida e que um novo recurso foi criado. Retorna o item do pedido criado em formato JSON

  } catch (err) { 
    res.status(500).json({
      erro: "não foi possível adicionar o item ao pedido",
      detalhe: err.message,
    });
  }
});

// Listar todos os itens de um pedido
router.get("/:pedido_id", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => { //rota do tipo get (usadas pra buscar dados)
  const { pedido_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
          ip.id,
          ip.quantidade,
          ip.observacao,
          c.id AS item_cardapio_id,
          c.nome,
          c.preco
       FROM itens_pedido ip
       JOIN itens_cardapio c
       ON c.id = ip.item_cardapio_id
       WHERE ip.pedido_id = $1
       ORDER BY ip.id`,
      [pedido_id]
    ); 

    res.json(result.rows); //retorna os itens do pedido em formato JSON

  } catch (err) { //se der erro, retorna status 500 (Internal Server Error)
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Remover um item do pedido
router.delete("/:id", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo delete (usadas pra deletar dados)
  const { id } = req.params; //extrai o id do item do pedido

  try {
    const result = await pool.query( 
      "DELETE FROM itens_pedido WHERE id = $1 RETURNING *",
      [id] //apaga do item_pediddo quando o id for igual $1 (id do item do pedido que será deletado)
    );

    if (result.rows.length === 0) { //verifica se o item do pedido existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({ //erro 404: not found
        erro: "item do pedido não encontrado",
      });
    }

    res.json({ //se deu certo, retorna a mensagem de sucesso
      mensagem: "item removido do pedido com sucesso",
    });

  } catch (err) { 
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Calcular o total de um pedido
router.get("/total/:pedido_id", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo get (usadas pra buscar dados)
  const { pedido_id } = req.params; //extrai o id do pedido

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(ip.quantidade * c.preco), 0) AS total
       FROM itens_pedido ip
       JOIN itens_cardapio c
       ON c.id = ip.item_cardapio_id
       WHERE ip.pedido_id = $1`,
      [pedido_id]
    );

    res.json({
      pedido_id: Number(pedido_id),
      total: result.rows[0].total,
    });

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router; //exporta o router para que possa ser usado em outros arquivos do projeto