require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const SALT_ROUNDS = 10;

if (!JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET no está definido en las variables de entorno.');
}

const authService = {
  /**
   * Genera el hash de una contraseña en texto plano.
   * Usar al crear un usuario o cambiar contraseña.
   */
  async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  /**
   * Compara una contraseña en texto plano contra su hash guardado.
   */
  async compararPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  /**
   * Genera un JWT con la información mínima necesaria del usuario.
   * Incluimos el rol porque roleMiddleware lo necesita sin volver
   * a consultar la base de datos en cada request.
   */
  generarToken(usuario) {
    const payload = {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  /**
   * Verifica y decodifica un JWT. Lanza error si es inválido o expiró;
   * el middleware que lo llama se encarga de capturarlo y responder 401.
   */
  verificarToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },

  /**
   * Genera un token aleatorio criptográficamente seguro para
   * el flujo de recuperación de contraseña (32 bytes -> 64 caracteres hex).
   */
  generarTokenReset() {
    return crypto.randomBytes(32).toString('hex');
  },
};

module.exports = authService;