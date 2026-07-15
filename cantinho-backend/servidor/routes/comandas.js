const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Lista todas as comandas abertas
// ALTERADO: agora faz JOIN com mesas e retorna também "numero_mesa" —
// necessário para a tela da Cozinha (que não tem permissão de acessar
// GET /mesas) e para a tela do Garçom identificar qual mesa tem pedido pronto.
router.get("/", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, m.numero AS numero_mesa
       FROM comandas c
       JOIN mesas m ON m.id = c.mesa_id
       WHERE c.status = 'aberta'
       ORDER BY c.data_abertura`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

// Busca uma comanda específica junto com seus pedidos e itens
router.get("/:id", auth, authorize("admin", "garcom"), async (req, res) => {
  const { id } = req.params;

  try {
    const comandaResult = await pool.query(
      "SELECT * FROM comandas WHERE id = $1",
      [id]
    );

    if (comandaResult.rows.length === 0) {
      return res.status(404).json({
        erro: "comanda não encontrada",
      });
    }

    const itensResult = await pool.query(
      `SELECT
          p.id AS pedido_id,
          p.status AS status_pedido,
          p.criado_em,
          ip.id AS item_pedido_id,
          ip.quantidade,
          ip.observacao,
          c.id AS item_cardapio_id,
          c.nome,
          c.preco,
          c.categoria,
          ip.quantidade * c.preco AS subtotal
      FROM pedidos p
      JOIN itens_pedido ip
          ON ip.pedido_id = p.id
      JOIN itens_cardapio c
          ON c.id = ip.item_cardapio_id
      WHERE p.comanda_id = $1
      ORDER BY p.criado_em, ip.id`,
      [id]
    );

    res.json({
      comanda: comandaResult.rows[0],
      itens: itensResult.rows,
    });

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Cria uma nova comanda
router.post("/", auth, authorize("admin", "garcom"), async (req, res) => {
  const { mesa_id } = req.body;

  if (!mesa_id) {
    return res.status(400).json({
      erro: "mesa_id é obrigatório",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO comandas (mesa_id)
      VALUES ($1)
      RETURNING *`,
      [mesa_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    res.status(400).json({
      erro: "já existe uma comanda aberta nessa mesa",
      detalhe: err.message,
    });
  }
});

// Fecha uma comanda
router.patch("/:id/fechar", auth, authorize("admin", "garcom"), async (req, res) => {
  const { id } = req.params;

  try {

    // Verifica se a comanda existe
    const comanda = await pool.query(
      "SELECT id FROM comandas WHERE id = $1",
      [id]
    );

    if (comanda.rows.length === 0) {
      return res.status(404).json({
        erro: "comanda não encontrada",
      });
    }

    // Calcula o total da comanda passando pelos pedidos
    const totalResult = await pool.query(
      `SELECT COALESCE(SUM(ip.quantidade * c.preco),0) AS total
      FROM pedidos p
      JOIN itens_pedido ip
          ON ip.pedido_id = p.id
      JOIN itens_cardapio c
          ON c.id = ip.item_cardapio_id
      WHERE p.comanda_id = $1`,
      [id]
    );

    const total = totalResult.rows[0].total;
    const result = await pool.query(
      `UPDATE comandas
      SET
          status = 'fechada',
          valor_total = $1
      WHERE id = $2
      RETURNING *`,
      [total, id]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router;