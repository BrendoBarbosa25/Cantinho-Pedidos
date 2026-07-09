const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../db");

// Login
router.post("/", async (req, res) => { //rota do tipo post (usadas pra criar dados)
  const { nome_usuario, senha } = req.body; //extrai o nome_usuario e senha do corpo da requisição (body)

  // Validação
  if (!nome_usuario || !senha) { // se o nome_usuario ou senha não forem enviados, retorna erro
    return res.status(400).json({ //erro 400: bad request 
      erro: "nome_usuario e senha são obrigatórios",
    }); 
  }

  try { 
    // Procura o usuário
    const result = await pool.query( // Query significa consulta. Pool faz com que o ponto de conexão fique sempre ligado, apenas esperando a requisição para dar a reposta
      `SELECT * 
       FROM usuarios
       WHERE nome_usuario = $1`,
      [nome_usuario] //array com os valores que serão passados para a query e serao substituidos no lugar do placeholder $1
    ); 

    if (result.rows.length === 0) { //verifica se o usuário existe se nao existir  o retorna erro 401 (unauthorized)
      return res.status(401).json({ //unauthorized: significa que o usuário não está autorizado a acessar o recurso solicitado 
        erro: "usuário ou senha inválidos",
      });
    }

    const usuario = result.rows[0]; //result.rows[0] significa que retorna apenas a primeira linha do resultado da query (resultado encontrado no banco de dados)

    // Compara a senha digitada com o hash armazenado
    const senhaValida = await bcrypt.compare( //bcrypt.compare compara a senha digitada com o hash armazenado no banco de dados
      senha, //senha digitada pelo usuário
      usuario.senha_hash //hash armazenado no banco de dados
    ); //senha comparada com a senha_hash, o bcrypt.compare transofrma a senha digitada em hash e compara com a senhaHash armazenada no banco de dados

    if (!senhaValida) { //se a senha digitada não for válida, retorna erro 401 (unauthorized)
      return res.status(401).json({ //unauthorized: significa que o usuário não está autorizado a acessar o recurso solicitado
        erro: "usuário ou senha inválidos", 
      });
    }

    // Gera o token 
    const token = jwt.sign( //jwt.sign gera o token jwt (JSON Web Token) que é usado para autenticação e autorização do usuário
      { 
        id: usuario.id,
        nome_usuario: usuario.nome_usuario,
        role: usuario.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    ); //token gerado com as informações do usuário (id, nome_usuario e role) e com a chave secreta (JWT_SECRET) que está armazenada no arquivo .env. O token expira em 8 horas (expiresIn: "8h")

    // Resposta
    res.json({ //retorna a resposta em formato JSON
      mensagem: "Login realizado com sucesso",
      token,
      usuario: {
        id: usuario.id,
        nome_usuario: usuario.nome_usuario,
        role: usuario.role,
      },
    }); 

  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router;