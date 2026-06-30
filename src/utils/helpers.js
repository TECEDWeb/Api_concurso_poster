const bcrypt = require('bcryptjs');

const Helpers = {

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  },

  generateCode(prefix = 'PRJ') {
    return `${prefix}-${Date.now()}`;
  }
};

module.exports = Helpers;