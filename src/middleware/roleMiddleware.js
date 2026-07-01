
function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {

    console.log('🧪 ROLE DEBUG:', {
      usuario: req.usuario,
      rolUsuario: req.usuario?.rol,
      rolesPermitidos
    });

    if (!req.usuario) {
      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      console.log('🔴 BLOQUEADO POR ROL');
      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permiso para acceder a este recurso.',
      });
    }

    next();
  };
}
module.exports = roleMiddleware;
