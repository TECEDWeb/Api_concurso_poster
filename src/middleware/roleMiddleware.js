function roleMiddleware(...rolesPermitidos) {
  return (req, res, next) => {

    console.log('🔵 roleMiddleware');
    console.log('Rol del usuario:', req.usuario?.rol);
    console.log('Roles permitidos:', rolesPermitidos);

    if (!req.usuario) {
      console.log('🔴 No existe req.usuario');

      return res.status(401).json({
        ok: false,
        mensaje: 'No autenticado.',
      });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {

      console.log('🔴 Rol rechazado');

      return res.status(403).json({
        ok: false,
        mensaje: 'No tienes permiso para acceder a este recurso.',
      });
    }

    console.log('🟢 Rol autorizado');

    next();
  };
}

module.exports = roleMiddleware;