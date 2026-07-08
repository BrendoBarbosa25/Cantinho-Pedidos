const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Lista todas as mesas (com id, número e status)
router.get("/", auth, authorize("admin", "garcom"), async (req, res) => { // auth é autenticação (verifica o usuario pelo token jwt), authorize verifica oq o usuario pode fazer (nesse caso o role admin e garçon podem)
  try {                                                                   //rota get (buscar dados)
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
                                    //(melhor do que consultar o banco e fechar a conexão toda vez que alguém fizer a req)
                                    //await manda o código ESPERAR a resposta para progredir 
      "SELECT * FROM mesas ORDER BY numero" // pega todas as mesas e ordena pelo numero (1,2,3,4...)
    );
    res.json(result.rows); //se der certo ele retorna o resultado (rows significa linhas. Linhas da const tesult)
  } catch (err) { //se der erro
    res.status(500).json({ erro: err.message }); //Se der qualquer erro no processo, avisa que o servidor falhou (Status 500) e mostra o motivo
    // erro 500: Internal Server Error (É uma mensagem genérica, o que significa que o servidor sabe que há um problema, mas não consegue especificar exatamente qual é a causa raiz)
  }
});

// Cria uma mesa nova (o admin cadastra as mesas do restaurante)
router.post("/", auth, authorize("admin"), async (req, res) => { //apenas o admin é autorizado a adicionar uma nova mesa ao resta
  const { numero } = req.body;

  if (!numero) {
    return res.status(400).json({ erro: "numero é obrigatório" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO mesas (numero) VALUES ($1) RETURNING *",
      [numero]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({
      erro: "não foi possível criar a mesa (número já existe?)",
      detalhe: err.message,
    });
  }
});

// Muda o status da mesa (disponivel / reservada)
router.patch("/:id/status", auth, authorize("admin", "garcom"), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["disponivel", "reservada"].includes(status)) {
    return res.status(400).json({
      erro: "status deve ser 'disponivel' ou 'reservada'",
    });
  }

  try {
    const result = await pool.query(
      "UPDATE mesas SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "mesa não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router;