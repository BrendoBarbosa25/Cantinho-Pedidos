const express = require("express");
const router = express.Router();
const pool = require("../db");

// Rota de post, contem validações simples
router.post("/", async (req, res) => {
  const { pedido_id, item_cardapio_id, quantidade, observacao } = req.body;

  if (!pedido_id || !item_cardapio_id || !quantidade) {
    return res.status(400).json({
      erro: "comanda_id, item_cardapio_id e quantidade são obrigatórios",
    });
  }

  if (Number(quantidade) <= 0) {
    return res.status(400).json({
      erro: "quantidade deve ser maior que zero",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO itens_pedido
       (pedido_id, item_cardapio_id, quantidade, observacao)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [comanda_id, item_cardapio_id, quantidade, observacao || null],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({
      erro: "não foi possível adicionar o item à comanda",
      detalhe: err.message,
    });
  }
});

// Rota delete basica
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM itens_comanda WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "item da comanda não encontrado" });
    }

    res.json({ mensagem: "item removido da comanda com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Rota de get especifica pro total
router.get("/total/:comanda_id", async (req, res) => {
  const { comanda_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT COALESCE(SUM(ic.quantidade * c.preco), 0) AS total
       FROM itens_comanda ic
       JOIN itens_cardapio c ON c.id = ic.item_cardapio_id
       WHERE ic.comanda_id = $1`,
      [comanda_id],
    );

    res.json({
      comanda_id: Number(comanda_id),
      total: result.rows[0].total,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
