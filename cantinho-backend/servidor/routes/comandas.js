const express = require("express");
const router = express.Router();
const pool = require("../db");

// Get principal, pega somente comandas abertas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM comandas WHERE status = 'aberta' ORDER BY data_abertura",
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Get especifico, pega uma comanda só
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const comandaResult = await pool.query(
      "SELECT * FROM comandas WHERE id = $1",
      [id],
    );

    if (comandaResult.rows.length === 0) {
      return res.status(404).json({ erro: "comanda não encontrada" });
    }

    const itensResult = await pool.query(
      `SELECT
         ic.id,
         ic.quantidade,
         ic.observacao,
         c.nome,
         c.preco,
         c.categoria,
         ic.quantidade * c.preco AS subtotal
       FROM itens_comanda ic
       JOIN itens_cardapio c ON c.id = ic.item_cardapio_id
       WHERE ic.comanda_id = $1
       ORDER BY ic.id`,
      [id],
    );

    res.json({
      comanda: comandaResult.rows[0],
      itens: itensResult.rows,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Postizinho básico
router.post("/", async (req, res) => {
  const { numero_mesa } = req.body;

  if (!numero_mesa) {
    return res.status(400).json({ erro: "numero_mesa é obrigatório" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO comandas (numero_mesa) VALUES ($1) RETURNING *",
      [numero_mesa],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({
      erro: "já existe uma comanda aberta nessa mesa",
    });
  }
});

router.patch("/:id/fechar", async (req, res) => {
  const { id } = req.params;

  try {
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(ic.quantidade * c.preco), 0) AS total
       FROM itens_comanda ic
       JOIN itens_cardapio c ON c.id = ic.item_cardapio_id
       WHERE ic.comanda_id = $1`,
      [id],
    );

    const total = totalResult.rows[0].total;

    const result = await pool.query(
      `UPDATE comandas
       SET status = 'fechada', valor_total = $1
       WHERE id = $2
       RETURNING *`,
      [total, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "comanda não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
