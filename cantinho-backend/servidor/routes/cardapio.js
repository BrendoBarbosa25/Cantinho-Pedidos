const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

router.get("/", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM itens_cardapio ORDER BY categoria, nome",
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.post("/", auth, authorize("admin", "cozinha"), async (req, res) => {
  const { nome, preco, categoria } = req.body;

  if (!nome || !preco || !categoria) {
    return res.status(400).json({
      erro: "nome, preco e categoria são obrigatórios",
    });
  }

  if (Number(preco) <= 0) {
    return res.status(400).json({
      erro: "preço deve ser maior que zero",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO itens_cardapio (nome, preco, categoria)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [nome, preco, categoria],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.put("/:id", auth, authorize("admin", "cozinha"), async (req, res) => {
  const { id } = req.params;
  const { nome, preco, categoria } = req.body;

  if (!nome || !preco || !categoria) {
    return res.status(400).json({
      erro: "nome, preco e categoria são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE itens_cardapio
       SET nome = $1, preco = $2, categoria = $3
       WHERE id = $4
       RETURNING *`,
      [nome, preco, categoria, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "item do cardápio não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

router.delete("/:id", auth, authorize("admin", "cozinha"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM itens_cardapio WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "item do cardápio não encontrado" });
    }

    res.json({ mensagem: "item removido com sucesso" });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;
