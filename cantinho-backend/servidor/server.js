//Conecta o .env
require("dotenv").config();

// Constantes de requisição
const express = require("express");
const cors = require("cors");
const garantirSchema = require("./schema");
//Requisição das rotas
const comandasRouter = require("./routes/comandas");
const cardapioRouter = require("./routes/cardapio");
const itensComandaRouter = require("./routes/itensComanda");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ mensagem: "API Cantinho funcionando" });
});

app.use("/comandas", comandasRouter);
app.use("/cardapio", cardapioRouter);
app.use("/itens-comanda", itensComandaRouter);

const PORT = process.env.PORT || 3000;

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
