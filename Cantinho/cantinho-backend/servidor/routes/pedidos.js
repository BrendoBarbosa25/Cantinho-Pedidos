const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Criar um novo pedido
router.post("/", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo post (usadas pra criar dados)
  const { comanda_id } = req.body; //extrai o comanda_id do corpo da requisição (body)

  if (!comanda_id) {
    return res.status(400).json({  //erro 400: bad request
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

    res.status(201).json(result.rows[0]); //status 201 significa que a requisição foi bem sucedida e que um novo recurso foi criado 
  } catch (err) {  // se der erro
    res.status(400).json({ //erro 400: bad request
      erro: "não foi possível criar o pedido",
      detalhe: err.message, 
    });
  }
});

// Listar todos os pedidos de uma comanda
router.get("/comanda/:comanda_id", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => { //rota do tipo get (usadas pra buscar dados)
  const { comanda_id } = req.params;

  try { 
    const result = await pool.query(
      `SELECT *
       FROM pedidos
       WHERE comanda_id = $1
       ORDER BY criado_em`,
      [comanda_id]
    ); //esse result é o resltado da consulta ao DB (nesse caso retorna o dados de uma comanda especifca )

    res.json(result.rows); //bota o result da query 
  } catch (err) {
    res.status(500).json({ //erro 500 erro interno do server
      erro: err.message,
    });
  }
});

// Buscar um pedido específico
router.get("/:id", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => { //rota tipo get (usada pra recever dados)
  const { id } = req.params; 

  try {
    const result = await pool.query( //
      `SELECT *
       FROM pedidos
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) { // se nao tiver linhas no result significa que o pedido nao existe entao é erro 404(nao encontrado)
      return res.status(404).json({ 
        erro: "pedido não encontrado",
      }); 
    }

    res.json(result.rows[0]); // se o pedido existir, retorna o resultado
  } catch (err) { 
    res.status(500).json({ //se der qualquer erro, avisa que o servidor falhou
      erro: err.message,
    });
  }
});

// Atualizar status do pedido
router.patch("/:id/status", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => { // rota patch usada p atuaizar parcialmente a informacao, diferente do put que atualiza tudo
  const { id } = req.params;
  const { status } = req.body;

  if (!status) { //se o status nao for enviado retorna o erro 400 Badrequest
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

    if (result.rows.length === 0) { //se nao tiver linhas no result significa que o pedido nao existe (erro 404)
      return res.status(404).json({ 
        erro: "pedido não encontrado",
      });
    }

    res.json(result.rows[0]); //retorna o pedido atualizado 
  } catch (err) { 
    res.status(500).json({ 
      erro: err.message,
    });
  }
});

// Excluir um pedido
router.delete("/:id", auth, authorize("admin"), async (req, res) => { //rota do tipo delete (usadas pra deletar dados)
  const { id } = req.params; 

  try { 
    const result = await pool.query(
      `DELETE FROM pedidos
       WHERE id = $1
       RETURNING *`,
      [id]
    ); //array com os valores que serão passados para a query e serao substituidos no lugar do placeholder $1
 
    if (result.rows.length === 0) { //verifica se o pedido existe se nao existir retorna o erro 404
      return res.status(404).json({
        erro: "pedido não encontrado",
      });
    }

    res.json({ //retorna a mensagem de sucesso
      mensagem: "pedido removido com sucesso",
    });
  } catch (err) {
    res.status(500).json({ 
      erro: err.message,
    });
  }
});

module.exports = router; //exporta o router para que possa ser usado em outros arquivos do projeto