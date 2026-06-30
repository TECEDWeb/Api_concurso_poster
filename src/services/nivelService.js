const db = require('../config/db');

const NivelService = {

  async getAll() {
    const [rows] = await db.query('SELECT * FROM niveles');
    return rows;
  },

  async create(data) {
    const [result] = await db.query(
      'INSERT INTO niveles (nombre) VALUES (?)',
      [data.nombre]
    );

    return { id: result.insertId, nombre: data.nombre };
  },

  async update(id, data) {
    await db.query(
      'UPDATE niveles SET nombre=? WHERE id=?',
      [data.nombre, id]
    );

    return true;
  },

  async delete(id) {
    await db.query('DELETE FROM niveles WHERE id=?', [id]);
    return true;
  }
};

module.exports = NivelService;