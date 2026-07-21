const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const SALT_ROUNDS = 10;

// Criar usuário
router.post("/", auth, authorize("admin"), async (req, res) => { //rota do tipo post (usadas pra criar dados)
  const { nome_usuario, senha, role } = req.body; //extrai o nome_usuario, senha e role do corpo da requisição (body)

  if (!nome_usuario || !senha) { //verifica se o nome_usuario e senha foram enviados. Se algum deles não for enviado retorna erro
    return res.status(400).json({  //erro 400: bad request
      erro: "nome_usuario e senha são obrigatórios",
    });
  }

  try {
    // Verifica se já existe um usuário com esse nome
    const usuarioExistente = await pool.query(
      "SELECT id FROM usuarios WHERE nome_usuario = $1",
      [nome_usuario]
    );

    if (usuarioExistente.rows.length > 0) { //verifica se o usuário já existe se existir  o retorna erro 409 (conflict)
      return res.status(409).json({ //erro 409: conflito 
        erro: "nome de usuário já cadastrado", 
      });
    }

    // Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS); //bcrypt.hash gera o hash da senha com o número de rounds definido em SALT_ROUNDS (10). 
                                                            //saltrounds define o custo de processamento que o bcrypt usará para criptografar a senha

    // Cria o usuário
    const result = await pool.query(  //faz a consulta no DB, pool significa que o ponto de conexão fica sempre ligado, apenas esperando a requisição para dar a reposta
      `INSERT INTO usuarios
      (nome_usuario, senha_hash, role)
      VALUES ($1, $2, COALESCE($3, 'garcom'))
      RETURNING id, nome_usuario, role, criado_em`,
      [nome_usuario, senhaHash, role]  //coalesce é uma função do SQL que retorna o primeiro valor não nulo da lista de argumentos, se nao for nulo é definido como garcom 
    );

    res.status(201).json(result.rows[0]); //status 201 significa que a requisição foi bem sucedida e que um novo recurso foi criado. Retorna o usuário criado em formato JSON
  } catch (err) { 
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Listar usuários
router.get("/", auth, authorize("admin"), async (req, res) => { //rota do tipo get (usadas pra buscar dados). auth é autenticação (verifica o usuario pelo token jwt)
  try {
    const result = await pool.query( 
      `SELECT
        id,
        nome_usuario,
        role,
        criado_em
      FROM usuarios
      ORDER BY id`
    );

    res.json(result.rows); //retorna a lista de usuários em formato JSON
  } catch (err) { //se der algum erro
    res.status(500).json({ // erro 500: Internal Server Error 
      erro: err.message,
    });
  }
});

// Buscar usuário por id
router.get("/:id", auth, authorize("admin"), async (req, res) => { //rota do tipo get (usadas pra buscar dados)
  const { id } = req.params; 

  try {
    const result = await pool.query( //faz a consulta no DB, pool significa que o ponto de conexão fica sempre ligado, apenas esperando a requisição para dar a reposta
      `SELECT
        id,
        nome_usuario,
        role,
        criado_em
      FROM usuarios
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) { //verifica se o usuário existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json(result.rows[0]); //retorna o usuário encontrado 
  } catch (err) { 
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Atualizar role
router.patch("/:id/role", auth, authorize("admin"), async (req, res) => { //rota do tipo patch (usadas pra atualizar dados existentes). auth é autenticação (verifica o usuario pelo token jwt)
                                                                          // authorize verifica oq o usuario pode fazer (nesse caso o role admin pode)
  const { id } = req.params;  
  const { role } = req.body;

  if (!role) { //verifica se o role foi enviado, se não for enviado retorna erro 400 (bad request)
    return res.status(400).json({
      erro: "role é obrigatória",
    });
  }

  try {
    const result = await pool.query( 
      `UPDATE usuarios
      SET role = $1
      WHERE id = $2
      RETURNING id, nome_usuario, role, criado_em`,
      [role, id] //array com os valores que serão passados para a query e serao substituidos no lugar dos placeholders $1 e $2
    );

    if (result.rows.length === 0) { //verifica se o usuário existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json(result.rows[0]); //se o usuário for encontrado, retorna o usuário atualizado 
  } catch (err) {
    res.status(500).json({ //Se der qualquer erro no processo, avisa que o servidor falhou status 500
      erro: err.message,
    });
  }
});

// Excluir usuário
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) { //verifica se o usuário existe se nao existir  o retorna erro 404 (not found)
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json({ //se o usuário for encontrado, retorna a mensagem de sucesso
      mensagem: "usuário removido com sucesso",
    });
  } catch (err) { 
    res.status(500 ).json({
      erro: err.message,
    });
  }
}); 

module.exports = router; //exporta o router para que possa ser usado em outros arquivos do projeto