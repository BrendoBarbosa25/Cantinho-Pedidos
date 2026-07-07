const pool = require("./db");

//Função que garante que o schema do banco vai existir, sem depender do banco
// Se o banco estiver vazio as tabelas surgirão junto com a primeira solicitação
async function garantirSchema() {
  await pool.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome_usuario TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('garcom', 'cozinha', 'admin')),
    criado_em TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS mesas (
    id SERIAL PRIMARY KEY,
    numero INT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'reservada'))
  );

  CREATE TABLE IF NOT EXISTS itens_cardapio (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    preco NUMERIC NOT NULL,
    categoria TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comandas (
    id SERIAL PRIMARY KEY,
    mesa_id INT REFERENCES mesas(id),
    status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada')),
    data_abertura TIMESTAMP DEFAULT NOW(),
    valor_total NUMERIC DEFAULT 0
  );

  CREATE UNIQUE INDEX IF NOT EXISTS uma_comanda_aberta_por_mesa
  ON comandas (mesa_id)
  WHERE status = 'aberta';

  CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    comanda_id INT REFERENCES comandas(id),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pronto', 'entregue')),
    criado_em TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS itens_pedido (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id),
    item_cardapio_id INT REFERENCES itens_cardapio(id),
    quantidade INT NOT NULL,
    observacao TEXT
  );
`);

  console.log("schema garantido (tabelas ok)");
}

module.exports = garantirSchema;
