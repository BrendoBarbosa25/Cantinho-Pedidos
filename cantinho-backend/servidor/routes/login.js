const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../db");

// Login
router.post("/", async (req, res) => {
  const { nome_usuario, senha } = req.body;

  // Validação
  if (!nome_usuario || !senha) {
    return res.status(400).json({
      erro: "nome_usuario e senha são obrigatórios",
    });
  }

  try {
    // Procura o usuário
    const result = await pool.query(
      `SELECT *
       FROM usuarios
       WHERE nome_usuario = $1`,
      [nome_usuario]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        erro: "usuário ou senha inválidos",
      });
    }

    const usuario = result.rows[0];

    // Compara a senha digitada com o hash armazenado
    const senhaValida = await bcrypt.compare(
      senha,
      usuario.senha_hash
    );

    if (!senhaValida) {
      return res.status(401).json({
        erro: "usuário ou senha inválidos",
      });
    }

    // Gera o token
    const token = jwt.sign(
      {
        id: usuario.id,
        nome_usuario: usuario.nome_usuario,
        role: usuario.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // Resposta
    res.json({
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