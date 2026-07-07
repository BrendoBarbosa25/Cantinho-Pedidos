const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const pool = require("../db");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");

const SALT_ROUNDS = 10;

// Criar usuário
router.post("/", auth, authorize("admin"), async (req, res) => {
  const { nome_usuario, senha, role } = req.body;

  if (!nome_usuario || !senha) {
    return res.status(400).json({
      erro: "nome_usuario e senha são obrigatórios",
    });
  }

  try {
    // Verifica se já existe um usuário com esse nome
    const usuarioExistente = await pool.query(
      "SELECT id FROM usuarios WHERE nome_usuario = $1",
      [nome_usuario]
    );

    if (usuarioExistente.rows.length > 0) {
      return res.status(409).json({
        erro: "nome de usuário já cadastrado",
      });
    }

    // Gera o hash da senha
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    // Cria o usuário
    const result = await pool.query(
      `INSERT INTO usuarios
      (nome_usuario, senha_hash, role)
      VALUES ($1, $2, COALESCE($3, 'garcom'))
      RETURNING id, nome_usuario, role, criado_em`,
      [nome_usuario, senhaHash, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Listar usuários
router.get("/", auth, authorize("admin"), async (req, res) => {
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

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Buscar usuário por id
router.get("/:id", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        id,
        nome_usuario,
        role,
        criado_em
      FROM usuarios
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Atualizar role
router.patch("/:id/role", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!role) {
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
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

// Excluir usuário
router.delete("/:id", auth, authorize(), async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM usuarios WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        erro: "usuário não encontrado",
      });
    }

    res.json({
      mensagem: "usuário removido com sucesso",
    });
  } catch (err) {
    res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router;