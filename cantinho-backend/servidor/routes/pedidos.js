const express = require("express");
const router = express.Router();
const pool = require("../db");

// Criar um novo pedido
router.post("/", async (req, res) => {
  const { comanda_id } = req.body;

  if (!comanda_id) {
    return res.status(400).json({
      erro: "comanda_id é obrigatório",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pedidos (comanda_id)
       VALUES ($1)
       RETURNING *`,
      [comanda_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({
      erro: "não foi possível criar o pedido",
      detalhe: err.message,
    });
  }
});

// Listar todos os pedidos de uma comanda
router.get("/comanda/:comanda_id", async (req, res) => {
  const { comanda_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM pedidos
       WHERE comanda_id = $1
       ORDER BY criado_em`,
      [comanda_id]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Buscar um pedido específico
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT *
       FROM pedidos
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "pedido não encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Atualizar status do pedido
router.patch("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      erro: "status é obrigatório",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE pedidos
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "pedido não encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Excluir um pedido
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM pedidos
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "pedido não encontrado",
      });
    }

    res.json({
      mensagem: "pedido removido com sucesso",
    });
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router;