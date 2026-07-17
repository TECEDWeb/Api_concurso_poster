/**
 * Middleware para verificar si el usuario es administrador
 * Debe usarse DESPUÉS de authMiddleware
 */
function isAdminMiddleware(req, res, next) {
  try {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        ok: false,
        mensaje: 'Usuario no autenticado'
      });
    }

    // Verificar rol - acepta tanto 'admin' como 'Administrador'
    if (usuario.rol !== 'admin' && usuario.rol !== 'Administrador') {
      console.log('🔴 USUARIO NO ADMIN:', usuario.rol);
      return res.status(403).json({
        ok: false,
        mensaje: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    console.log('🟢 USUARIO ADMIN:', usuario.nombre || usuario.usuario);
    next();
  } catch (error) {
    console.error('❌ Error verificando admin:', error);
    return res.status(500).json({
      ok: false,
      mensaje: 'Error al verificar permisos de administrador'
    });
  }
}

// ✅ EXPORTACIÓN CORRECTA - como función
module.exports = isAdminMiddleware;