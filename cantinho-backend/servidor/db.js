// Importa a classe pool da biblioteca 'pg'
const { Pool } = require("pg");

// A criação da Pool, serve como um objeto de rota pro banco de dados
// Impede que várias rotas sejam criadas pelo servidor
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;
