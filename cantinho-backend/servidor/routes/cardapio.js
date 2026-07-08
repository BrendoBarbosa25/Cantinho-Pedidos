const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
// (req= requisição. res = resposta)
router.get("/", auth, authorize("admin", "garcom", "cozinha"), async (req, res) => {  //rota do tipo get (usadas pra buscar dados)
  try {
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
                                    //(melhor do que consultar o banco e fechar a conexão toda vez que alguém fizer a req)
                                    //await manda o código ESPERAR a resposta para progredir 
      "SELECT * FROM itens_cardapio ORDER BY categoria, nome", //pega o cardapio todinho e ordena pela categoria e nome
    );

    res.json(result.rows);  //Envia as linhas de dados do banco de volta para o cliente em formato JSON
  } catch (err) { //se ser algum erro
    res.status(500).json({ erro: err.message }); //Se der qualquer erro no processo, avisa que o servidor falhou (Status 500) e mostra o motivo
    // erro 500: Internal Server Error (É uma mensagem genérica, o que significa que o servidor sabe que há um problema, mas não consegue especificar exatamente qual é a causa raiz)
  }
});

router.post("/", auth, authorize("admin", "cozinha"), async (req, res) => {  //rota tipo POST: Usado quando queremos enviar dados novos para serem salvos, e não apenas listar o que já existe
  const { nome, preco, categoria } = req.body; //extrai as informações enviadas pelo usuário que estão dentro do corpo da requisição (body)


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
