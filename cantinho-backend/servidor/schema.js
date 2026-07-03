const pool = require("./db");

//Função que garante que o schema vai existir, sem depender do banco
async function garantirSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome_usuario TEXT NOT NULL UNIQUE,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role in ('garcom', 'cozinha', 'admin')),
    criado_em TIMESTAMPZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS mesas (
      id SERIAL PRIMARY KEY,
      numero INTEGER NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status in ('disponivel', 'reservada'))
    );

    CREATE TABLE IF NOT EXISTS itens_cardapio (
      id SERIAL PRIMARY KEY,
      mesa_id INT NOT NULL REFERENCES mesas(id) ON DELETE RESTRICT,
      preco NUMERIC NOT NULL CHECK (preco > 0 ),
      categoria TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comandas (
      id SERIAL PRIMARY KEY,
      mesa_id INT NOT NULL REFERENCES mesas(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'aberta' CHECK (status in ('aberta', 'fechada')),
      data_abertura TIMESTAMP DEFAULT NOW(),
      valor_total NUMERIC DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uma_comanda_aberta_por_mesa
    ON comandas (numero_mesa)
    WHERE status = 'aberta';

    CREATE TABLE IF NOT EXISTS pedidos (
      id SERIAL PRIMARY KEY,
      comanda_id INT REFERENCES comandas(id) ON DELETE RESTRICT,
      status TEXT NOT NULL DEFAULT 'pendente' CHECK (status in ('pendente', 'pronto', 'entregue')),
      criado_em TIMESTAMP DEFAULT NOW(),
    );

    CREATE TABLE IF NOT EXISTS itens_comanda (
      id SERIAL PRIMARY KEY,
      comanda_id INT REFERENCES comandas(id) ON DELETE RESTRICT,
      item_cardapio_id INT REFERENCES itens_cardapio(id),
      quantidade INT NOT NULL,
      observacao TEXT
    );
  `);

  console.log("schema garantido (tabelas ok)");
}

module.exports = garantirSchema;
