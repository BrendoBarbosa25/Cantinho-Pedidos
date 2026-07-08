const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

// Lista todas as comandas abertas
router.get("/", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => {// auth é autenticação (verifica o usuario pelo token jwt), authorize verifica oq o usuario pode fazer (nesse caso o role admin e garçon podem)
  try { 
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
      "SELECT * FROM comandas WHERE status = 'aberta' ORDER BY data_abertura"
    ); 

    res.json(result.rows); //se der certo ele retorna o resultado (rows significa linhas. Linhas da const tesult)
  } catch (err) { 
    res.status(500).json({ erro: err.message }); //swe der erro aparece o erro 500 (Internal Server Error: o servidor nao sabe oq aconteceu de errado)
  } 
});

// Busca uma comanda específica junto com seus pedidos e itens
router.get("/:id", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo get (usadas pra buscar dados)
  const { id } = req.params; //extrai o id da comanda. params é um objeto que contém os parâmetros da rota que nesse caso é o id da comanda

  try {  
    const comandaResult = await pool.query(
      "SELECT * FROM comandas WHERE id = $1",
      [id]
    ); //array com os valores que serão passados para a query e serao substituidos no lugar do placeholder $1

    if (comandaResult.rows.length === 0) { //verifica se a comanda existe se nao existir  o retorna erro 404 (not found)
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

    res.json({  // retorna a comanda e os itens do pedido em formato JSON
      comanda: comandaResult.rows[0], //retorna a comanda. Rows[0] significa que retorna apenas a primeira linha do resultado da query 
      itens: itensResult.rows, //retorna os itens do pedido. Rows significa todas as linhas do resultado da query
    });

  } catch (err) { 
    res.status(500).json({ //Se der qualquer erro no processo... 
      erro: err.message,
    });
  }
});

// Cria uma nova comanda
router.post("/", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo post (usadas pra criar dados)
  const { mesa_id } = req.body;

  if (!mesa_id) { //verifica se o mesa_id foi enviado, se não for enviado retorna erro 400 (bad request)
    return res.status(400).json({
      erro: "mesa_id é obrigatório",
    });
  }

  try {
    const result = await pool.query( //faz a consultra no DB, pool significa que o ponto de conexão fica sempre ligado, apenas esperando a requisição para dar a reposta
      `INSERT INTO comandas (mesa_id)
      VALUES ($1)
      RETURNING *`,
      [mesa_id]
    );

    res.status(201).json(result.rows[0]); //retorna a comanda criada 

  } catch (err) { 
    res.status(400).json({ //erro 400 é o bad request 
      erro: "já existe uma comanda aberta nessa mesa",
      detalhe: err.message,
    });
  }
});

// Fecha uma comanda
router.patch("/:id/fechar", auth, authorize("admin", "garcom"), async (req, res) => { //rota do tipo patch (usadas pra atualizar dados existentes). auth é autenticação (verifica o usuario pelo token jwt)
                                                                                      //authorize verifica oq o usuario pode fazer (nesse caso o role admin e garçon podem)
  const { id } = req.params;

  try {

    // Verifica se a comanda existe
    const comanda = await pool.query( // await manda o código ESPERAR a resposta para progredir
      "SELECT id FROM comandas WHERE id = $1",
      [id]
    );

    if (comanda.rows.length === 0) { //verifica se a comanda existe se nao existir  o retorna erro 404 (not found)
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

    const total = totalResult.rows[0].total; //pega o total da comanda. Rows[0] significa que retorna apenas a primeira linha do resultado da query
    const result = await pool.query(
      `UPDATE comandas
      SET
          status = 'fechada',
          valor_total = $1
      WHERE id = $2
      RETURNING *`,
      [total, id]
    );

    res.json(result.rows[0]); //retorna a comanda fechada

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router; //exporta o router para que possa ser usado em outros arquivos do projeto