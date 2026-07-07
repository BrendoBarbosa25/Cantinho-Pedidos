const express = require("express");
const router = express.Router();
const pool = require("../db");

// Criar um item em um pedido
router.post("/", async (req, res) => {
  const { pedido_id, item_cardapio_id, quantidade, observacao } = req.body;

  if (!pedido_id || !item_cardapio_id || quantidade === undefined) {
    return res.status(400).json({
      erro: "pedido_id, item_cardapio_id e quantidade são obrigatórios",
    });
  }

  if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
    return res.status(400).json({
      erro: "quantidade deve ser um número inteiro maior que zero",
    });
  }

  try {
    // Verifica se o pedido existe
    const pedido = await pool.query(
      "SELECT id FROM pedidos WHERE id = $1",
      [pedido_id]
    );

    if (pedido.rows.length === 0) {
      return res.status(404).json({
        erro: "pedido não encontrado",
      });
    }

    // Verifica se o item do cardápio existe
    const item = await pool.query(
      "SELECT id FROM itens_cardapio WHERE id = $1",
      [item_cardapio_id]
    );

    if (item.rows.length === 0) {
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
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      erro: "não foi possível adicionar o item ao pedido",
      detalhe: err.message,
    });
  }
});

// Listar todos os itens de um pedido
router.get("/:pedido_id", async (req, res) => {
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

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Remover um item do pedido
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM itens_pedido WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "item do pedido não encontrado",
      });
    }

    res.json({
      mensagem: "item removido do pedido com sucesso",
    });

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Calcular o total de um pedido
router.get("/total/:pedido_id", async (req, res) => {
  const { pedido_id } = req.params;

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

module.exports = router;