const pool = require("./db");

//Função que garante que o schema vai existir, sem depender do banco
async function garantirSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome_usuario TEXT NOT NULL UNIQUE
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK role in ('garcom', 'cozinha', 'admin')
    criado_em TIMESTAMPZ DEFAULT NOW()
    )

    CREATE TABLE IF NOT EXISTS mesas (
      id SERIAL PRIMARY KEY,
      numero INTEGER NOT NULL UNIQUE,
      preco NUMERIC NOT NULL,
      categoria TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS itens_cardapio (
      id SERIAL PRIMARY KEY,
      nome TEXT NOT NULL,
      preco NUMERIC NOT NULL,
      categoria TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comandas (
      id SERIAL PRIMARY KEY,
      numero_mesa INT NOT NULL,
      status TEXT NOT NULL DEFAULT 'aberta',
      data_abertura TIMESTAMP DEFAULT NOW(),
      valor_total NUMERIC DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uma_comanda_aberta_por_mesa
    ON comandas (numero_mesa)
    WHERE status = 'aberta';

    CREATE TABLE IF NOT EXISTS itens_comanda (
      id SERIAL PRIMARY KEY,
      comanda_id INT REFERENCES comandas(id),
      item_cardapio_id INT REFERENCES itens_cardapio(id),
      quantidade INT NOT NULL,
      observacao TEXT
    );
  `);

  console.log("schema garantido (tabelas ok)");
}

module.exports = garantirSchema;
