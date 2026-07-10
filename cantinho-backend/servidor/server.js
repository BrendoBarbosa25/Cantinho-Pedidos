//Conecta o .env
require("dotenv").config();

// Constantes de requisição
const express = require("express");
const cors = require("cors");
const garantirSchema = require("./schema");
const dotenv = require("dotenv").config();

//Requisição das rotas
const comandasRouter = require("./routes/comandas");
const cardapioRouter = require("./routes/cardapio");
const itensPedidoRouter = require("./routes/itensPedido");
const usuarioRouter = require("./routes/usuario");
const pedidosRouter = require("./routes/pedidos");
const loginRouter = require("./routes/login");
const mesasRouter = require("./routes/mesas");
const relatoriosRouter = require("./routes/relatorios"); 
const app = express();

app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.json({ mensagem: "Servidor ativo e funcionando" });
});

//Uso das rotas, garantem um crud exclusivo para cada tabela
app.use("/comandas", comandasRouter);
app.use("/cardapio", cardapioRouter);
app.use("/itens-pedido", itensPedidoRouter);
app.use("/usuarios", usuarioRouter);
app.use("/pedidos", pedidosRouter);
app.use("/login", loginRouter)
app.use("/mesas", mesasRouter);
app.use("/relatorios", relatoriosRouter);

const PORT = process.env.PORT || 3000;
//Script simples para garantir o schema e depois conectar com o servidor
garantirSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`rodando na porta ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("erro ao garantir schema:", err);
    process.exit(1);
  });
