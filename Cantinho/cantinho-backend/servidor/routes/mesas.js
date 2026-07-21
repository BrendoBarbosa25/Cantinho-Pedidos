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
  const { numero } = req.body; //extrai o numero da mesa do corpo da requisição (body)

  if (!numero) { //se o numero não for enviado, retorna erro
    return res.status(400).json({ erro: "numero é obrigatório" });
  }

  if (isNaN(Number(numero))) { //verifica se o numero é um número válido (isNaN = is Not a Number)
  return res.status(400).json({ erro: "O número da mesa deve ser um número válido" }); //res é a resposta que o servidor vai enviar de volta para o cliente (navegador ou app)
}
 
   try {
    const result = await pool.query( //pool.query é a função que executa a query no banco de dados (nesse caso, o banco é o PostgreSQL)
      "INSERT INTO mesas (numero) VALUES ($1) RETURNING *", //$1 é um placeholder para o valor que será passado no array abaixo (numero). RETURNING * retorna a linha inserida no banco de dados
      [numero] //array com os valores que serão passados para a query (nesse caso é apenas o numero da mesa)
    );
    res.status(201).json(result.rows[0]); //status 201 significa que a requisição foi bem sucedida e que um novo recurso foi criado
  } catch (err) { //se der erro, retorna status 400 (bad request) e o motivo do erro
    res.status(400).json({ //erro 400: bad request O servidor não conseguiu processar a requisição devido a algo que é percebido como um erro do cliente)
      erro: "não foi possível criar a mesa (número já existe?)", 
      detalhe: err.message, 
    });
  }
});

// Muda o status da mesa (disponivel / reservada)
router.patch("/:id/status", auth, authorize("admin", "garcom"), async (req, res) => { //patch modifica apenas uma parte especiica
                                                                                      //nesse caso o patch modifica o status da mesa (disponivel ou reservada) (precisamos do id pra modificar a mesa certa)
  const { status } = req.body;                                                      //put modifica TUDO (nesse caso, o put modificaria o numero e o status da mesa)
  const { id } = req.params; //extrai o id da mesa dos parâmetros da requisição (params) 
  if (!["disponivel", "reservada"].includes(status)) { //includes verifica se o status enviado está dentro do array (disponivel ou reservada). Se não estiver, retorna erro
                                                       //(includes é uma funcao que verifica se um array contém um determinado elemento)
                                                       
    return res.status(400).json({ // 400 bad request 
      erro: "status deve ser 'disponivel' ou 'reservada'", 
    });
  }

  try { 
    const result = await pool.query( //pool.query é a função que executa a query no banco de dados 
      "UPDATE mesas SET status = $1 WHERE id = $2 RETURNING *", // placeholder serve para evitar SQL injection (inserção de código malicioso no banco de dados) 
      [status, id] // o $1 vai ser substituído pelo status e o $2 pelo id da mesa. POR QUE EU COLOQUEI A ARRAY AQUI, o $1 e $2 são substituídos pelos valores do array.
    ); 

    if (result.rows.length === 0) { //se não encontrou a mesa com o id informado retorna erro 404 (not found)
      return res.status(404).json({ erro: "mesa não encontrada" }); //erro 404: not found
    } 

    res.json(result.rows[0]); //se deu certo, retorna a mesa atualizada (rows[0] é a primeira linha do resultado da query)
  } catch (err) {  
    res.status(500).json({ erro: err.message }); //Se der qualquer erro no processo, avisa que o servidor falhou. status 500 
    // erro 500: resumidamente: deu um erro e eu nao sei oq é!
  }
});

module.exports = router; //exporta o router para ser usado em outros arquivos