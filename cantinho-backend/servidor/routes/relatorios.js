const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const relatoriosRoutes = require("./routes/relatorios");
app.use("/relatorios", relatoriosRoutes);

// Faturamento por período — soma o valor_total das comandas fechadas
// agrupado por dia. Se não vier inicio/fim, usa os últimos 7 dias.
router.get("/faturamento", auth, authorize("admin"), async (req, res) => {
  let { inicio, fim } = req.query;

  if (!fim) {
    fim = new Date().toISOString().slice(0, 10); // hoje (YYYY-MM-DD)
  }
  if (!inicio) {
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    inicio = seteDiasAtras.toISOString().slice(0, 10);
  }

  try {
    const porDia = await pool.query(
      `SELECT
          DATE(data_abertura) AS dia,
          COUNT(*) AS comandas,
          COALESCE(SUM(valor_total), 0) AS total
       FROM comandas
       WHERE status = 'fechada'
         AND DATE(data_abertura) BETWEEN $1 AND $2
       GROUP BY DATE(data_abertura)
       ORDER BY dia`,
      [inicio, fim]
    );

    const totalGeral = porDia.rows.reduce(
      (soma, linha) => soma + Number(linha.total),
      0
    );

    res.json({
      periodo: { inicio, fim },
      totalGeral,
      totalComandas: porDia.rows.reduce((s, l) => s + Number(l.comandas), 0),
      porDia: porDia.rows,
    });
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;