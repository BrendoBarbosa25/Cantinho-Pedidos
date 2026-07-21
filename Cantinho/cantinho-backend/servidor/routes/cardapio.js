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


  if (!nome || !preco || !categoria) { //verifica se o nome, preco e categoria foram enviados
                                      // Se algum deles não for enviado retorna erro
    return res.status(400).json({ //erro 400: bad request 
      erro: "nome, preco e categoria são obrigatórios",
    });
  }

  if (Number(preco) <= 0) { //verifica se o preço é maior que zero. Se não for, retorna erro. NUMBER É UMA FUNÇÃO QUE CONVERTE O VALOR PARA NÚMERO (SE NÃO FOR NÚMERO, RETORNA NaN)
    return res.status(400).json({ //erro 400: bad request
      erro: "preço deve ser maior que zero",
    });
  }

  try {
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
                                    //(melhor do que consultar o banco e fechar a conexão toda vez que alguém fizer a req)
                                    //await manda o código ESPERAR a resposta para progredir
      `INSERT INTO itens_cardapio (nome, preco, categoria) 
       VALUES ($1, $2, $3)     
       RETURNING *`,
      [nome, preco, categoria], //array com os valores que serão passados para a query e serao substituidos no lugar dos placeholders $1, $2 e $3
    );

    res.status(201).json(result.rows[0]); //status 201 significa que a requisição foi bem sucedida e que um novo recurso foi criado
  } catch (err) {
    res.status(500).json({ erro: err.message }); //Se der qualquer erro no processo, avisa que o servidor falhou status 500
    // erro 500: Internal Server Error
  }
});

router.put("/:id", auth, authorize("admin", "cozinha"), async (req, res) => { //rota tipo PUT: Usado quando queremos atualizar dados existentes, e não apenas enviar novos dados
  const { id } = req.params; //extrai o id do item do cardapio que será atualizado da URL da requisição (params)
  const { nome, preco, categoria } = req.body; //extrai as informações enviadas pelo usuário que estão dentro do corpo da requisição (body)
 
  if (!nome || !preco || !categoria) { //verifica se o nome, preco e categoria foram enviados
    return res.status(400).json({ //erro 400: bad request
      erro: "nome, preco e categoria são obrigatórios", //Se algum deles não for enviado retorna erro
    });
  }

  try {
    const result = await pool.query(
      `UPDATE itens_cardapio
       SET nome = $1, preco = $2, categoria = $3
       WHERE id = $4
       RETURNING *`,
      [nome, preco, categoria, id], //array com os valores que serão passados para a query e serao substituidos no lugar dos placeholders $1, $2, $3 e $4
    ); 

    if (result.rows.length === 0) { //verifica se o item do cardapio existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({ erro: "item do cardápio não encontrado" }); 
    }

    res.json(result.rows[0]); //retorna o item do cardapio atualizado em formato JSON
  } catch (err) { //se der algum erro
    res.status(500).json({ erro: err.message });
  }
});

router.delete("/:id", auth, authorize("admin", "cozinha"), async (req, res) => { //rota tipo DELETE: Usado quando queremos deletar dados existentes
  const { id } = req.params; //extrai o id do item do cardapio que será deletado da URL da requisição (params)

  try {
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
                                    //(melhor do que consultar o banco e fechar a conexão toda vez que alguém fizer a req)
                                    //await manda o código ESPERAR a resposta para progredir
      "DELETE FROM itens_cardapio WHERE id = $1 RETURNING *", 
      [id],
    ); //array com os valores que serão passados para a query e serao substituidos no lugar do placeholder $1

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "item do cardápio não encontrado" }); 
    }

    res.json({ mensagem: "item removido com sucesso" }); 
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

module.exports = router; //exporta o router para que possa ser usado em outros arquivos do projeto
 