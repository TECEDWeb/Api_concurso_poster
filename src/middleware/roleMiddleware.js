
function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      // Esto solo pasaría si roleMiddleware se usa sin authMiddleware antes.
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permiso para acceder a este recurso.',
      });
    }

    next();
  };
}

module.exports = roleMiddleware;
