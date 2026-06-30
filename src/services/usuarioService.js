const db = require('../config/db');

const UsuarioService = {

  async getEvaluadores() {
    const [rows] = await db.query(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE rol="evaluador"'
    );
    return rows;
  },

  async create(data) {
    const { nombre, email, password, rol } = data;

    const [result] = await db.query(
      `INSERT INTO usuarios (nombre, email, password, rol, activo)
       VALUES (?, ?, ?, ?, 1)`,
      [nombre, email, password, rol]
    );

    return { id: result.insertId, nombre, email, rol };
  },

  async toggleActivo(id) {
    await db.query(
      'UPDATE usuarios SET activo = NOT activo WHERE id=?',
      [id]
    );
    return true;
  }
};

module.exports = UsuarioService;