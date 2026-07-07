function authorize(...rolesPermitidas) {
  return (req, res, next) => {

    // Garante que o middleware auth foi executado antes
    if (!req.usuario) {
      return res.status(401).json({
        erro: "Usuário não autenticado",
      });
    }

    // Verifica se a role do usuário está entre as permitidas
    if (!rolesPermitidas.includes(req.usuario.role)) {
      return res.status(403).json({
        erro: "Acesso negado",
      });
    }

    next();
  };
}

module.exports = authorize;