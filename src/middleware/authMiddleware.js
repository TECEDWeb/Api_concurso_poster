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

// ✅ EXPORTACIÓN CORRECTA - como función
module.exports = authMiddleware;