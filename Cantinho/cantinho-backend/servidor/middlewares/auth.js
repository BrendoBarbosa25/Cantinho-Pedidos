const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  // Obtém o header Authorization
  const authHeader = req.headers.authorization;

  // Verifica se o token foi enviado
  if (!authHeader) {
    return res.status(401).json({
      erro: "Token não informado",
    });
  }

  // Espera o formato: Bearer <token>
  const partes = authHeader.split(" ");

  if (partes.length !== 2) {
    return res.status(401).json({
      erro: "Formato do token inválido",
    });
  }

  const [bearer, token] = partes;

  if (bearer !== "Bearer") {
    return res.status(401).json({
      erro: "Formato do token inválido",
    });
  }

  try {
    // Verifica se o token é válido
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Disponibiliza os dados do usuário para a rota
    req.usuario = payload;

    next();
  } catch (err) {
    return res.status(401).json({
      erro: "Token inválido ou expirado",
    });
  }
}

module.exports = auth;