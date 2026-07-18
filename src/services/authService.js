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
  async hashPassword(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  async compararPassword(plainPassword, passwordHash) {
    return bcrypt.compare(plainPassword, passwordHash);
  },

  generarToken(usuario) {
    const payload = {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verificarToken(token) {
    return jwt.verify(token, JWT_SECRET);
  },

  generarTokenReset() {
    return crypto.randomBytes(32).toString('hex');
  },
};

module.exports = authService;