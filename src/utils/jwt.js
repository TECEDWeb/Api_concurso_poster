const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

const Jwt = {

  sign(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '7d'
    });
  },

  verify(token) {
    return jwt.verify(token, JWT_SECRET);
  }
};

module.exports = Jwt;