const authService = require('../services/authService');

/**
 * Middleware de autenticación
 * Verifica que el token sea válido y extrae el usuario
 */
function authMiddleware(req, res, next) {
  console.log('🟡 HEADERS RECIBIDOS:', req.headers.authorization);

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('🔴 SIN TOKEN');
    return res.status(401).json({
      ok: false,
      mensaje: 'No se proporcionó token de autenticación'
    });
  }

  const token = authHeader.split(' ')[1];

  console.log('🟢 TOKEN EXTRAÍDO:', token);

  try {
    const payload = authService.verificarToken(token);
    console.log('🟢 TOKEN VÁLIDO:', payload);

    req.usuario = payload;
    next();
  } catch (error) {
    console.log('🔴 TOKEN INVÁLIDO:', error.message);

    return res.status(401).json({
      ok: false,
      mensaje: 'Token inválido o expirado'
    });
  }
}

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

module.exports = {
  auth: authMiddleware,
  isAdmin: isAdminMiddleware
};